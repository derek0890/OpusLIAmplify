import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setOwnProfile } from "@/lib/actions/users";
import { APP_NAME } from "@/lib/brand";

const SOURCE_LABEL: Record<string, string> = {
  "sso-microsoft": "Auto-filled from Microsoft",
  "sso-google": "Auto-filled from Google Workspace",
  manual: "Entered manually",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, jobTitle: true, department: true, profileSource: true },
  });
  if (!user) redirect("/login");

  const backHref =
    session.user.role === "ADMIN" || session.user.role === "EDITOR"
      ? "/admin/posts"
      : "/feed";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
              R
            </span>
            {APP_NAME}
          </span>
          <a href={backHref} className="text-sm font-medium text-accent-strong hover:underline">
            ← Back
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-lg font-semibold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your job title and department help tailor the AI-generated copy to how
            someone in your role would actually write about a post.
          </p>

          <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {user.name} &middot; {user.email}
          </div>

          <form action={setOwnProfile} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Job title</span>
              <input
                type="text"
                name="jobTitle"
                defaultValue={user.jobTitle ?? ""}
                placeholder="e.g. Senior Software Engineer"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent-strong focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Department</span>
              <input
                type="text"
                name="department"
                defaultValue={user.department ?? ""}
                placeholder="e.g. Engineering"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent-strong focus:outline-none"
              />
            </label>

            {user.profileSource && (
              <p className="text-xs text-slate-400">
                {SOURCE_LABEL[user.profileSource] ?? user.profileSource}
                {user.profileSource !== "manual" &&
                  " — saving here will stop it from being auto-updated on future sign-ins."}
              </p>
            )}

            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Save
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
