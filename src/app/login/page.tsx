"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, AlertCircle } from "lucide-react";
import StarField from "@/components/StarField";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already logged in — redirect
  useEffect(() => {
    if (!loading && user) router.replace("/game");
  }, [user, loading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      router.replace("/game");
    }
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <StarField />

      {/* Logo top-left */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "20px 32px" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #f5c842 0%, #e0a820 100%)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>🗼</div>
          <span style={{
            fontWeight: 800, fontSize: 18,
            background: "linear-gradient(135deg, #f5c842 0%, #e0a820 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}>DEGEN TOWER</span>
        </Link>
      </div>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 420,
        margin: "0 24px",
        background: "rgba(18,18,26,0.9)",
        border: "1px solid rgba(245,200,66,0.15)",
        borderRadius: 20,
        padding: "40px 36px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 60px rgba(245,200,66,0.06), 0 24px 48px rgba(0,0,0,0.4)",
        animation: "rise 0.4s ease-out",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗼</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Login to keep climbing the tower
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="degen@example.com"
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--text)", fontSize: 15,
                outline: "none", transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(245,200,66,0.5)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 44px 12px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 10, color: "var(--text)", fontSize: 15,
                  outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(245,200,66,0.5)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.3)",
              borderRadius: 10, padding: "10px 14px",
            }}>
              <AlertCircle size={15} color="var(--red)" />
              <span style={{ fontSize: 13, color: "var(--red)" }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{
              width: "100%", padding: "13px",
              fontSize: 15, fontWeight: 700,
              marginTop: 4,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? (
              "Logging in..."
            ) : (
              <><Zap size={15} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />Login</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>New here?</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <Link href="/signup" style={{ display: "block", textDecoration: "none" }}>
          <button style={{
            width: "100%", padding: "12px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 10, color: "var(--text)",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget.style.borderColor = "rgba(245,200,66,0.4)"); (e.currentTarget.style.color = "var(--gold)"); }}
          onMouseLeave={e => { (e.currentTarget.style.borderColor = "var(--border)"); (e.currentTarget.style.color = "var(--text)"); }}
          >
            Create an account
          </button>
        </Link>
      </div>

      <style>{`
        input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
