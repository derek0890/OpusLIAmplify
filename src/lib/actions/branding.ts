"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";
import { DEFAULT_ACCENT_COLOR, DEFAULT_FONT_KEY, FONT_OPTIONS } from "@/lib/brand";
import { isValidHexColor } from "@/lib/color";

export async function getBrandingSettings(): Promise<{
  accentColor: string;
  fontFamily: string;
}> {
  const settings = await prisma.brandingSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return {
    accentColor: settings?.accentColor ?? DEFAULT_ACCENT_COLOR,
    fontFamily: settings?.fontFamily ?? DEFAULT_FONT_KEY,
  };
}

// Branding is Super Admin-only, not every ADMIN — it changes what everyone
// on this deployment sees, so it's gated the same way as the whitebox
// provisioning tools rather than the regular per-company ADMIN role.
export async function updateBranding(formData: FormData) {
  const session = await requireSuperAdmin();

  const accentColor = String(formData.get("accentColor") ?? "").trim();
  if (!isValidHexColor(accentColor)) {
    throw new Error("Enter a color as a 6-digit hex code, e.g. #4f46e5.");
  }

  const fontFamily = String(formData.get("fontFamily") ?? "");
  if (!FONT_OPTIONS.some((f) => f.key === fontFamily)) {
    throw new Error("Pick one of the available fonts.");
  }

  const existing = await prisma.brandingSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    await prisma.brandingSettings.update({
      where: { id: existing.id },
      data: { accentColor, fontFamily, updatedById: session.user.id },
    });
  } else {
    await prisma.brandingSettings.create({
      data: { accentColor, fontFamily, updatedById: session.user.id },
    });
  }

  revalidatePath("/admin/branding");
  revalidatePath("/", "layout");
}
