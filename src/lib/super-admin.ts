import { redirect } from "next/navigation";
import { auth } from "@/auth";

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? "derekfrancis.14@gmail.com")
  .trim()
  .toLowerCase();

export function isSuperAdmin(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

/**
 * Gates the whitebox-instance provisioning pages and actions. Deliberately
 * separate from the ADMIN role: every company's own deployment has ADMIN
 * users, but only this one operator account should ever see other
 * companies' generated credentials.
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.email)) {
    redirect("/login");
  }
  return session;
}
