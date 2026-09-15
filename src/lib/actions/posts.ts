"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return session;
}

function parseLinks(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10);
}

async function saveCreative(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use PNG, JPEG, WEBP, or GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 8MB).");
  }

  const ext = file.type.split("/")[1];
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  return `/uploads/${filename}`;
}

export async function createPost(formData: FormData) {
  const session = await requireAdmin();

  const caption = String(formData.get("caption") ?? "").trim();
  const linksRaw = String(formData.get("links") ?? "");
  const contextLinksRaw = String(formData.get("contextLinks") ?? "");
  const status = String(formData.get("status") ?? "DRAFT");
  const creative = formData.get("creative");

  if (!caption) {
    throw new Error("Caption is required.");
  }

  let creativeUrl: string | null = null;
  if (creative instanceof File && creative.size > 0) {
    creativeUrl = await saveCreative(creative);
  }

  await prisma.post.create({
    data: {
      caption,
      creativeUrl,
      linksJson: JSON.stringify(parseLinks(linksRaw)),
      contextLinksJson: JSON.stringify(parseLinks(contextLinksRaw)),
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function updatePost(postId: string, formData: FormData) {
  await requireAdmin();

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) {
    throw new Error("Post not found.");
  }

  const caption = String(formData.get("caption") ?? "").trim();
  const linksRaw = String(formData.get("links") ?? "");
  const contextLinksRaw = String(formData.get("contextLinks") ?? "");
  const status = String(formData.get("status") ?? "DRAFT");
  const creative = formData.get("creative");

  if (!caption) {
    throw new Error("Caption is required.");
  }

  const contextLinksJson = JSON.stringify(parseLinks(contextLinksRaw));

  const data: {
    caption: string;
    linksJson: string;
    contextLinksJson: string;
    contextBrief?: null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    creativeUrl?: string;
  } = {
    caption,
    linksJson: JSON.stringify(parseLinks(linksRaw)),
    contextLinksJson,
    status: status === "PUBLISHED" || status === "ARCHIVED" ? status : "DRAFT",
  };

  // Reference links changed — drop the cached research brief so the next
  // generation re-crawls instead of using stale context.
  if (contextLinksJson !== existing.contextLinksJson) {
    data.contextBrief = null;
  }

  if (creative instanceof File && creative.size > 0) {
    data.creativeUrl = await saveCreative(creative);
  }

  await prisma.post.update({ where: { id: postId }, data });

  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePost(postId: string) {
  await requireAdmin();
  await prisma.amplifiedCopy.deleteMany({ where: { postId } });
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin/posts");
}

export async function setPostStatus(
  postId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  await requireAdmin();
  await prisma.post.update({ where: { id: postId }, data: { status } });
  revalidatePath("/admin/posts");
  revalidatePath("/feed");
}
