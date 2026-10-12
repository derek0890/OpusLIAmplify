import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setUserRole, setUserActive, setUserProfile, createUser } from "@/lib/actions/users";
import { isSuperAdmin } from "@/lib/super-admin";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-accent-soft text-accent-strong",
  EDITOR: "bg-amber-100 text-amber-700",
  EMPLOYEE: "bg-slate-100 text-slate-600",
};

export default async function TeamPage() {
  const session = await auth();
  const currentUserId = session?.user.id;
  const canCreateAccounts = isSuperAdmin(session?.user.email);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { accounts: true } } },
  });

  const activeAdminCount = users.filter((u) => u.role === "ADMIN" && u.isActive).length;

  // Autofill suggestions sourced from users and designations this deployment
  // has actually captured (via SSO sign-in or manual entry) — not hardcoded.
  // An empty deployment just means empty <datalist>s, i.e. plain free-text
  // inputs with no change in behavior.
  const knownNames = [...new Set(users.map((u) => u.name).filter(Boolean))];
  const knownEmails = [...new Set(users.map((u) => u.email).filter(Boolean))];
  const knownJobTitles = [...new Set(users.map((u) => u.jobTitle).filter((v): v is string => !!v))];
  const knownDepartments = [...new Set(users.map((u) => u.department).filter((v): v is string => !!v))];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everyone who has signed in, whether via SSO or password, plus
          anyone the super admin has created directly. Change roles or
          revoke access entirely. <strong>Editor</strong> can create/publish
          posts and use the feed, but nothing else in Admin.
        </p>
      </div>

      {/* Autocomplete sources for admin/super-admin-filled fields below —
          populated from existing users and their captured designations.
          Empty when none exist yet, which is a no-op for the inputs. */}
      <datalist id="known-names">
        {knownNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="known-emails">
        {knownEmails.map((email) => (
          <option key={email} value={email} />
        ))}
      </datalist>
      <datalist id="known-job-titles">
        {knownJobTitles.map((title) => (
          <option key={title} value={title} />
        ))}
      </datalist>
      <datalist id="known-departments">
        {knownDepartments.map((dept) => (
          <option key={dept} value={dept} />
        ))}
      </datalist>

      {canCreateAccounts && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-medium text-slate-900">Create an account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Only the super admin can create accounts directly — there&apos;s
            no invite email, so set an initial password and tell the person
            what it is. They (or any admin) can change their role later.
          </p>
          <form action={createUser} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                type="text"
                name="name"
                required
                list="known-names"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent-strong focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                required
                list="known-emails"
                title="Suggestions are existing accounts — picking one will fail, since this form is for new accounts only. Use the role dropdown below the table to change an existing person's role instead."
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent-strong focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Initial password</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent-strong focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                name="role"
                defaultValue="EDITOR"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent-strong focus:outline-none"
              >
                <option value="EDITOR">Editor — create posts + feed only</option>
                <option value="EMPLOYEE">Employee — feed only</option>
                <option value="ADMIN">Admin — full access</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                Create account
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Signed in via</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isLastActiveAdmin =
                user.role === "ADMIN" && user.isActive && activeAdminCount <= 1;
              const isSelf = user.id === currentUserId;

              return (
                <tr key={user.id} className={user.isActive ? "" : "bg-slate-50 opacity-60"}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {user._count.accounts > 0 ? "SSO" : "Password"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.EMPLOYEE}`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <form
                      action={async (formData) => {
                        "use server";
                        await setUserRole(user.id, formData);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <select
                        name="role"
                        defaultValue={user.role}
                        title={
                          isLastActiveAdmin
                            ? "This is the last active admin — promote someone else first"
                            : undefined
                        }
                        className="rounded border border-slate-200 px-1.5 py-1 text-xs focus:border-accent-strong focus:outline-none"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="EDITOR">Editor</option>
                        <option value="EMPLOYEE">Employee</option>
                      </select>
                      <button className="text-xs font-medium text-accent-strong hover:underline">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        "use server";
                        await setUserProfile(user.id, formData);
                      }}
                      className="flex flex-col gap-1"
                    >
                      <input
                        type="text"
                        name="jobTitle"
                        defaultValue={user.jobTitle ?? ""}
                        placeholder="Job title"
                        list="known-job-titles"
                        className="w-32 rounded border border-slate-200 px-2 py-1 text-xs focus:border-accent-strong focus:outline-none"
                      />
                      <input
                        type="text"
                        name="department"
                        defaultValue={user.department ?? ""}
                        placeholder="Department"
                        list="known-departments"
                        className="w-32 rounded border border-slate-200 px-2 py-1 text-xs focus:border-accent-strong focus:outline-none"
                      />
                      <button className="self-start text-xs font-medium text-accent-strong hover:underline">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {user.isActive ? (
                        <form
                          action={async () => {
                            "use server";
                            await setUserActive(user.id, false);
                          }}
                        >
                          <button
                            disabled={isSelf || isLastActiveAdmin}
                            title={
                              isSelf
                                ? "You can't deactivate your own account"
                                : isLastActiveAdmin
                                  ? "Can't deactivate the last admin"
                                  : undefined
                            }
                            className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Deactivate
                          </button>
                        </form>
                      ) : (
                        <form
                          action={async () => {
                            "use server";
                            await setUserActive(user.id, true);
                          }}
                        >
                          <button className="rounded-md border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                            Reactivate
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
