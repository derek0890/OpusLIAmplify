export type MediaItem = {
  url: string;
  name: string;
  mimeType: string;
};

export type MediaType = "NONE" | "IMAGE" | "CAROUSEL" | "VIDEO" | "DOCUMENT";

export const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
export const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
export const DOCUMENT_MIME_TYPES = new Set(["application/pdf"]);

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB, matches LinkedIn's own image cap
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB (LinkedIn allows up to 5GB; capped here for self-hosted disk storage)
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_CAROUSEL_IMAGES = 20; // LinkedIn's own carousel limit
export const MIN_CAROUSEL_IMAGES = 2;

export function isAnimatedGif(item: MediaItem): boolean {
  return item.mimeType === "image/gif";
}
