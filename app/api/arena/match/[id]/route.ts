import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ArenaService } from "@/lib/arena/arena-service";
import { GameMatchStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    const clientVersionStr = searchParams.get("version");

    if (!matchId) {
      return NextResponse.json({ error: "Missing match ID" }, { status: 400 });
    }

    if (!playerId) {
      return NextResponse.json({ error: "Missing player ID" }, { status: 400 });
    }

    const match = await db.gameMatch.findUnique({
      where: { id: matchId },
      include: {
        hostTable: { select: { number: true } },
        guestTable: { select: { number: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check expiration for pending matches
    if (
      (match.status === GameMatchStatus.WAITING_FOR_PLAYER ||
        match.status === GameMatchStatus.INVITED) &&
      new Date() > match.expiresAt
    ) {
      const expiredMatch = await db.gameMatch.update({
        where: { id: match.id },
        data: { status: GameMatchStatus.EXPIRED, version: { increment: 1 } },
        include: {
          hostTable: { select: { number: true } },
          guestTable: { select: { number: true } },
        },
      });
      return NextResponse.json({
        success: true,
        match: ArenaService.sanitizeMatch(expiredMatch, playerId),
      });
    }

    // Bandwidth optimization: if client version matches current version, return 304 or unchanged flag
    const clientVersion = clientVersionStr ? parseInt(clientVersionStr, 10) : null;
    if (clientVersion !== null && clientVersion === match.version) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        version: match.version,
      });
    }

    const sanitized = ArenaService.sanitizeMatch(match, playerId);
    return NextResponse.json({
      success: true,
      unchanged: false,
      match: sanitized,
    });
  } catch (error: any) {
    console.error("Arena sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync match state" },
      { status: 500 }
    );
  }
}
