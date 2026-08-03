-- Extend the payment state machine for expired Checkout Sessions.
ALTER TYPE "PaymentStatus"
ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Add Stripe and payment-audit fields only when they do not already exist.
ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeChargeId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "customerEmail" TEXT,
ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT,
ADD COLUMN IF NOT EXISTS "failureReason" TEXT,
ADD COLUMN IF NOT EXISTS "webhookEventId" TEXT;

-- Allow paymentMethod to remain empty until Stripe resolves the payment.
ALTER TABLE "payments"
ALTER COLUMN "paymentMethod" DROP NOT NULL;

-- Store processed Stripe event IDs.
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripeSessionId_key"
ON "payments"("stripeSessionId");

CREATE INDEX IF NOT EXISTS "payments_userId_idx"
ON "payments"("userId");

CREATE INDEX IF NOT EXISTS "payments_stripeSessionId_idx"
ON "payments"("stripeSessionId");

-- Add foreign key only if it does not already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payments_userId_fkey'
    ) THEN
        ALTER TABLE "payments"
        ADD CONSTRAINT "payments_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "users"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;