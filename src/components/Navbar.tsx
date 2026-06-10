"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Zap, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Prevent SSR hydration mismatch — only show auth state after mount
  useEffect(() => { setMounted(true); }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const isLoggedIn = mounted && !loading && !!user;

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,10,15,0.85)",
      backdropFilter: "blur(16px)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 24px",
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Degen Clicker" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <span style={{
            fontWeight: 800, fontSize: 18,
            background: "linear-gradient(135deg, #a855f7 0%, #f5c842 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}>DEGEN CLICKER</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="hidden-mobile">
          {[
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/shop", label: "Shop" },
            { href: "/game", label: "Play" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              color: "var(--text-muted)", textDecoration: "none",
              fontSize: 14, fontWeight: 500, transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >{label}</Link>
          ))}
        </div>

        {/* CTA / Auth */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isLoggedIn ? (
            <>
              {/* User email chip */}
              <div className="hidden-mobile" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 8,
                background: "rgba(245,200,66,0.08)",
                border: "1px solid rgba(245,200,66,0.15)",
              }}>
                <User size={12} color="var(--gold)" />
                <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email?.split("@")[0]}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="hidden-mobile"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = "rgba(255,77,106,0.4)"); (e.currentTarget.style.color = "var(--red)"); }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = "var(--border)"); (e.currentTarget.style.color = "var(--text-muted)"); }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden-mobile">
                <button style={{
                  padding: "8px 18px", background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text-muted)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = "rgba(245,200,66,0.3)"); (e.currentTarget.style.color = "var(--text)"); }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = "var(--border)"); (e.currentTarget.style.color = "var(--text-muted)"); }}
                >
                  Login
                </button>
              </Link>
              <Link href="/signup" className="hidden-mobile">
                <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
                  <Zap size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                  Sign Up
                </button>
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", padding: 4 }}
            className="show-mobile"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          padding: 16, display: "flex", flexDirection: "column", gap: 4,
        }}>
          {[
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/shop", label: "Shop" },
            { href: "/game", label: "Play" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              display: "block", padding: "12px 16px",
              color: "var(--text)", textDecoration: "none",
              borderRadius: 8, fontSize: 14, fontWeight: 500,
            }}>{label}</Link>
          ))}
          {isLoggedIn ? (
            <button onClick={() => { setOpen(false); handleSignOut(); }} style={{
              display: "block", padding: "12px 16px",
              color: "var(--red)", background: "none", border: "none",
              borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: "pointer", textAlign: "left",
            }}>
              Sign out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} style={{
                display: "block", padding: "12px 16px",
                color: "var(--text)", textDecoration: "none",
                borderRadius: 8, fontSize: 14, fontWeight: 500,
              }}>Login</Link>
              <Link href="/signup" onClick={() => setOpen(false)} style={{
                display: "block", padding: "12px 16px",
                color: "var(--gold)", textDecoration: "none",
                borderRadius: 8, fontSize: 14, fontWeight: 600,
              }}>Sign Up</Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 640px) { .hidden-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 639px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
      `}</style>
    </nav>
  );
}
