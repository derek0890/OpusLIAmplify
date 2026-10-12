"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ACCENT_COLOR } from "@/lib/brand";
import { isValidHexColor } from "@/lib/color";

export async function getBrandingAccentColor(): Promise<string> {
  const settings = await prisma.brandingSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return settings?.accentColor ?? DEFAULT_ACCENT_COLOR;
}

export async function updateBrandingAccent(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const accentColor = String(formData.get("accentColor") ?? "").trim();
  if (!isValidHexColor(accentColor)) {
    throw new Error("Enter a color as a 6-digit hex code, e.g. #4f46e5.");
  }

  const existing = await prisma.brandingSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    await prisma.brandingSettings.update({
      where: { id: existing.id },
      data: { accentColor, updatedById: session.user.id },
    });
  } else {
    await prisma.brandingSettings.create({
      data: { accentColor, updatedById: session.user.id },
    });
  }

  revalidatePath("/admin/branding");
  revalidatePath("/", "layout");
}
