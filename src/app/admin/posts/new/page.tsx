import { createPost } from "@/lib/actions/posts";
import { PostForm } from "@/components/post-form";

export default function NewPostPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New post</h1>
      <PostForm action={createPost} submitLabel="Create post" />
    </div>
  );
}
