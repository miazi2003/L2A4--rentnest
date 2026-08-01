import { ICheckoutInput, IPaymentQuery } from './payment.validation';

export type { ICheckoutInput, IPaymentQuery };

export interface ICheckoutResponse {
  url: string;
}

export interface IVerifySessionResponse {
  id: string;
  paymentStatus: string;
  status: string | null;
  amountTotal: number | null;
  currency: string | null;
  customerEmail: string | null;
}
