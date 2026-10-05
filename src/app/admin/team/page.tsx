import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setUserRole, setUserActive } from "@/lib/actions/users";

export default async function TeamPage() {
  const session = await auth();
  const currentUserId = session?.user.id;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { accounts: true } } },
  });

  const activeAdminCount = users.filter((u) => u.role === "ADMIN" && u.isActive).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everyone who has signed in, whether via SSO or password. Promote or
          remove admins, or revoke access entirely.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Signed in via</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.role}
                    </span>
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
                    <div className="flex items-center justify-end gap-2">
                      {user.role === "ADMIN" ? (
                        <form
                          action={async () => {
                            "use server";
                            await setUserRole(user.id, "EMPLOYEE");
                          }}
                        >
                          <button
                            disabled={isLastActiveAdmin}
                            title={
                              isLastActiveAdmin
                                ? "Can't remove the last admin"
                                : undefined
                            }
                            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove admin
                          </button>
                        </form>
                      ) : (
                        <form
                          action={async () => {
                            "use server";
                            await setUserRole(user.id, "ADMIN");
                          }}
                        >
                          <button className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                            Make admin
                          </button>
                        </form>
                      )}

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
