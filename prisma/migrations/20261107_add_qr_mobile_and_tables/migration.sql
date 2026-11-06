-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OrderSource" AS ENUM ('KIOSK', 'QR_MOBILE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable Table
ALTER TABLE "Table" 
  ADD COLUMN IF NOT EXISTS "qrToken" TEXT,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "capacity" INTEGER,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex for Table
CREATE UNIQUE INDEX IF NOT EXISTS "Table_qrToken_key" ON "Table"("qrToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Table_restaurantId_number_key" ON "Table"("restaurantId", "number");

-- AlterTable Order
ALTER TABLE "Order" 
  ADD COLUMN IF NOT EXISTS "source" "OrderSource" NOT NULL DEFAULT 'KIOSK',
  ADD COLUMN IF NOT EXISTS "trackingToken" TEXT;

-- CreateIndex for Order
CREATE UNIQUE INDEX IF NOT EXISTS "Order_trackingToken_key" ON "Order"("trackingToken");
CREATE INDEX IF NOT EXISTS "Order_source_idx" ON "Order"("source");
