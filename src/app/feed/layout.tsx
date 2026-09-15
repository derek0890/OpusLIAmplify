import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FeedNav } from "@/components/feed-nav";

export default async function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <FeedNav
        userName={session.user.name ?? session.user.email ?? ""}
        isAdmin={session.user.role === "ADMIN"}
      />
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  );
}
