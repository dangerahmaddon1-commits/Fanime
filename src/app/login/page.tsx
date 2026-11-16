"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Authentication is not configured. Check the public Firebase environment variables.");
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.assign("/home");
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      const friendly: Record<string, string> = {
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/email-already-in-use": "An account already exists for this email. Sign in instead.",
        "auth/weak-password": "Choose a password with at least 6 characters.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please wait and try again.",
        "auth/operation-not-allowed": "Email/password sign-in is disabled in Firebase Console.",
        "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication settings.",
      };
      setError(friendly[code || ""] || (cause instanceof Error ? cause.message : "Authentication failed. Please try again."));
    } finally { setBusy(false); }
  }

  async function googleSignIn() {
    setBusy(true); setError(""); setMessage("");
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Authentication is not configured.");
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.location.assign("/home");
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      const friendly: Record<string, string> = {
        "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
        "auth/operation-not-allowed": "Enable Google as a sign-in provider in Firebase Console.",
        "auth/unauthorized-domain": "Add this website's domain to Firebase Authentication authorized domains.",
        "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow popups and try again.",
      };
      setError(friendly[code || ""] || (cause instanceof Error ? cause.message : "Google sign-in failed."));
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    setError(""); setMessage("");
    if (!email.trim()) { setError("Enter your email first, then choose Forgot password."); return; }
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Authentication is not configured.");
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent. Check your inbox.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send the reset email."); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#101010] px-4 py-10">
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#191919] p-6 shadow-2xl shadow-black/30 sm:p-8">
      <Link href="/" className="text-lg font-black">F <span className="text-[var(--accent)]">ANIME</span></Link>
      <p className="mt-8 text-xs font-bold tracking-[.25em] text-[var(--accent)]">YOUR ANIME UNIVERSE</p>
      <h1 className="mt-2 text-3xl font-black">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-400">Sign in to F Anime with your email or Google account.</p>
      <button type="button" disabled={busy} onClick={googleSignIn} className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[.04] px-4 text-sm font-bold transition hover:bg-white/10 disabled:opacity-50">Continue with Google</button>
      <div className="my-5 flex items-center gap-3 text-xs text-neutral-600"><span className="h-px flex-1 bg-white/10" />OR CONTINUE WITH EMAIL<span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs font-semibold text-neutral-300">Email address<input required type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#101010] px-4 text-base text-white outline-none focus:border-[var(--accent)]" /></label>
        <label className="block text-xs font-semibold text-neutral-300">Password<input required minLength={6} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="At least 6 characters" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#101010] px-4 text-base text-white outline-none focus:border-[var(--accent)]" /></label>
        {mode === "signin" && <div className="text-right"><button type="button" onClick={resetPassword} className="text-xs font-semibold text-[var(--accent)] hover:underline">Forgot password?</button></div>}
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm leading-5 text-red-300">{error}</p>}
        {message && <p role="status" className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">{message}</p>}
        <button disabled={busy} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-4 text-sm font-black text-black transition hover:brightness-110 disabled:opacity-50">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-400">{mode === "signin" ? "New to F Anime?" : "Already have an account?"} <button type="button" onClick={()=>{setMode(mode === "signin" ? "signup" : "signin");setError("");setMessage("");}} className="font-bold text-[var(--accent)] hover:underline">{mode === "signin" ? "Create account" : "Sign in"}</button></p>
      <Link href="/home" className="mt-5 block text-center text-xs text-neutral-500 hover:text-white">Continue browsing without an account</Link>
    </div>
  </main>;
}
