"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";

const CHARACTERS = [
  { emoji: "🐸", name: "Pepe", desc: "Classic ribbit energy" },
  { emoji: "💪", name: "Gigachad", desc: "Pure sigma fuel" },
  { emoji: "🧌", name: "Troll", desc: "Bridge boss ascendant" },
  { emoji: "🎩", name: "Trump", desc: "Making floors great again" },
];

const REWARDS = [
  { rank: "🥇 1st", pct: "20%", label: "Top of the Tower" },
  { rank: "🥈 2nd", pct: "15%", label: "Silver Degen" },
  { rank: "🥉 3rd", pct: "10%", label: "Bronze Ape" },
  { rank: "4–20th", pct: "Equal Split", label: "Top Climbers" },
];

const FEATURES = [
  {
    icon: "🗼",
    title: "Procedural Tower",
    desc: "Every run is different. Procedurally generated floors keep you on your toes — no memorizing patterns, only raw skill.",
  },
  {
    icon: "💰",
    title: "Daily USDC Rewards",
    desc: "25% of all in-game fees flow directly into the daily USDC reward pool. Top 20 players split it every 24 hours.",
  },
  {
    icon: "🔐",
    title: "Token-Gated Access",
    desc: "Hold ≥$5 of the native meme coin in your Solana wallet. Verified on-chain via Helius. Committed degens only.",
  },
  {
    icon: "🔥",
    title: "Deflationary Tokenomics",
    desc: "10% of all fees go to buyback & burn. Every power-up you buy, every revive you use — the supply shrinks.",
  },
  {
    icon: "⚔️",
    title: "Dynamic Enemies",
    desc: "FUD bears, rug-pull trolls, and liquidation lasers. Higher floors, meaner enemies, bigger glory.",
  },
  {
    icon: "🎭",
    title: "Meme Characters",
    desc: "Play as Pepe, Gigachad, Troll, or Trump. Each has unique abilities. Unlock skins and flex in the lobby.",
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <StarField />
      <Navbar />

      {/* Hero */}
      <section style={{
        position: "relative",
        zIndex: 1,
        paddingTop: 160,
        paddingBottom: 100,
        textAlign: "center",
        padding: "160px 24px 100px",
      }}>
        {/* Tower graphic */}
        <div className="float" style={{
          fontSize: 80,
          marginBottom: 24,
          filter: "drop-shadow(0 0 32px rgba(245,200,66,0.4))",
        }}>🗼</div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(245,200,66,0.1)",
          border: "1px solid rgba(245,200,66,0.3)",
          borderRadius: 100,
          padding: "6px 16px",
          marginBottom: 20,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--gold)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 6px var(--green)" }} />
          Live on Solana
        </div>

        <h1 style={{
          fontSize: "clamp(48px, 8vw, 96px)",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          marginBottom: 12,
          background: "linear-gradient(180deg, #ffffff 0%, #f5c842 60%, #e0a820 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          CLIMB.
          <br />
          EARN.
          <br />
          ASCEND.
        </h1>

        <p style={{
          fontSize: "clamp(16px, 2.5vw, 20px)",
          color: "var(--text-muted)",
          maxWidth: 520,
          margin: "24px auto 40px",
          lineHeight: 1.6,
        }}>
          The most degen tower-climbing game on Solana. Control a meme character,
          reach the highest floor, and claim your share of the daily USDC pool.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register">
            <button className="btn-primary pulse-glow" style={{ fontSize: 16, padding: "14px 32px" }}>
              🚀 Start Climbing
            </button>
          </Link>
          <Link href="/leaderboard">
            <button className="btn-secondary" style={{ fontSize: 16, padding: "14px 32px" }}>
              🏆 Leaderboard
            </button>
          </Link>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex",
          gap: 40,
          justifyContent: "center",
          marginTop: 64,
          flexWrap: "wrap",
        }}>
          {[
            { value: "2,847", label: "Active Climbers" },
            { value: "$12,400", label: "Paid Out Today" },
            { value: "Floor 847", label: "Today's Record" },
            { value: "Daily", label: "Reset Cycle" },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gold)" }}>{value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Characters */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Choose Your Degen
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: 12, fontSize: 15 }}>
            Each character has unique abilities. Unlock more with the native token.
          </p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {CHARACTERS.map(({ emoji, name, desc }) => (
            <div key={name} className="card" style={{
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gold)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
            >
              <div style={{ fontSize: 56, marginBottom: 12, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Why Degen Tower?
          </h2>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 32 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{title}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Rewards */}
      <section style={{
        position: "relative",
        zIndex: 1,
        padding: "80px 24px",
        background: "linear-gradient(180deg, transparent 0%, rgba(245,200,66,0.04) 50%, transparent 100%)",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Daily USDC Rewards
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 40, fontSize: 15 }}>
            The reward pool resets every 24 hours. Top 20 players earn real USDC — paid automatically to your Solana wallet.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {REWARDS.map(({ rank, pct, label }, i) => (
              <div key={rank} className="card" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderColor: i === 0 ? "rgba(245,200,66,0.4)" : "var(--border)",
                background: i === 0 ? "rgba(245,200,66,0.06)" : "var(--surface)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{rank}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 14 }}>{label}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "var(--gold)" }}>{pct}</div>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 16 }}>
            25% of all in-game transaction fees fund the reward pool
          </p>
        </div>
      </section>

      {/* Tokenomics */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Built to Last
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: 12, fontSize: 15 }}>
            Every fee in the ecosystem goes somewhere designed.
          </p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          maxWidth: 700,
          margin: "0 auto",
        }}>
          {[
            { pct: "25%", label: "Daily Reward Pool", color: "var(--gold)", icon: "💰" },
            { pct: "10%", label: "Buyback & Burn 🔥", color: "var(--red)", icon: "🔥" },
            { pct: "65%", label: "Dev & Treasury", color: "var(--blue)", icon: "🏗️" },
          ].map(({ pct, label, color, icon }) => (
            <div key={label} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color }}>{pct}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        position: "relative",
        zIndex: 1,
        padding: "100px 24px",
        textAlign: "center",
      }}>
        <div style={{
          maxWidth: 600,
          margin: "0 auto",
          background: "linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(245,200,66,0.02) 100%)",
          border: "1px solid rgba(245,200,66,0.2)",
          borderRadius: 20,
          padding: "60px 40px",
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🗼</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.03em" }}>
            Ready to Ascend?
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
            Register with your Solana wallet, hold the minimum token requirement, and start climbing today.
          </p>
          <Link href="/register">
            <button className="btn-primary pulse-glow" style={{ fontSize: 16, padding: "16px 40px" }}>
              🚀 Create Account
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: "relative",
        zIndex: 1,
        borderTop: "1px solid var(--border)",
        padding: "32px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 13,
      }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--gold)" }}>DEGEN TOWER</span> — Built on Solana
        </div>
        <div>© {new Date().getFullYear()} Degen Tower. All rights reserved. DYOR. Not financial advice.</div>
      </footer>
    </div>
  );
}
