import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../errors/appError';
import { ICreatePaymentInput, IConfirmPaymentInput, IPaymentQuery } from './payment.validation';

// Initialize Stripe Client with secret key from environment
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Payment Intent and save a pending payment record.
 */
const createPaymentIntent = async (tenantId: string, payload: ICreatePaymentInput) => {
  const { rentalRequestId } = payload;

  // 1. Verify rental request exists
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { property: true },
  });

  if (!rental) {
    throw new NotFoundError('Rental request not found');
  }

  // 2. Only the tenant who owns the request can pay
  if (rental.tenantId !== tenantId) {
    throw new ForbiddenError('You do not have permission to pay for this rental request');
  }

  // 3. Only APPROVED requests can be paid
  if (rental.status !== 'APPROVED') {
    throw new BadRequestError('Only approved rental requests can be paid');
  }

  // 4. Prevent duplicate completed payments
  const completedPayment = await prisma.payment.findFirst({
    where: {
      rentalRequestId,
      status: 'COMPLETED',
    },
  });

  if (completedPayment) {
    throw new ConflictError('This rental request has already been paid');
  }

  // 5. Clean up previous pending payments to prevent conflicts
  await prisma.payment.deleteMany({
    where: {
      rentalRequestId,
      status: 'PENDING',
    },
  });

  // 6. Create Stripe Payment Intent (amount in cents)
  const amountInCents = Math.round(Number(rental.totalPrice) * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: {
      rentalRequestId,
      tenantId,
    },
  });

  // 7. Store PENDING Payment record in database
  const payment = await prisma.payment.create({
    data: {
      rentalRequestId,
      amount: rental.totalPrice,
      status: 'PENDING',
      paymentMethod: 'STRIPE',
      transactionReference: paymentIntent.id,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment.id,
  };
};

/**
 * Confirm the payment with Stripe and update booking/payment records on success.
 */
const confirmPayment = async (tenantId: string, payload: IConfirmPaymentInput) => {
  const { rentalRequestId, paymentIntentId } = payload;

  // 1. Retrieve the payment intent from Stripe to verify status
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    throw new BadRequestError('Invalid Payment Intent ID');
  }

  const isSuccess = paymentIntent.status === 'succeeded';

  // 2. Find the pending payment record
  const payment = await prisma.payment.findUnique({
    where: { transactionReference: paymentIntentId },
  });

  if (!payment) {
    throw new NotFoundError('Payment record not found');
  }

  if (payment.rentalRequestId !== rentalRequestId) {
    throw new BadRequestError('Payment record does not match the rental request');
  }

  // Verify ownership
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
  });

  if (!rental || rental.tenantId !== tenantId) {
    throw new ForbiddenError('You do not have permission to confirm this payment');
  }

  if (isSuccess) {
    // Run DB updates in transaction to ensure consistency
    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      }),
      prisma.rentalRequest.update({
        where: { id: rentalRequestId },
        data: {
          status: 'ACTIVE',
        },
      }),
    ]);

    return updatedPayment;
  } else {
    // Update status to FAILED in case payment failed
    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
      },
    });
  }
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

  // Query database in transaction
  const [total, payments] = await prisma.$transaction([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: {
        paidAt: 'desc',
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
    }),
  ]);

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
 * Retrieve detailed information of a payment. Must belong to the requesting tenant.
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
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentDetails,
};
