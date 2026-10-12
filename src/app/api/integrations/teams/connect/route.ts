import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { auth } from "@/auth";
import { TEAMS_SCOPES } from "@/lib/integrations/teams-token";
import { teamsRedirectUri } from "@/lib/integrations/teams-url";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!process.env.TEAMS_CLIENT_ID || !process.env.TEAMS_TENANT_ID) {
    return NextResponse.json(
      { error: "Set TEAMS_CLIENT_ID and TEAMS_TENANT_ID before connecting Teams." },
      { status: 400 },
    );
  }

  const state = crypto.randomBytes(24).toString("hex");

  const authorizeUrl = new URL(
    `https://login.microsoftonline.com/${process.env.TEAMS_TENANT_ID}/oauth2/v2.0/authorize`,
  );
  authorizeUrl.searchParams.set("client_id", process.env.TEAMS_CLIENT_ID);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", teamsRedirectUri());
  authorizeUrl.searchParams.set("response_mode", "query");
  authorizeUrl.searchParams.set("scope", TEAMS_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "consent");

  const res = NextResponse.redirect(authorizeUrl.toString());
  res.cookies.set("teams_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
