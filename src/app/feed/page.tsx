import { prisma } from "@/lib/prisma";
import { FeedPostCard } from "@/components/feed-post-card";

export default async function FeedPage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">
          No posts to amplify yet. Check back soon.
        </div>
      ) : (
        posts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={{
              id: post.id,
              caption: post.caption,
              mediaType: post.mediaType,
              media: JSON.parse(post.mediaJson || "[]"),
              links: JSON.parse(post.linksJson || "[]"),
              createdAt: post.createdAt.toISOString(),
            }}
          />
        ))
      )}
    </div>
  );
}
