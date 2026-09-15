import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePost } from "@/lib/actions/posts";
import { PostForm } from "@/components/post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const updatePostWithId = async (formData: FormData) => {
    "use server";
    await updatePost(post.id, formData);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit post</h1>
      <PostForm
        action={updatePostWithId}
        submitLabel="Save changes"
        defaultValues={{
          caption: post.caption,
          links: JSON.parse(post.linksJson || "[]"),
          contextLinks: JSON.parse(post.contextLinksJson || "[]"),
          status: post.status,
          creativeUrl: post.creativeUrl,
        }}
      />
    </div>
  );
}
