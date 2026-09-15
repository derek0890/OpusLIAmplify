"use client";

import { useState } from "react";
import Image from "next/image";
import type { MediaItem, MediaType } from "@/lib/media";

type Props = {
  action: (formData: FormData) => void;
  submitLabel: string;
  defaultValues?: {
    caption?: string;
    links?: string[];
    contextLinks?: string[];
    status?: string;
    mediaType?: MediaType;
    media?: MediaItem[];
  };
};

const MEDIA_TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "NONE", label: "Text only" },
  { value: "IMAGE", label: "Image" },
  { value: "CAROUSEL", label: "Carousel" },
  { value: "VIDEO", label: "Video" },
  { value: "DOCUMENT", label: "Document (PDF)" },
];

const ACCEPT_BY_TYPE: Record<MediaType, string> = {
  NONE: "",
  IMAGE: "image/png,image/jpeg,image/webp,image/gif",
  CAROUSEL: "image/png,image/jpeg,image/webp,image/gif",
  VIDEO: "video/mp4,video/webm,video/quicktime",
  DOCUMENT: "application/pdf",
};

const HELP_BY_TYPE: Record<MediaType, string> = {
  NONE: "",
  IMAGE: "PNG, JPEG, WEBP, or GIF, up to 8MB. GIFs display as an animated post, matching LinkedIn.",
  CAROUSEL: "2–20 images (PNG/JPEG/WEBP/GIF, up to 8MB each). Employees can swipe through them.",
  VIDEO: "MP4, WEBM, or MOV, up to 100MB.",
  DOCUMENT: "A single PDF, up to 20MB. Renders as a swipeable, paginated document post.",
};

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function PostForm({ action, submitLabel, defaultValues }: Props) {
  const [mediaType, setMediaType] = useState<MediaType>(defaultValues?.mediaType ?? "NONE");
  const [previews, setPreviews] = useState<{ url: string; mime: string; name: string }[]>(
    (defaultValues?.media ?? []).map((m) => ({ url: m.url, mime: m.mimeType, name: m.name })),
  );

  function handleTypeChange(next: MediaType) {
    setMediaType(next);
    setPreviews([]);
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setPreviews(
      files.map((f) => ({ url: URL.createObjectURL(f), mime: f.type, name: f.name })),
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Caption
        </label>
        <textarea
          name="caption"
          required
          rows={5}
          defaultValue={defaultValues?.caption}
          placeholder="What should this post say? Employees will see this exact copy in their feed. Any URL typed here becomes a clickable link automatically."
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Post content
        </label>
        <input type="hidden" name="mediaType" value={mediaType} />
        <div className="flex flex-wrap gap-1.5">
          {MEDIA_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                mediaType === opt.value
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {mediaType !== "NONE" && (
          <div className="mt-3">
            <input
              type="file"
              name="media"
              accept={ACCEPT_BY_TYPE[mediaType]}
              multiple={mediaType === "CAROUSEL"}
              onChange={(e) => handleFiles(e.target.files)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
            />
            <p className="mt-1 text-xs text-slate-500">{HELP_BY_TYPE[mediaType]}</p>

            {defaultValues?.media && defaultValues.media.length > 0 && (
              <p className="mt-1 text-xs text-amber-600">
                This post already has {defaultValues.media.length} file
                {defaultValues.media.length > 1 ? "s" : ""} attached. Choosing new files here
                replaces them; leave empty to keep the current ones.
              </p>
            )}

            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {previews.map((p, i) =>
                  isImageMime(p.mime) ? (
                    <Image
                      key={i}
                      src={p.url}
                      alt={p.name}
                      width={120}
                      height={120}
                      unoptimized
                      className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <div
                      key={i}
                      className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-center"
                    >
                      <span className="text-2xl">
                        {p.mime.startsWith("video/") ? "🎬" : "📄"}
                      </span>
                      <span className="truncate text-[10px] text-slate-500">{p.name}</span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Links (one per line, optional)
        </label>
        <textarea
          name="links"
          rows={3}
          defaultValue={defaultValues?.links?.join("\n")}
          placeholder="https://opustechnologies.example/blog/post"
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Reference links for AI context (one per line, optional)
        </label>
        <p className="mb-1.5 text-xs text-slate-500">
          Source articles, press releases, or pages behind this post. These
          are crawled to ground the AI&apos;s writing in real facts — they are
          <strong> not shown to employees</strong> in the feed (use the
          &quot;Links&quot; field above for anything that should be visible).
        </p>
        <textarea
          name="contextLinks"
          rows={3}
          defaultValue={defaultValues?.contextLinks?.join("\n")}
          placeholder="https://source-article.example/press-release"
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "DRAFT"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="DRAFT">Draft (hidden from feed)</option>
          <option value="PUBLISHED">Published (visible in feed)</option>
          {defaultValues?.status === "ARCHIVED" && (
            <option value="ARCHIVED">Archived</option>
          )}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
