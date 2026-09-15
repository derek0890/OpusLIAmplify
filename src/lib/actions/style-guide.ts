"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateStyleGuide(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    throw new Error("Style guide content cannot be empty.");
  }

  const existing = await prisma.styleGuide.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    await prisma.styleGuide.update({
      where: { id: existing.id },
      data: { content, updatedById: session.user.id },
    });
  } else {
    await prisma.styleGuide.create({
      data: { content, updatedById: session.user.id },
    });
  }

  revalidatePath("/admin/style-guide");
}

export async function getStyleGuide() {
  const guide = await prisma.styleGuide.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return guide?.content ?? "";
}
