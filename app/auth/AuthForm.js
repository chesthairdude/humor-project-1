"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted && session) {
        router.replace("/vote");
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function handleSignIn(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message || "Failed to sign in.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/vote");
    router.refresh();
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "Failed to sign up.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Sign-up successful. If your project requires confirmation, check your email.");
    setIsSubmitting(false);
    router.replace("/vote");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold text-slate-900">FunnyOrNot</h1>
        </header>

        <form className="space-y-4">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.16)]"
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#FF6B6B] focus:shadow-[0_0_0_4px_rgba(255,107,107,0.16)]"
            required
          />

          <button
            type="submit"
            onClick={handleSignIn}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B6B] px-5 py-3 text-base font-bold text-white shadow-lg shadow-rose-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B6B] px-5 py-3 text-base font-bold text-white shadow-lg shadow-rose-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Sign Up
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
