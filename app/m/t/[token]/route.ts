import { NextRequest, NextResponse } from "next/server";
import { resolveTableByToken } from "@/lib/tables/table-service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    token: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const token = params?.token;
  const result = await resolveTableByToken(token);

  if (!result.valid || !result.table || !result.restaurant) {
    const errorUrl = new URL("/m/invalid-qr", request.url);
    if (result.error) {
      errorUrl.searchParams.set("error", result.error);
    }
    const response = NextResponse.redirect(errorUrl, 307);
    // Clear any existing invalid table session cookie
    response.cookies.delete("madrass_table_session");
    return response;
  }

  // Construct secure session data locked to this validated table and token
  const sessionData = JSON.stringify({
    tableId: result.table.id,
    tableName: result.table.number,
    restaurantId: result.restaurant.id,
    qrToken: token,
  });

  // Redirect directly to the menu homepage with locked table session
  const redirectUrl = new URL("/kiosk/menu", request.url);
  const response = NextResponse.redirect(redirectUrl, 307);

  // Set secure table session cookie inside authorized Route Handler context
  response.cookies.set("madrass_table_session", sessionData, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 6, // 6 hours
  });

  return response;
}
