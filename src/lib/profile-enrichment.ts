import { prisma } from "@/lib/prisma";
import { getGoogleServiceAccountToken } from "@/lib/google-service-account";

const DIRECTORY_SCOPE = "https://www.googleapis.com/auth/admin.directory.user.readonly";

type Enriched = { jobTitle: string | null; department: string | null } | null;

function isMicrosoft(): boolean {
  return !!process.env.SSO_ISSUER?.includes("microsoftonline.com");
}

function isGoogle(): boolean {
  return !!process.env.SSO_ISSUER?.includes("accounts.google.com");
}

async function fetchFromMicrosoftGraph(accessToken: string): Promise<Enriched> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me?$select=jobTitle,department", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Microsoft Graph /me failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { jobTitle?: string | null; department?: string | null };
  return { jobTitle: data.jobTitle ?? null, department: data.department ?? null };
}

async function fetchFromGoogleDirectory(email: string): Promise<Enriched> {
  const adminEmail = process.env.GOOGLE_DIRECTORY_ADMIN_EMAIL;
  if (!adminEmail || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }

  const token = await getGoogleServiceAccountToken(DIRECTORY_SCOPE, adminEmail);
  const res = await fetch(
    `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Google Directory users.get failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    organizations?: { title?: string; department?: string; primary?: boolean }[];
  };
  const org =
    data.organizations?.find((o) => o.primary) ?? data.organizations?.[0] ?? undefined;
  return { jobTitle: org?.title ?? null, department: org?.department ?? null };
}

/**
 * Best-effort designation sync, called from the signIn event (fire-and-
 * forget, never blocks or fails a login). Only touches users whose
 * profileSource isn't "manual" — a person's own correction always wins over
 * whatever the directory says on their next login.
 */
export async function enrichEmployeeProfile({
  userId,
  email,
  accessToken,
}: {
  userId: string;
  email: string;
  accessToken?: string;
}): Promise<void> {
  try {
    let enriched: Enriched = null;
    let source: string | null = null;

    if (isMicrosoft() && accessToken) {
      enriched = await fetchFromMicrosoftGraph(accessToken);
      source = "sso-microsoft";
    } else if (isGoogle()) {
      enriched = await fetchFromGoogleDirectory(email);
      source = "sso-google";
    }

    if (!enriched || (!enriched.jobTitle && !enriched.department)) return;

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileSource: true },
    });
    if (current?.profileSource === "manual") return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        jobTitle: enriched.jobTitle,
        department: enriched.department,
        profileSource: source,
        profileUpdatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[profile-enrichment] failed:", err);
  }
}
