"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(10,10,15,0.85)",
      backdropFilter: "blur(16px)",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, #f5c842 0%, #e0a820 100%)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>🗼</div>
          <span style={{
            fontWeight: 800,
            fontSize: 18,
            background: "linear-gradient(135deg, #f5c842 0%, #e0a820 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}>DEGEN TOWER</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="hidden-mobile">
          {[
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/shop", label: "Shop" },
            { href: "/game", label: "Play" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >{label}</Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/register" className="hidden-mobile">
            <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
              <Zap size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
              Start Climbing
            </button>
          </Link>
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
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          {[
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/shop", label: "Shop" },
            { href: "/game", label: "Play" },
            { href: "/register", label: "Start Climbing" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              display: "block",
              padding: "12px 16px",
              color: "var(--text)",
              textDecoration: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
            }}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 640px) { .hidden-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 639px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
      `}</style>
    </nav>
  );
}
