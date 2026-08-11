import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { ApiResponse } from '../../utils/apiResponse';
import { paymentQuerySchema } from './payment.validation';
import { BadRequestError } from '../../errors/appError';

/**
 * Controller creating a dynamic Stripe Checkout Session.
 * Returns { "url": "https://checkout.stripe.com/..." }
 */
const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await PaymentService.createCheckoutSession(userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller verifying a Stripe Checkout Session status without modifying the database.
 */
const verifyCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string;
    const tenantId = req.user!.id;
    const result = await PaymentService.verifyCheckoutSession(sessionId, tenantId);
    ApiResponse.success(res, 200, 'Session status retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller processing incoming Stripe Webhook events idempotently.
 */
const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      throw new BadRequestError('Missing stripe-signature header');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody || req.body;
    const result = await PaymentService.handleWebhook(rawBody, signature as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller listing payment history made by the authenticated tenant.
 */
const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const parsed = paymentQuerySchema.parse(req.query);

    const result = await PaymentService.getPaymentHistory(tenantId, parsed);
    ApiResponse.success(
      res,
      200,
      'Payment history retrieved successfully',
      result.data,
      result.meta,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving details of a single payment by ID.
 */
const getPaymentDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tenantId = req.user!.id;
    const result = await PaymentService.getPaymentDetails(id, tenantId);
    ApiResponse.success(res, 200, 'Payment details retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const PaymentController = {
  createCheckoutSession,
  verifyCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  getPaymentDetails,
};
