"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function AuthForm() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/vote");
    router.refresh();
  }

  async function handleSignUp() {
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/vote");
    router.refresh();
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        padding: "44px 40px",
        borderRadius: "28px",
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.65)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.08), 0 32px 64px rgba(0,0,0,0.06)",
        animation: "authCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}
    >
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#aaa",
            marginBottom: "8px",
          }}
        >
          FunnyOrNot
        </p>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#111",
            lineHeight: 1.2,
            marginBottom: "8px",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#888",
            fontWeight: 400,
          }}
        >
          Sign in or create an account to start voting
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid rgba(100,120,255,0.5)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(100,120,255,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid rgba(180,180,210,0.35)";
            e.currentTarget.style.boxShadow = "none";
          }}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: "12px",
            border: "1px solid rgba(180,180,210,0.35)",
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            fontSize: "14px",
            fontWeight: 500,
            color: "#111",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "var(--font-geist-sans)",
            transition: "border 0.2s ease, box-shadow 0.2s ease",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid rgba(100,120,255,0.5)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(100,120,255,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid rgba(180,180,210,0.35)";
            e.currentTarget.style.boxShadow = "none";
          }}
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: "12px",
            border: "1px solid rgba(180,180,210,0.35)",
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            fontSize: "14px",
            fontWeight: 500,
            color: "#111",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "var(--font-geist-sans)",
            transition: "border 0.2s ease, box-shadow 0.2s ease",
          }}
        />
      </div>

      <button
        onClick={handleSignIn}
        disabled={loading}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.6)",
          background: "linear-gradient(135deg, rgba(100,120,255,0.85), rgba(140,100,255,0.85))",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "10px",
          boxShadow: "0 4px 20px rgba(100,120,255,0.3)",
          transition: "all 0.2s ease",
          fontFamily: "var(--font-geist-sans)",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <button
        onClick={handleSignUp}
        disabled={loading}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.6)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.35)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "14px",
          border: "1px solid rgba(180,180,210,0.4)",
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#555",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          fontFamily: "var(--font-geist-sans)",
          opacity: loading ? 0.7 : 1,
        }}
      >
        Create Account
      </button>

      {error ? (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(255,68,88,0.08)",
            border: "1px solid rgba(255,68,88,0.25)",
            color: "#FF4458",
            fontSize: "13px",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
