import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../errors/appError';
import { ICheckoutInput, IPaymentQuery } from './payment.validation';

// Initialize Stripe Client
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * Create a dynamic Stripe Hosted Checkout Session and store/update a pending Payment record.
 * Stores paymentId, rentalRequestId, and tenantId inside Stripe metadata.
 */
const createCheckoutSession = async (tenantId: string, payload: ICheckoutInput) => {
  const { rentalRequestId } = payload;

  // 1. Verify rental request exists
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { property: true, tenant: true },
  });

  if (!rental) {
    throw new NotFoundError('Rental request not found');
  }

  // 2. Verify ownership: Only the tenant who created the request can pay
  if (rental.tenantId !== tenantId) {
    throw new ForbiddenError('You do not have permission to pay for this rental request');
  }

  // 3. Verify status: Only APPROVED requests can be paid
  if (rental.status === 'ACTIVE') {
    throw new ConflictError('This rental request is already active and paid');
  }

  if (rental.status !== 'APPROVED') {
    throw new BadRequestError('Only approved rental requests can be paid');
  }

  // 4. Ensure it has not already been paid
  const completedPayment = await prisma.payment.findFirst({
    where: {
      rentalRequestId,
      status: 'COMPLETED',
    },
  });

  if (completedPayment) {
    throw new ConflictError('This rental request has already been paid');
  }

  // 5. Calculate payable amount directly from database (Never trust client amount)
  const amountInCents = Math.round(Number(rental.totalPrice) * 100);

  // 6. Store or find pending Payment record first to obtain paymentId
  let pendingPayment = await prisma.payment.findFirst({
    where: {
      rentalRequestId,
      status: 'PENDING',
    },
  });

  if (!pendingPayment) {
    pendingPayment = await prisma.payment.create({
      data: {
        rentalRequestId,
        userId: tenantId,
        amount: rental.totalPrice,
        currency: 'usd',
        status: 'PENDING',
        paymentMethod: 'STRIPE',
      },
    });
  }

  // 7. Create Stripe Checkout Session with full metadata (paymentId, rentalRequestId, tenantId)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Rental Payment: ${rental.property.title}`,
            description: `Rental Period: ${new Date(rental.startDate).toISOString().split('T')[0]} to ${new Date(rental.endDate).toISOString().split('T')[0]}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    customer_email: rental.tenant?.email || undefined,
    client_reference_id: rental.id,
    metadata: {
      paymentId: pendingPayment.id,
      rentalRequestId: rental.id,
      tenantId,
    },
    success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
  });

  // 8. Link stripeSessionId to Payment record
  await prisma.payment.update({
    where: { id: pendingPayment.id },
    data: {
      stripeSessionId: session.id,
    },
  });

  logger.info(`Checkout Session created: [${session.id}] for RentalRequest: ${rental.id}`);

  return {
    url: session.url!,
  };
};

/**
 * Retrieve Checkout Session status directly from Stripe.
 * IMPORTANT: MUST NEVER MODIFY THE DATABASE.
 */
const verifyCheckoutSession = async (sessionId: string) => {
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    throw new BadRequestError('Invalid or expired Stripe Checkout Session ID');
  }

  return {
    id: session.id,
    paymentStatus: session.payment_status,
    status: session.status,
    amountTotal: session.amount_total ? session.amount_total / 100 : null,
    currency: session.currency,
    customerEmail: session.customer_details?.email || session.customer_email || null,
  };
};

/**
 * Handle incoming Stripe Webhook events with signature verification and idempotent DB updates.
 * ALL DATABASE UPDATES FOR PAYMENTS HAPPEN HERE ONLY.
 */
const handleWebhook = async (rawBody: Buffer | string, signature: string) => {
  let event: Stripe.Event;

  // 1. Verify Stripe Webhook signature using STRIPE_WEBHOOK_SECRET
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const error = err as Error;
    logger.error(`Webhook Signature Verification Failed: ${error.message}`);
    throw new BadRequestError(`Webhook signature verification failed: ${error.message}`);
  }

  logger.info(`Stripe Webhook Received: [${event.type}] (ID: ${event.id})`);

  // 2. Idempotency Check: Prevent duplicate processing of the same event ID
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { id: event.id },
  });

  if (existingEvent) {
    logger.info(`Webhook event ${event.id} already processed. Skipping DB update.`);
    return { received: true, message: 'Event already processed' };
  }

  // 3. Process events atomically inside a Prisma Transaction
  await prisma.$transaction(async (tx) => {
    // Record event as processed for idempotency
    await tx.webhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentId = session.metadata?.paymentId;
      const rentalRequestId = session.metadata?.rentalRequestId || session.client_reference_id;
      const tenantId = session.metadata?.tenantId;

      let paymentIntentId: string | null = null;
      let chargeId: string | null = null;
      let customerId: string | null = null;
      let paymentMethod: string | null = null;
      let receiptUrl: string | null = null;

      if (typeof session.payment_intent === 'string') {
        paymentIntentId = session.payment_intent;
        try {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['latest_charge'],
          });
          if (pi.latest_charge && typeof pi.latest_charge !== 'string') {
            chargeId = pi.latest_charge.id;
            receiptUrl = pi.latest_charge.receipt_url || null;
            if (pi.latest_charge.payment_method_details?.type) {
              paymentMethod = pi.latest_charge.payment_method_details.type;
            }
          }
        } catch (error) {
          logger.warn('Could not expand payment intent details:', error);
        }
      } else if (session.payment_intent) {
        paymentIntentId = session.payment_intent.id;
      }

      if (typeof session.customer === 'string') {
        customerId = session.customer;
      } else if (session.customer) {
        customerId = session.customer.id;
      }

      const customerEmail = session.customer_details?.email || session.customer_email || null;
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
      const currency = session.currency || 'usd';

      // Find the Payment record using metadata paymentId, stripeSessionId, or rentalRequestId
      let payment = await tx.payment.findFirst({
        where: {
          OR: [
            ...(paymentId ? [{ id: paymentId }] : []),
            { stripeSessionId: session.id },
            ...(rentalRequestId ? [{ rentalRequestId, status: 'PENDING' as const }] : []),
          ],
        },
      });

      if (payment) {
        // Prevent duplicate updates if payment is already COMPLETED
        if (payment.status === 'COMPLETED') {
          logger.info(`Payment ${payment.id} already marked COMPLETED.`);
          return;
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            stripeChargeId: chargeId,
            stripeCustomerId: customerId,
            customerEmail,
            transactionReference: paymentIntentId || session.id,
            paymentMethod: paymentMethod || 'STRIPE',
            receiptUrl,
            paidAt: new Date(),
            webhookEventId: event.id,
            amount: amountPaid > 0 ? amountPaid : payment.amount,
            currency,
            userId: tenantId || payment.userId,
          },
        });
        logger.info(`Payment ${payment.id} updated to COMPLETED in database.`);
      } else if (rentalRequestId) {
        // Fallback: Create payment record if not found
        payment = await tx.payment.create({
          data: {
            rentalRequestId,
            userId: tenantId,
            amount: amountPaid,
            currency,
            status: 'COMPLETED',
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            stripeChargeId: chargeId,
            stripeCustomerId: customerId,
            customerEmail,
            transactionReference: paymentIntentId || session.id,
            paymentMethod: paymentMethod || 'STRIPE',
            receiptUrl,
            paidAt: new Date(),
            webhookEventId: event.id,
          },
        });
        logger.info(`Fallback Payment ${payment.id} created and set to COMPLETED.`);
      }

      // Update Rental Request status from APPROVED -> ACTIVE
      if (rentalRequestId) {
        await tx.rentalRequest.update({
          where: { id: rentalRequestId },
          data: { status: 'ACTIVE' },
        });
        logger.info(`RentalRequest ${rentalRequestId} updated from APPROVED to ACTIVE.`);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

      const payment = await tx.payment.findFirst({
        where: {
          OR: [
            { stripePaymentIntentId: paymentIntent.id },
            { transactionReference: paymentIntent.id },
          ],
        },
      });

      if (payment && payment.status !== 'COMPLETED') {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason,
            webhookEventId: event.id,
          },
        });
        logger.info(`Payment ${payment.id} updated to FAILED.`);
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await tx.payment.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (payment && payment.status === 'PENDING') {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CANCELLED',
            webhookEventId: event.id,
          },
        });
        logger.info(`Payment ${payment.id} updated to CANCELLED.`);
      }
    }
  });

  return { received: true };
};

/**
 * Retrieve paginated payment history for the authenticated tenant.
 */
const getPaymentHistory = async (tenantId: string, query: IPaymentQuery) => {
  const { page, limit } = query;

  const where: Prisma.PaymentWhereInput = {
    rentalRequest: {
      tenantId,
    },
  };

  const skip = (page - 1) * limit;
  const take = limit;

  const total = await prisma.payment.count({
    where,
  });

  const payments = await prisma.payment.findMany({
    where,
    skip,
    take,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      rentalRequest: {
        include: {
          property: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: payments,
  };
};

/**
 * Retrieve detailed information of a payment.
 */
const getPaymentDetails = async (id: string, tenantId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      rentalRequest: {
        include: {
          property: true,
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError('Payment record not found');
  }

  if (payment.rentalRequest.tenantId !== tenantId) {
    throw new ForbiddenError('You do not have permission to view this payment details');
  }

  return payment;
};

export const PaymentService = {
  createCheckoutSession,
  verifyCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getPaymentDetails,
};
