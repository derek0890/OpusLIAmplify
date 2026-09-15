import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { deletePost, setPostStatus } from "@/lib/actions/posts";
import type { MediaItem } from "@/lib/media";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
};

const mediaTypeLabels: Record<string, string> = {
  NONE: "Text only",
  IMAGE: "Image",
  CAROUSEL: "Carousel",
  VIDEO: "Video",
  DOCUMENT: "Document",
};

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Posts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Content published here appears in the employee feed for
            amplification.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">
          No posts yet. Create your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const links: string[] = JSON.parse(post.linksJson || "[]");
            const media: MediaItem[] = JSON.parse(post.mediaJson || "[]");
            const firstImage =
              post.mediaType === "IMAGE" || post.mediaType === "CAROUSEL" ? media[0] : null;
            return (
              <div
                key={post.id}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                {firstImage ? (
                  <div className="relative h-24 w-24 flex-shrink-0">
                    <Image
                      src={firstImage.url}
                      alt=""
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    {post.mediaType === "CAROUSEL" && media.length > 1 && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        +{media.length - 1}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 text-xs text-slate-400">
                    <span className="text-xl">
                      {post.mediaType === "VIDEO"
                        ? "🎬"
                        : post.mediaType === "DOCUMENT"
                          ? "📄"
                          : "—"}
                    </span>
                    {post.mediaType === "NONE" && "No media"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[post.status]}`}
                    >
                      {post.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {mediaTypeLabels[post.mediaType]}
                    </span>
                    {links.length > 0 && (
                      <span className="text-xs text-slate-400">
                        {links.length} link{links.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                    {post.caption}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Edit
                    </Link>

                    {post.status !== "PUBLISHED" ? (
                      <form
                        action={async () => {
                          "use server";
                          await setPostStatus(post.id, "PUBLISHED");
                        }}
                      >
                        <button className="rounded-md border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                          Publish
                        </button>
                      </form>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await setPostStatus(post.id, "ARCHIVED");
                        }}
                      >
                        <button className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">
                          Archive
                        </button>
                      </form>
                    )}

                    <form
                      action={async () => {
                        "use server";
                        await deletePost(post.id);
                      }}
                    >
                      <button className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
