import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin-nav";
import { isSuperAdmin } from "@/lib/super-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")
  ) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav
        userName={session.user.name ?? session.user.email ?? ""}
        role={session.user.role}
        showSuperAdmin={isSuperAdmin(session.user.email)}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
