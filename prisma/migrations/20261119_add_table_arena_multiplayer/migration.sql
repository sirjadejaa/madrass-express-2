-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "GameType" AS ENUM ('TIC_TAC_TOE', 'ROCK_PAPER_SCISSORS', 'QUIZ_BATTLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GameMatchStatus" AS ENUM ('WAITING_FOR_PLAYER', 'INVITED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GameMode" AS ENUM ('SAME_TABLE', 'CROSS_TABLE', 'PASS_AND_PLAY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable RestaurantSetting
ALTER TABLE "RestaurantSetting"
  ADD COLUMN IF NOT EXISTS "arenaEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "arenaCrossTableEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "arenaTicTacToeEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "arenaRpsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "arenaQuizBattleEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "arenaInviteExpirySeconds" INTEGER NOT NULL DEFAULT 180;

-- CreateTable GameMatch
CREATE TABLE IF NOT EXISTS "GameMatch" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "gameType" "GameType" NOT NULL,
  "mode" "GameMode" NOT NULL DEFAULT 'SAME_TABLE',
  "status" "GameMatchStatus" NOT NULL DEFAULT 'WAITING_FOR_PLAYER',
  "hostTableId" TEXT NOT NULL,
  "hostPlayerId" TEXT NOT NULL,
  "hostPlayerName" TEXT NOT NULL DEFAULT 'Player 1',
  "guestTableId" TEXT,
  "guestPlayerId" TEXT,
  "guestPlayerName" TEXT,
  "currentTurnPlayerId" TEXT,
  "winnerPlayerId" TEXT,
  "isDraw" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "gameState" JSONB NOT NULL,
  "inviteCode" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "GameMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable GameMove
CREATE TABLE IF NOT EXISTS "GameMove" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "moveNumber" INTEGER NOT NULL,
  "moveData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GameMove_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey GameMatch
DO $$ BEGIN
  ALTER TABLE "GameMatch" ADD CONSTRAINT "GameMatch_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "GameMatch" ADD CONSTRAINT "GameMatch_hostTableId_fkey" FOREIGN KEY ("hostTableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "GameMatch" ADD CONSTRAINT "GameMatch_guestTableId_fkey" FOREIGN KEY ("guestTableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey GameMove
DO $$ BEGIN
  ALTER TABLE "GameMove" ADD CONSTRAINT "GameMove_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "GameMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GameMatch_restaurantId_status_idx" ON "GameMatch"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "GameMatch_hostTableId_status_idx" ON "GameMatch"("hostTableId", "status");
CREATE INDEX IF NOT EXISTS "GameMatch_guestTableId_status_idx" ON "GameMatch"("guestTableId", "status");
CREATE INDEX IF NOT EXISTS "GameMatch_inviteCode_idx" ON "GameMatch"("inviteCode");
CREATE INDEX IF NOT EXISTS "GameMatch_createdAt_idx" ON "GameMatch"("createdAt");
CREATE INDEX IF NOT EXISTS "GameMove_matchId_moveNumber_idx" ON "GameMove"("matchId", "moveNumber");
