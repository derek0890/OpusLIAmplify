import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/integrations/teams-token";
import { teamsRedirectUri } from "@/lib/integrations/teams-url";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) {
    return redirectWithStatus(req, "error", url.searchParams.get("error_description") ?? error);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = req.cookies.get("teams_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithStatus(req, "error", "Invalid or expired connect request — try again.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code, teamsRedirectUri());

    // Singleton row: replace whatever connection existed before.
    await prisma.teamsIntegration.deleteMany({});
    await prisma.teamsIntegration.create({
      data: {
        refreshToken: tokens.refresh_token!,
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        connectedById: session.user.id,
      },
    });
  } catch (err) {
    console.error("[teams-integration] token exchange failed:", err);
    return redirectWithStatus(req, "error", "Failed to connect Teams — check server logs.");
  }

  const res = redirectWithStatus(req, "connected");
  res.cookies.delete("teams_oauth_state");
  return res;
}

function redirectWithStatus(req: NextRequest, status: string, message?: string) {
  const dest = new URL("/admin/integrations", req.url);
  dest.searchParams.set("teams", status);
  if (message) dest.searchParams.set("message", message);
  return NextResponse.redirect(dest);
}
