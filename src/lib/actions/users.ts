"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";

type AssignableRole = "ADMIN" | "EDITOR" | "EMPLOYEE";

function cleanField(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function isAssignableRole(value: string): value is AssignableRole {
  return value === "ADMIN" || value === "EDITOR" || value === "EMPLOYEE";
}

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

export async function setUserRole(userId: string, formData: FormData) {
  await requireAdmin();

  const role = String(formData.get("role") ?? "");
  if (!isAssignableRole(role)) {
    throw new Error("Invalid role.");
  }

  if (role !== "ADMIN") {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === "ADMIN") {
      const remaining = await countActiveAdmins(userId);
      if (remaining === 0) {
        throw new Error("Can't remove the last admin — promote someone else first.");
      }
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

/**
 * Super Admin-only: creates a brand-new account directly, with an initial
 * password the super admin hands to that person — there's no invite/email
 * flow in this app, so this is the only way to add someone who won't sign
 * in via SSO. Deliberately separate from the regular ADMIN role: any admin
 * can later change someone's role (see setUserRole), but only the super
 * admin can mint a new account in the first place.
 */
export async function createUser(formData: FormData) {
  await requireSuperAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "EDITOR");

  if (!name) {
    throw new Error("Name is required.");
  }
  if (!email) {
    throw new Error("Email is required.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!isAssignableRole(role)) {
    throw new Error("Invalid role.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role, isActive: true },
  });

  revalidatePath("/admin/team");
}

/** Self-service: any logged-in user editing their own designation. */
export async function setOwnProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      jobTitle: cleanField(formData.get("jobTitle")),
      department: cleanField(formData.get("department")),
      profileSource: "manual",
      profileUpdatedAt: new Date(),
    },
  });
  revalidatePath("/profile");
}

/** Admin editing another user's designation from Admin → Team. */
export async function setUserProfile(userId: string, formData: FormData) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: {
      jobTitle: cleanField(formData.get("jobTitle")),
      department: cleanField(formData.get("department")),
      profileSource: "manual",
      profileUpdatedAt: new Date(),
    },
  });
  revalidatePath("/admin/team");
}
