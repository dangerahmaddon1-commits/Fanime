"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function AuthControl() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  if (pathname === "/login") return null;
  if (loading) return <div aria-hidden="true" className="h-9 w-20 animate-pulse rounded-full bg-white/10" />;
  if (!user) return <Link href="/login" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black shadow-lg shadow-black/20 transition hover:brightness-110">Sign in</Link>;

  return <div className="flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-[#1b1b1b] p-1 pl-3">
    <span className="max-w-32 truncate text-xs font-medium text-neutral-200">{user.displayName || user.email || "Account"}</span>
    <button type="button" onClick={() => { const auth = getFirebaseAuth(); if (auth) void signOut(auth); }} className="min-h-9 rounded-full border border-white/10 px-3 text-xs font-semibold text-neutral-300 transition hover:bg-white/10">Sign out</button>
  </div>;
}
