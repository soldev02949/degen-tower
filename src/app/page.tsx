"use client";
import Link from "next/link";

const CHARS = [
  { id: "pepe",     name: "Pepe",     emoji: "🐸", color: "#4caf50", ability: "Lucky Tap",    desc: "15% chance for 3× coins"       },
  { id: "gigachad", name: "Gigachad", emoji: "💪", color: "#e0b87a", ability: "Sigma Grind",  desc: "20× max combo"                 },
  { id: "trump",    name: "Trump",    emoji: "🎩", color: "#3b82f6", ability: "Deal Maker",   desc: "Every 50 taps = 10× burst"     },
  { id: "troll",    name: "Trollface",emoji: "🧌", color: "#a855f7", ability: "Chaos Agent",  desc: "0.5–8× random per tap"         },
  { id: "bonk",     name: "Bonk",     emoji: "🐕", color: "#e8853a", ability: "BONK Speed",   desc: "3× energy regen"               },
];

const FEATURES = [
  { emoji: "⚡", title: "5 Unique Characters",    desc: "Each with passive abilities, special powers, and upgradeable stats" },
  { emoji: "🔥", title: "Combo System",            desc: "Tap fast to build multipliers up to 20×. Let it drop and lose it all" },
  { emoji: "🤖", title: "Auto-Tapper Helpers",     desc: "Hire FUD Bear Slaves, Bot Armies, and Whale Wallets to earn while you sleep" },
  { emoji: "✨", title: "Special Abilities",        desc: "Charge your special meter by tapping, then unleash a burst for massive earnings" },
  { emoji: "🏆", title: "48hr Leaderboard",        desc: "Compete for the top 10. Leaderboard resets every 48 hours with a fresh pool" },
  { emoji: "💰", title: "Level → Rank System",     desc: "Earn $TOWER → gain XP → level up → unlock higher ranks on the board" },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a000f", color: "#e8e8f0", fontFamily: "system-ui, sans-serif", overflowX: "hidden" }}>

      {/* Fixed bg glow */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% -10%, rgba(140,30,220,0.25) 0%, transparent 55%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(10,0,15,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>🗼 DEGEN TOWER</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
          <Link href="/leaderboard" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Leaderboard</Link>
          <Link href="/login" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Login</Link>
          <Link href="/game" style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", fontSize: 13, fontWeight: 800,
            textDecoration: "none", borderRadius: 10, padding: "8px 18px",
            boxShadow: "0 0 24px rgba(168,85,247,0.4)",
          }}>Play Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "80px 20px 60px" }}>
        <div style={{ display: "inline-block", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 20, padding: "4px 16px", fontSize: 12, color: "#a855f7", fontWeight: 700, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Solana · P2E · Tap to Earn
        </div>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 20px", color: "#fff" }}>
          TAP YOUR WAY<br />
          <span style={{ background: "linear-gradient(135deg, #f5c842, #f590a0, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TO THE TOP
          </span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2.5vw, 19px)", color: "#9966bb", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Pick your meme character. Tap to earn $TOWER. Upgrade your rig.
          Climb the 48-hour leaderboard. Win the USDC reward pool.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/game" style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", fontWeight: 900, fontSize: 16,
            textDecoration: "none", borderRadius: 14, padding: "16px 40px",
            boxShadow: "0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}>
            🎮 Play Now — Free
          </Link>
          <Link href="/leaderboard" style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e8e8f0", fontWeight: 700, fontSize: 16,
            textDecoration: "none", borderRadius: 14, padding: "16px 40px",
          }}>
            🏆 Leaderboard
          </Link>
        </div>

        {/* Live ticker */}
        <div style={{ marginTop: 40, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {[["💰","$TOWER","Tap to Earn"],["⏱","48hrs","Leaderboard Reset"],["🏆","Top 10","Win USDC Pool"],["⚡","5","Unique Characters"]].map(([emoji,val,label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 2 }}>{emoji}</div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>{val}</div>
              <div style={{ color: "#664488", fontSize: 11 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Characters */}
      <section style={{ position: "relative", zIndex: 1, padding: "48px 20px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Choose Your Fighter</h2>
        <p style={{ textAlign: "center", color: "#664488", fontSize: 14, marginBottom: 32 }}>Each character has unique passive abilities and special moves</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {CHARS.map(c => (
            <Link href="/game" key={c.id} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.02)", border: `1px solid ${c.color}33`,
              borderRadius: 18, padding: "20px 16px", width: 140,
              textDecoration: "none", transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = c.color; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 40px ${c.color}44`; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-6px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `${c.color}33`; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; (e.currentTarget as HTMLAnchorElement).style.transform = "none"; }}
            >
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${c.color}22`, border: `2px solid ${c.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                <img
                  src={`/characters/${c.id}.png`}
                  alt={c.name}
                  style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="font-size:40px">${c.emoji}</span>`; }}
                />
              </div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{c.name}</div>
              <div style={{ background: `${c.color}22`, border: `1px solid ${c.color}44`, borderRadius: 8, padding: "3px 8px", fontSize: 10, color: c.color, fontWeight: 700, textAlign: "center" }}>{c.ability}</div>
              <div style={{ color: "#664488", fontSize: 11, textAlign: "center", lineHeight: 1.4 }}>{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, padding: "48px 20px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Advanced Mechanics</h2>
        <p style={{ textAlign: "center", color: "#664488", fontSize: 14, marginBottom: 32 }}>Not your grandma's clicker</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 18px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.emoji}</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: "#664488", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard CTA */}
      <section style={{ position: "relative", zIndex: 1, padding: "40px 20px 60px", textAlign: "center" }}>
        <div style={{
          maxWidth: 580, margin: "0 auto",
          background: "linear-gradient(135deg, rgba(120,40,200,0.2), rgba(168,85,247,0.1))",
          border: "1px solid rgba(168,85,247,0.25)",
          borderRadius: 24, padding: "40px 32px",
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginBottom: 10 }}>48-Hour Leaderboard</h2>
          <p style={{ color: "#9966bb", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
            The leaderboard resets every 48 hours. Top players win from the USDC reward pool.
            Earn $TOWER, level up, and secure your rank before time runs out.
          </p>
          <Link href="/leaderboard" style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", fontWeight: 900, fontSize: 15,
            textDecoration: "none", borderRadius: 12, padding: "14px 36px",
            boxShadow: "0 0 30px rgba(168,85,247,0.4)",
          }}>
            View Leaderboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#443355", fontSize: 12, position: "relative", zIndex: 1 }}>
        <span>🗼 Degen Tower · Solana P2E</span>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/game" style={{ color: "#443355", textDecoration: "none" }}>Play</Link>
          <Link href="/leaderboard" style={{ color: "#443355", textDecoration: "none" }}>Leaderboard</Link>
          <Link href="/login" style={{ color: "#443355", textDecoration: "none" }}>Login</Link>
        </div>
      </footer>
    </div>
  );
}
