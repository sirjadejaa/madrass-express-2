-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ServiceRequestType" AS ENUM ('CALL_WAITER', 'WATER', 'EXTRA_PLATES', 'CUTLERY', 'BILL', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable RestaurantSetting
ALTER TABLE "RestaurantSetting"
  ADD COLUMN IF NOT EXISTS "wifiEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "wifiSSID" TEXT,
  ADD COLUMN IF NOT EXISTS "wifiPassword" TEXT,
  ADD COLUMN IF NOT EXISTS "wifiInstructions" TEXT,
  ADD COLUMN IF NOT EXISTS "gamesEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "gameRewardEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "gameRewardCouponCode" TEXT,
  ADD COLUMN IF NOT EXISTS "gameRewardMinScore" INTEGER NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS "exploreMoreEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "serviceRequestsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "serviceRequestCooldownSeconds" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS "notificationSoundEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable ServiceRequest
CREATE TABLE IF NOT EXISTS "ServiceRequest" (
  "id" TEXT NOT NULL,
  "type" "ServiceRequestType" NOT NULL,
  "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "cancelReason" TEXT,
  "tableId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),

  CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable QuizQuestion
CREATE TABLE IF NOT EXISTS "QuizQuestion" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "options" TEXT[] NOT NULL,
  "correctIndex" INTEGER NOT NULL DEFAULT 0,
  "explanation" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable GameRewardClaim
CREATE TABLE IF NOT EXISTS "GameRewardClaim" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "orderId" TEXT,
  "tableId" TEXT,
  "customerPhone" TEXT,
  "score" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "rewardCode" TEXT NOT NULL,
  "rewardDetails" TEXT,
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GameRewardClaim_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey ServiceRequest
DO $$ BEGIN
  ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey QuizQuestion
DO $$ BEGIN
  ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey GameRewardClaim
DO $$ BEGIN
  ALTER TABLE "GameRewardClaim" ADD CONSTRAINT "GameRewardClaim_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServiceRequest_restaurantId_status_idx" ON "ServiceRequest"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "ServiceRequest_tableId_status_idx" ON "ServiceRequest"("tableId", "status");
CREATE INDEX IF NOT EXISTS "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");
CREATE INDEX IF NOT EXISTS "QuizQuestion_restaurantId_isActive_idx" ON "QuizQuestion"("restaurantId", "isActive");
CREATE INDEX IF NOT EXISTS "GameRewardClaim_restaurantId_orderId_idx" ON "GameRewardClaim"("restaurantId", "orderId");
CREATE INDEX IF NOT EXISTS "GameRewardClaim_restaurantId_tableId_idx" ON "GameRewardClaim"("restaurantId", "tableId");
