import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { ApiResponse } from '../../utils/apiResponse';
import { paymentQuerySchema } from './payment.validation';

/**
 * Controller creating a Stripe Payment Intent for a rental request.
 */
const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const result = await PaymentService.createPaymentIntent(tenantId, req.body);
    ApiResponse.success(res, 201, 'Payment intent created successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller confirming Stripe payment success or failure.
 */
const confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const result = await PaymentService.confirmPayment(tenantId, req.body);
    ApiResponse.success(res, 200, 'Payment status processed successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller listing payments history made by the authenticated tenant.
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
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentDetails,
};
