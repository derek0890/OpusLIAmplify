"use client";

import { useState } from "react";
import Image from "next/image";
import { AmplifyModal } from "@/components/amplify-modal";

type Post = {
  id: string;
  caption: string;
  creativeUrl: string | null;
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
        {post.caption}
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

      {post.creativeUrl && (
        <Image
          src={post.creativeUrl}
          alt=""
          width={600}
          height={400}
          className="w-full object-cover"
        />
      )}

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
