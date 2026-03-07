"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AiBackground, AiKeyframesStyle } from "@/components/ai/ai-background";

/* ── helpers ── */
function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isPhone(v: string) {
  return /^\d{8,15}$/.test(v.replace(/[\s\-().+]/g, ""));
}

/* ── Page ── */
export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    const v = identifier.trim();
    if (!v) return t("error");
    if (v.includes("@")) {
      if (!isEmail(v)) return t("error");
    } else {
      if (!isPhone(v)) return t("error");
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      identifier: identifier.trim(),
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(t("error"));
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    color: "white",
    backgroundColor: "rgb(24,24,27)",
    border: "1px solid rgba(63,63,70,0.8)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "rgb(161,161,170)",
    marginBottom: "0.375rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <>
      <AiKeyframesStyle />
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#050508",
        }}
      >
        <AiBackground variant="full" />

        {/* Card */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "26rem",
            padding: "2.25rem",
            borderRadius: "1.25rem",
            backgroundColor: "rgba(9,9,14,0.92)",
            border: "1px solid rgba(100,80,220,0.15)",
            boxShadow:
              "0 0 80px -20px rgba(100,80,220,0.20), 0 25px 50px -12px rgba(0,0,0,0.7)",
            margin: "0 1rem",
            backdropFilter: "blur(12px)",
            animation: "fadeSlide 0.6s ease-out",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "3.25rem",
                height: "3.25rem",
                borderRadius: "0.875rem",
                background: "linear-gradient(135deg, rgba(120,100,240,0.15), rgba(80,60,200,0.08))",
                border: "1px solid rgba(140,120,255,0.15)",
                marginBottom: "1rem",
                boxShadow: "0 0 24px rgba(120,100,240,0.15)",
              }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="rgba(180,165,255,0.9)">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "white", letterSpacing: "-0.025em" }}>
              {t("title")}
            </h1>
            <p style={{ fontSize: "0.8rem", color: "rgba(160,150,200,0.6)", marginTop: "0.3rem" }}>
              {t("subtitle")}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: "1.25rem",
                borderRadius: "0.5rem",
                padding: "0.625rem 0.875rem",
                fontSize: "0.8rem",
                color: "rgb(248,113,113)",
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label htmlFor="identifier" style={labelStyle}>
                {t("identifierLabel")}
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("identifierPlaceholder")}
                dir="ltr"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>
                {t("passwordLabel")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                background: loading
                  ? "rgba(255,255,255,0.7)"
                  : "linear-gradient(135deg, #fff 0%, #e8e5ff 100%)",
                color: "#0a0a12",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s",
                boxShadow: "0 2px 12px rgba(120,100,240,0.15)",
              }}
            >
              {loading ? t("submitting") : t("submit")}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.7rem", color: "rgba(140,130,180,0.4)", marginTop: "1.5rem", letterSpacing: "0.04em" }}>
            {t("tagline")}
          </p>
        </div>
      </div>
    </>
  );
}
