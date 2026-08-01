import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.middleware';
import {
  checkoutSchema,
  verifySessionParamSchema,
  paymentIdParamSchema,
  paymentQuerySchema,
} from './payment.validation';
import { auth } from '../../middlewares/auth.middleware';

const paymentRouter = Router();

/**
 * @route POST /api/payments/webhook
 * @desc Stripe webhook listener (Must be public to receive Stripe events)
 * @access Public
 */
paymentRouter.post('/webhook', PaymentController.handleWebhook);

/**
 * @route GET /api/payments/verify/:sessionId
 * @desc Retrieve Stripe checkout session status without DB modifications
 * @access Public / Authenticated
 */
paymentRouter.get(
  '/verify/:sessionId',
  validateParams(verifySessionParamSchema),
  PaymentController.verifyCheckoutSession,
);

/**
 * @route POST /api/payments/checkout
 * @desc Create dynamic Stripe Checkout Session
 * @access Tenant
 */
paymentRouter.post(
  '/create',
  auth(UserRole.TENANT),
  validateBody(checkoutSchema),
  PaymentController.createCheckoutSession,
);

/**
 * @route GET /api/payments
 * @desc Get tenant payment history
 * @access Tenant
 */
paymentRouter.get(
  '/',
  auth(UserRole.TENANT),
  validateQuery(paymentQuerySchema),
  PaymentController.getPaymentHistory,
);

/**
 * @route GET /api/payments/:id
 * @desc Get detailed payment info
 * @access Tenant
 */
paymentRouter.get(
  '/:id',
  auth(UserRole.TENANT),
  validateParams(paymentIdParamSchema),
  PaymentController.getPaymentDetails,
);

export const PaymentRoutes = paymentRouter;
