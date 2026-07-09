import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.middleware';
import {
  createPaymentSchema,
  confirmPaymentSchema,
  paymentIdParamSchema,
  paymentQuerySchema,
} from './payment.validation';
import { auth } from '../../middlewares/auth.middleware';

const paymentRouter = Router();

// Apply TENANT auth guard globally for all payment endpoints
paymentRouter.use(auth(UserRole.TENANT));

/**
 * @route POST /api/payments/create
 * @desc Create payment intent
 * @access Tenant
 */
paymentRouter.post(
  '/create',
  validateBody(createPaymentSchema),
  PaymentController.createPaymentIntent,
);

/**
 * @route POST /api/payments/confirm
 * @desc Confirm payment intent status
 * @access Tenant
 */
paymentRouter.post(
  '/confirm',
  validateBody(confirmPaymentSchema),
  PaymentController.confirmPayment,
);

/**
 * @route GET /api/payments
 * @desc Get tenant payment history
 * @access Tenant
 */
paymentRouter.get('/', validateQuery(paymentQuerySchema), PaymentController.getPaymentHistory);

/**
 * @route GET /api/payments/:id
 * @desc Get payment details
 * @access Tenant
 */
paymentRouter.get(
  '/:id',
  validateParams(paymentIdParamSchema),
  PaymentController.getPaymentDetails,
);

export const PaymentRoutes = paymentRouter;
