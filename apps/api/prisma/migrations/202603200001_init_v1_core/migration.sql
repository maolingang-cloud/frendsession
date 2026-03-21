-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('waiting_for_guest', 'free_text', 'pending_payment', 'paid_media', 'free_text_return', 'expired');

-- CreateEnum
CREATE TYPE "SessionCapability" AS ENUM ('text', 'image_message', 'video_message', 'audio_call', 'video_call');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('initiator', 'guest', 'system');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'video', 'system', 'payment_request');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'expired');

-- CreateEnum
CREATE TYPE "TimerWindowKind" AS ENUM ('free', 'paid');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "initiatorDisplayName" TEXT NOT NULL,
    "joinToken" TEXT NOT NULL,
    "joinUrl" TEXT NOT NULL,
    "state" "SessionState" NOT NULL,
    "currentWindowKind" "TimerWindowKind",
    "currentWindowStartsAt" TIMESTAMP(3),
    "currentWindowEndsAt" TIMESTAMP(3),
    "enabledCapabilities" JSONB NOT NULL,
    "pendingQuoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" "ParticipantRole" NOT NULL,
    "type" "MessageType" NOT NULL,
    "text" TEXT,
    "mediaUrl" TEXT,
    "previewUrl" TEXT,
    "paymentQuoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentQuote" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_joinToken_key" ON "ChatSession"("joinToken");

-- CreateIndex
CREATE INDEX "ChatSession_initiatorId_createdAt_idx" ON "ChatSession"("initiatorId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatSession_state_updatedAt_idx" ON "ChatSession"("state", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatSession_pendingQuoteId_idx" ON "ChatSession"("pendingQuoteId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestParticipant_sessionId_key" ON "GuestParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "GuestParticipant_joinedAt_idx" ON "GuestParticipant"("joinedAt");

-- CreateIndex
CREATE INDEX "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_paymentQuoteId_idx" ON "Message"("paymentQuoteId");

-- CreateIndex
CREATE INDEX "PaymentQuote_sessionId_createdAt_idx" ON "PaymentQuote"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentQuote_status_createdAt_idx" ON "PaymentQuote"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentOrder_sessionId_createdAt_idx" ON "PaymentOrder"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentOrder_quoteId_idx" ON "PaymentOrder"("quoteId");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_createdAt_idx" ON "PaymentOrder"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestParticipant" ADD CONSTRAINT "GuestParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_paymentQuoteId_fkey" FOREIGN KEY ("paymentQuoteId") REFERENCES "PaymentQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentQuote" ADD CONSTRAINT "PaymentQuote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "PaymentQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
