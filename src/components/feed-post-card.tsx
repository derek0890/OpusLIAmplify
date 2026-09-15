"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AmplifyModal } from "@/components/amplify-modal";
import { MediaCarousel } from "@/components/media-carousel";
import { LinkifiedText } from "@/components/linkified-text";
import type { MediaItem, MediaType } from "@/lib/media";
import { isAnimatedGif } from "@/lib/media";

const DocumentViewer = dynamic(() => import("@/components/document-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center border-y border-slate-200 bg-slate-50 text-sm text-slate-500">
      Loading document…
    </div>
  ),
});

type Post = {
  id: string;
  caption: string;
  mediaType: MediaType;
  media: MediaItem[];
  links: string[];
  createdAt: string;
};

type CopyType = "REPOST" | "COMMENT";

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function RepostIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function PostMedia({ mediaType, media }: { mediaType: MediaType; media: MediaItem[] }) {
  if (mediaType === "NONE" || media.length === 0) return null;

  if (mediaType === "CAROUSEL") {
    return <MediaCarousel images={media} />;
  }

  if (mediaType === "VIDEO") {
    return (
      <video
        controls
        playsInline
        preload="metadata"
        className="w-full bg-black"
        src={media[0].url}
      >
        Your browser doesn&apos;t support embedded video.
      </video>
    );
  }

  if (mediaType === "DOCUMENT") {
    return <DocumentViewer url={media[0].url} name={media[0].name} />;
  }

  // IMAGE
  const item = media[0];
  if (isAnimatedGif(item)) {
    return (
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image would strip GIF animation */}
        <img src={item.url} alt="" className="w-full object-cover" />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
          GIF
        </span>
      </div>
    );
  }

  return (
    <Image src={item.url} alt="" width={600} height={400} className="w-full object-cover" />
  );
}

export function FeedPostCard({ post }: { post: Post }) {
  const [activeType, setActiveType] = useState<CopyType | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          OT
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Opus Technologies
          </p>
          <p className="text-xs text-slate-400">
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-slate-800">
        <LinkifiedText text={post.caption} />
      </p>

      {post.links.length > 0 && (
        <div className="flex flex-col gap-1 px-4 pb-3">
          {post.links.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-medium text-blue-600 hover:underline"
            >
              {link}
            </a>
          ))}
        </div>
      )}

      <PostMedia mediaType={post.mediaType} media={post.media} />

      <div className="flex items-center border-t border-slate-100 px-2 py-1">
        <button
          onClick={() => setActiveType("COMMENT")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <CommentIcon />
          Comment
        </button>
        <button
          onClick={() => setActiveType("REPOST")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <RepostIcon />
          Repost
        </button>
      </div>

      {activeType && (
        <AmplifyModal
          postId={post.id}
          initialType={activeType}
          onClose={() => setActiveType(null)}
        />
      )}
    </div>
  );
}
