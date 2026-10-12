"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { APP_NAME } from "@/lib/brand";

const links = [
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/style-guide", label: "Style Guide" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/branding", label: "Branding" },
];

export function AdminNav({
  userName,
  showSuperAdmin,
}: {
  userName: string;
  showSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const navLinks = showSuperAdmin
    ? [...links, { href: "/admin/super", label: "Super Admin" }]
    : links;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
              R
            </span>
            {APP_NAME} Admin
          </span>
          <nav className="flex gap-1">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-accent-soft text-accent-strong"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm font-medium text-accent-strong hover:underline">
            My Profile
          </Link>
          <span className="text-sm text-slate-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
