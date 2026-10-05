"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return session;
}

async function countActiveAdmins(excludingUserId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
      ...(excludingUserId ? { id: { not: excludingUserId } } : {}),
    },
  });
}

export async function setUserRole(userId: string, role: "ADMIN" | "EMPLOYEE") {
  await requireAdmin();

  if (role === "EMPLOYEE") {
    const remaining = await countActiveAdmins(userId);
    if (remaining === 0) {
      throw new Error("Can't remove the last admin — promote someone else first.");
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/team");
}

export async function setUserActive(userId: string, isActive: boolean) {
  const session = await requireAdmin();

  if (!isActive) {
    if (userId === session.user.id) {
      throw new Error("You can't deactivate your own account.");
    }
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === "ADMIN") {
      const remaining = await countActiveAdmins(userId);
      if (remaining === 0) {
        throw new Error("Can't deactivate the last admin — promote someone else first.");
      }
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/team");
}
