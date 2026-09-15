"use client";

import { useState } from "react";

type CopyType = "REPOST" | "COMMENT";

export function AmplifyModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<CopyType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate(selected: CopyType) {
    setType(selected);
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to generate copy.");
      }
      const data = await res.json();
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy automatically — select and copy the text manually.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Amplify this post
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!type && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Choose how you want to amplify this post. We&apos;ll write you a
              unique, ready-to-use caption — copy it and post it yourself on
              LinkedIn.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => generate("REPOST")}
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600"
              >
                Repost
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Share with your own caption
                </span>
              </button>
              <button
                onClick={() => generate("COMMENT")}
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600"
              >
                Comment
                <span className="mt-1 block text-xs font-normal text-slate-400">
                  Reply on the original post
                </span>
              </button>
            </div>
          </div>
        )}

        {type && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {type === "REPOST" ? "Repost caption" : "Comment"}
              </span>
              <button
                onClick={() => setType(null)}
                className="text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                Writing your unique copy…
              </div>
            )}

            {error && (
              <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            {!loading && content && (
              <>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={type === "COMMENT" ? 3 : 6}
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Feel free to edit before you post — this is your unique
                  copy, generated just now.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </button>
                  <button
                    onClick={() => generate(type)}
                    disabled={loading}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Regenerate
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
