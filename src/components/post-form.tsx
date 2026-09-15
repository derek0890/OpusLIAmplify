"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  action: (formData: FormData) => void;
  submitLabel: string;
  defaultValues?: {
    caption?: string;
    links?: string[];
    status?: string;
    creativeUrl?: string | null;
  };
};

export function PostForm({ action, submitLabel, defaultValues }: Props) {
  const [preview, setPreview] = useState<string | null>(
    defaultValues?.creativeUrl ?? null,
  );

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
          placeholder="What should this post say? Employees will see this exact copy in their feed."
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Creative (image)
        </label>
        <input
          type="file"
          name="creative"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
        />
        {preview && (
          <Image
            src={preview}
            alt="Creative preview"
            width={160}
            height={160}
            unoptimized
            className="mt-3 h-40 w-40 rounded-lg border border-slate-200 object-cover"
          />
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
