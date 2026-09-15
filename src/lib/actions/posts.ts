"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  type MediaItem,
  type MediaType,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_DOCUMENT_BYTES,
  MAX_CAROUSEL_IMAGES,
  MIN_CAROUSEL_IMAGES,
} from "@/lib/media";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
};

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

function mb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

async function saveFile(
  file: File,
  allowedTypes: Set<string>,
  maxBytes: number,
  label: string,
): Promise<MediaItem> {
  if (!allowedTypes.has(file.type)) {
    throw new Error(`Unsupported ${label.toLowerCase()} file type: ${file.type || "unknown"}.`);
  }
  if (file.size > maxBytes) {
    throw new Error(`${label} is too large (max ${mb(maxBytes)}).`);
  }

  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  return { url: `/uploads/${filename}`, name: file.name, mimeType: file.type };
}

/**
 * Validates and saves the uploaded files for the given media type. Returns
 * null when no files were actually provided (create: caller should treat
 * that as an error for any non-NONE type; update: caller keeps the existing
 * media untouched).
 */
async function processMedia(
  mediaType: MediaType,
  files: File[],
): Promise<MediaItem[] | null> {
  const realFiles = files.filter((f): f is File => f instanceof File && f.size > 0);

  if (mediaType === "NONE") return [];
  if (realFiles.length === 0) return null;

  switch (mediaType) {
    case "IMAGE": {
      if (realFiles.length > 1) {
        throw new Error("A single image post takes one image — use Carousel for multiple.");
      }
      return [await saveFile(realFiles[0], IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, "Image")];
    }
    case "CAROUSEL": {
      if (realFiles.length < MIN_CAROUSEL_IMAGES) {
        throw new Error(`A carousel needs at least ${MIN_CAROUSEL_IMAGES} images.`);
      }
      if (realFiles.length > MAX_CAROUSEL_IMAGES) {
        throw new Error(`A carousel supports at most ${MAX_CAROUSEL_IMAGES} images.`);
      }
      return Promise.all(
        realFiles.map((f) => saveFile(f, IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, "Carousel image")),
      );
    }
    case "VIDEO": {
      if (realFiles.length > 1) {
        throw new Error("Only one video file is allowed per post.");
      }
      return [await saveFile(realFiles[0], VIDEO_MIME_TYPES, MAX_VIDEO_BYTES, "Video")];
    }
    case "DOCUMENT": {
      if (realFiles.length > 1) {
        throw new Error("Only one PDF document is allowed per post.");
      }
      return [await saveFile(realFiles[0], DOCUMENT_MIME_TYPES, MAX_DOCUMENT_BYTES, "Document")];
    }
    default:
      return [];
  }
}

function parseMediaType(raw: FormDataEntryValue | null): MediaType {
  const value = String(raw ?? "NONE");
  if (value === "IMAGE" || value === "CAROUSEL" || value === "VIDEO" || value === "DOCUMENT") {
    return value;
  }
  return "NONE";
}

export async function createPost(formData: FormData) {
  const session = await requireAdmin();

  const caption = String(formData.get("caption") ?? "").trim();
  const linksRaw = String(formData.get("links") ?? "");
  const contextLinksRaw = String(formData.get("contextLinks") ?? "");
  const status = String(formData.get("status") ?? "DRAFT");
  const mediaType = parseMediaType(formData.get("mediaType"));
  const files = formData.getAll("media");

  if (!caption) {
    throw new Error("Caption is required.");
  }

  const media = await processMedia(mediaType, files as File[]);
  if (media === null) {
    throw new Error(`Upload a file for the selected media type (${mediaType.toLowerCase()}).`);
  }

  await prisma.post.create({
    data: {
      caption,
      mediaType,
      mediaJson: JSON.stringify(media),
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
  const mediaType = parseMediaType(formData.get("mediaType"));
  const files = formData.getAll("media");

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
    mediaType?: MediaType;
    mediaJson?: string;
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

  const media = await processMedia(mediaType, files as File[]);
  if (media !== null) {
    // New files were uploaded (or the type is NONE), so replace the media set.
    data.mediaType = mediaType;
    data.mediaJson = JSON.stringify(media);
  } else if (mediaType !== existing.mediaType) {
    throw new Error(
      `Upload a file to switch this post's media type to ${mediaType.toLowerCase()}.`,
    );
  }
  // else: same media type, no new files — keep the existing media untouched.

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
