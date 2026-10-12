"use client";

import { signOut } from "next-auth/react";
import { APP_NAME } from "@/lib/brand";

export function FeedNav({
  userName,
  isAdmin,
}: {
  userName: string;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
            R
          </span>
          {APP_NAME}
        </span>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <a
              href="/admin"
              className="text-sm font-medium text-accent-strong hover:underline"
            >
              Admin
            </a>
          )}
          <a href="/profile" className="text-sm font-medium text-accent-strong hover:underline">
            My Profile
          </a>
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
