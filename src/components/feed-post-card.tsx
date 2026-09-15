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

export function FeedPostCard({ post }: { post: Post }) {
  const [modalOpen, setModalOpen] = useState(false);

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

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-400">
          Amplify it to share on your own profile
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Amplify
        </button>
      </div>

      {modalOpen && (
        <AmplifyModal postId={post.id} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
