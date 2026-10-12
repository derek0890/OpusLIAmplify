"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/media";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function saveLogo(file: File): Promise<string> {
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported logo file type: ${file.type || "unknown"}.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Logo is too large (max ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB).`);
  }

  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "logos");
  await fs.mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);

  return `/uploads/logos/${filename}`;
}

function field(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createInstance(formData: FormData) {
  const session = await requireSuperAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Instance name is required.");
  }

  let logoUrl: string | null = null;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    logoUrl = await saveLogo(logoFile);
  }

  await prisma.whiteboxInstance.create({
    data: {
      name,
      logoUrl,

      slackBotToken: field(formData, "slackBotToken"),
      slackChannelName: field(formData, "slackChannelName"),
      slackWebhookUrl: field(formData, "slackWebhookUrl"),

      teamsClientId: field(formData, "teamsClientId"),
      teamsClientSecret: field(formData, "teamsClientSecret"),
      teamsTenantId: field(formData, "teamsTenantId"),
      teamsTeamId: field(formData, "teamsTeamId"),
      teamsChannelName: field(formData, "teamsChannelName"),
      teamsWebhookUrl: field(formData, "teamsWebhookUrl"),

      exchangeTenantId: field(formData, "exchangeTenantId"),
      exchangeClientId: field(formData, "exchangeClientId"),
      exchangeClientSecret: field(formData, "exchangeClientSecret"),
      exchangeSenderEmail: field(formData, "exchangeSenderEmail"),
      exchangeNotifyRecipients: field(formData, "exchangeNotifyRecipients"),

      googleClientEmail: field(formData, "googleClientEmail"),
      googlePrivateKey: field(formData, "googlePrivateKey"),
      googleWorkspaceSenderEmail: field(formData, "googleWorkspaceSenderEmail"),
      googleWorkspaceNotifyRecipients: field(formData, "googleWorkspaceNotifyRecipients"),

      openaiApiKey: field(formData, "openaiApiKey"),
      openaiResearchModel: field(formData, "openaiResearchModel"),
      openaiCopyModel: field(formData, "openaiCopyModel"),

      createdById: session.user.id,
    },
  });

  revalidatePath("/admin/super");
  redirect("/admin/super");
}

export async function deleteInstance(id: string) {
  await requireSuperAdmin();
  await prisma.whiteboxInstance.delete({ where: { id } });
  revalidatePath("/admin/super");
}
