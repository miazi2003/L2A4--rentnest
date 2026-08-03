-- Extend the payment state machine for expired Checkout Sessions.
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Add Stripe and payment-audit fields introduced after the initial schema.
ALTER TABLE "payments"
ADD COLUMN "userId" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN "stripeSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "stripeChargeId" TEXT,
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "receiptUrl" TEXT,
ADD COLUMN "failureReason" TEXT,
ADD COLUMN "webhookEventId" TEXT;

-- The original schema required a payment method before Stripe had resolved it.
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" DROP NOT NULL;

-- Persist processed Stripe event IDs to make webhook handling idempotent.
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_stripeSessionId_key" ON "payments"("stripeSessionId");
CREATE INDEX "payments_userId_idx" ON "payments"("userId");
CREATE INDEX "payments_stripeSessionId_idx" ON "payments"("stripeSessionId");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
