"use client";
import Link from "next/link";

const TOKEN_CA = "AMhvyFSge4qGeD5eqZdzNPakFpK7Yib3eHFB12fQjXgf";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{
        color: "#a855f7", fontWeight: 900, fontSize: 20, letterSpacing: "-0.02em",
        marginBottom: 14, paddingBottom: 10,
        borderBottom: "1px solid rgba(168,85,247,0.2)",
      }}>{title}</h2>
      <div style={{ color: "#ccc", fontSize: 15, lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ color: "#f5c842", fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{title}</h3>
      <div style={{ color: "#bbb", fontSize: 14, lineHeight: 1.8, paddingLeft: 12, borderLeft: "2px solid rgba(168,85,247,0.3)" }}>{children}</div>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-block", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
      color: "#c084fc", borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "2px 8px", marginRight: 6, marginBottom: 4,
    }}>{label}</span>
  );
}

export default function Whitepaper() {
  return (
    <div style={{ minHeight: "100vh", background: "#060010", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,0,14,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(168,85,247,0.12)",
        padding: "12px 24px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <img src="/logo.png" alt="" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(168,85,247,0.7))" }} />
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em", flex: 1 }}>DEGEN CLICKER</span>
        <span style={{ color: "#888", fontSize: 12, marginRight: 8 }}>Whitepaper</span>
        <Link href="/" style={{
          background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
          color: "#c084fc", borderRadius: 8, fontSize: 12, fontWeight: 700, padding: "6px 14px",
          textDecoration: "none",
        }}>← Back</Link>
        <Link href="/login" style={{
          background: "linear-gradient(135deg,#a855f7,#7c3aed)", borderRadius: 8,
          color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 14px", textDecoration: "none",
        }}>Play Now</Link>
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>👑</div>
          <h1 style={{
            color: "#fff", fontWeight: 900, fontSize: 38, lineHeight: 1.1,
            letterSpacing: "-0.03em", marginBottom: 14,
          }}>
            DEGEN CLICKER
          </h1>
          <p style={{ color: "#a855f7", fontWeight: 700, fontSize: 14, letterSpacing: "0.15em", marginBottom: 16 }}>
            WHITEPAPER — V1.0
          </p>
          <p style={{ color: "#888", fontSize: 14, maxWidth: 540, margin: "0 auto 24px" }}>
            A competitive on-chain clicker game on Solana where every tap counts,
            leaderboards reset, and the most dedicated degens rise to the top.
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: 10, padding: "8px 16px",
          }}>
            <span style={{ color: "#888", fontSize: 11, fontWeight: 700 }}>TOKEN CA</span>
            <code style={{ color: "#c084fc", fontSize: 11, fontFamily: "monospace" }}>{TOKEN_CA}</code>
          </div>
        </div>

        {/* TOC */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.12)",
          borderRadius: 14, padding: "20px 24px", marginBottom: 48,
        }}>
          <p style={{ color: "#888", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", marginBottom: 10 }}>TABLE OF CONTENTS</p>
          {[
            "1. Introduction & Vision",
            "2. Gameplay Mechanics",
            "3. Progression & Ranking System",
            "4. Shop & Economy",
            "5. Leaderboard & Reward Pool",
            "6. $DEGEN CLICKER Token",
            "7. Technical Architecture",
            "8. Roadmap (5 Phases)",
            "9. Community & Ecosystem",
          ].map((item, i) => (
            <div key={i} style={{
              padding: "5px 0", borderBottom: i < 8 ? "1px solid rgba(255,255,255,0.04)" : "none",
              color: "#aaa", fontSize: 13,
            }}>{item}</div>
          ))}
        </div>

        <Section title="1. Introduction & Vision">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: "#fff" }}>Degen Clicker</strong> is a competitive, play-to-earn clicker game
            built on <strong style={{ color: "#9945FF" }}>Solana</strong>. The concept is simple: tap faster and smarter
            than everyone else, climb the leaderboard, and win real rewards.
          </p>
          <p style={{ marginBottom: 12 }}>
            Unlike traditional idle games, Degen Clicker is built around competitive seasons, on-chain
            verification, and a transparent reward pool. Every tap you make is recorded — your rank is your
            on-chain identity.
          </p>
          <p>
            Our vision is to be the most addictive, community-driven crypto game on Solana — where being the
            biggest degen actually pays.
          </p>
        </Section>

        <Section title="2. Gameplay Mechanics">
          <SubSection title="Core Loop">
            Players tap a central button to generate coins and accumulate taps. Taps are the primary score metric
            — more taps = higher leaderboard rank. Coins (in-game currency) are used to purchase upgrades and
            auto-tappers from the shop.
          </SubSection>

          <SubSection title="Combo Multiplier">
            Tapping rapidly builds a combo multiplier. The faster and more consistently you tap, the higher the
            multiplier climbs. Break your rhythm and the combo resets. Max combo is 20×, giving skilled players a
            significant advantage in coin generation.
          </SubSection>

          <SubSection title="Characters">
            Players choose from five playable characters, each with a distinct visual identity:
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {[["🐸", "Pepe"], ["💪", "Gigachad"], ["🎩", "Trump"], ["🧌", "Troll"], ["🐕", "Bonk"]].map(([e, n]) => (
                <div key={n} style={{
                  background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)",
                  borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#ccc",
                }}>{e} {n}</div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Energy & Cooldowns">
            Manual tapping is governed by an energy system that regenerates over time. Players can extend their
            energy capacity and regeneration rate through upgrades. Auto-tappers bypass this limitation, running
            continuously in the background.
          </SubSection>
        </Section>

        <Section title="3. Progression & Ranking System">
          <p style={{ marginBottom: 16 }}>
            Degen Clicker features a multi-tier ranking ladder with exponentially increasing XP requirements
            to reach higher tiers. Ranks are earned by accumulating <strong style={{ color: "#f5c842" }}>XP</strong>, which is
            generated from coins earned in-game.
          </p>

          <SubSection title="Rank Tiers">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                ["Lv.1–2", "😤 Ngmi Degen", "#888"],
                ["Lv.3–5", "🤡 Rekt Clown", "#cd7f32"],
                ["Lv.6–9", "💎 Diamond Hands", "#b0c4de"],
                ["Lv.10–14", "🪙 Silver Degen", "#c0c0c0"],
                ["Lv.15–19", "👑 Gold Degen", "#f5c842"],
                ["Lv.20–24", "🐋 Whale", "#4fc3f7"],
                ["Lv.25–29", "⚡ Alpha Degen", "#a855f7"],
                ["Lv.30+", "🌙 Gigachad Sigma", "#ff6b35"],
              ].map(([lvl, name, color]) => (
                <div key={lvl} style={{
                  background: "rgba(255,255,255,0.02)", borderRadius: 8,
                  padding: "8px 12px", border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ color: "#666", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{lvl}</div>
                  <div style={{ color: color as string, fontSize: 12, fontWeight: 700 }}>{name}</div>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="XP Formula">
            XP requirements use an exponential curve: <code style={{ color: "#c084fc", fontFamily: "monospace", fontSize: 13 }}>XP = 2,000 × 3.5^(level−1)</code>.
            This ensures early ranks are accessible while the highest tiers demand serious commitment.
            Higher ranks unlock access to more powerful shop items.
          </SubSection>
        </Section>

        <Section title="4. Shop & Economy">
          <p style={{ marginBottom: 16 }}>
            The in-game shop contains <strong style={{ color: "#fff" }}>40+ items</strong> across 7 categories.
            Items are purchased with in-game coins and many are gated behind rank requirements,
            rewarding long-term players.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              ["🤖 Auto-Tappers", "9 tiers — 5 to 1,000 taps/sec. The backbone of passive income. Rank-gated."],
              ["⚡ Power Upgrades", "Multiplier boosts, critical tap chance, and energy cap expansions."],
              ["🔥 Combo Boosts", "Extend combo window, increase max multiplier, reduce combo decay."],
              ["💎 Prestige Items", "High-cost, high-reward items for endgame players."],
              ["🎯 Tap Enhancers", "Direct tap value increases. Stack with multipliers."],
              ["🛡️ Defense", "Protect your score during disconnects and cooldowns."],
              ["✨ Cosmetics", "Visual upgrades — animated effects, particle systems, tap skins."],
            ].map(([title, desc]) => (
              <div key={title as string} style={{
                background: "rgba(255,255,255,0.02)", borderRadius: 10,
                padding: "12px 14px", border: "1px solid rgba(168,85,247,0.12)",
              }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{title}</div>
                <div style={{ color: "#888", fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>

          <SubSection title="Auto-Tapper Economy">
            Auto-tappers generate taps passively and those taps count toward both coins AND the leaderboard.
            A fully upgraded player with all auto-tappers running can reach 1,000+ taps/second,
            but only players with sufficient rank can access the top tiers.
          </SubSection>
        </Section>

        <Section title="5. Leaderboard & Reward Pool">
          <p style={{ marginBottom: 16 }}>
            The leaderboard is the heart of Degen Clicker&apos;s competitive layer. Every player&apos;s total taps are
            tracked in real time, and rankings update live.
          </p>

          <SubSection title="Scoring">
            Your leaderboard score = total taps accumulated. Manual taps + auto-tapper taps both count.
            There is no decay — taps are permanent unless a season reset occurs.
          </SubSection>

          <SubSection title="Prize Structure">
            <div style={{ marginBottom: 10 }}>Top 20 players each season receive prizes from the reward pool:</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {[
                ["🥇 #1", "Grand Prize — largest share of reward pool"],
                ["🥈 #2", "Runner-up reward"],
                ["🥉 #3", "Third place reward"],
                ["4–10", "PRIZE tier — share of pool"],
                ["11–20", "Honorable mention — smaller reward"],
              ].map(([rank, desc]) => (
                <div key={rank as string} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ color: "#f5c842", fontWeight: 800, fontSize: 13, minWidth: 40 }}>{rank}</span>
                  <span style={{ color: "#aaa", fontSize: 13 }}>{desc}</span>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Payouts">
            Rewards are paid in USDC to the Solana wallet address registered in your account settings.
            All payouts are verifiable on-chain.
          </SubSection>
        </Section>

        <Section title="6. $DEGEN CLICKER Token">
          <p style={{ marginBottom: 16 }}>
            The <strong style={{ color: "#a855f7" }}>$DEGEN CLICKER</strong> token is the native currency of the Degen Clicker ecosystem,
            deployed on Solana.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              ["Network", "Solana"],
              ["Standard", "SPL Token"],
              ["CA", TOKEN_CA.slice(0, 8) + "..." + TOKEN_CA.slice(-6)],
              ["Symbol", "$DEGEN (DEGEN CLICKER)"],
            ].map(([k, v]) => (
              <div key={k} style={{
                background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)",
                borderRadius: 8, padding: "10px 14px",
              }}>
                <div style={{ color: "#666", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{k}</div>
                <div style={{ color: "#c084fc", fontSize: 13, fontWeight: 700, fontFamily: k === "CA" ? "monospace" : "inherit" }}>{v}</div>
              </div>
            ))}
          </div>

          <SubSection title="Utility">
            $DEGEN CLICKER is the primary reward mechanism for top leaderboard performers. Holding $DEGEN CLICKER
            grants in-game perks including bonus coin generation, early access to new shop items,
            and exclusive cosmetics.
          </SubSection>

          <SubSection title="Token CA">
            <code style={{ color: "#c084fc", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" as const }}>
              {TOKEN_CA}
            </code>
          </SubSection>
        </Section>

        <Section title="7. Technical Architecture">
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 16 }}>
            {["Next.js 14", "TypeScript", "Supabase", "PostgreSQL", "Solana Web3.js", "Vercel", "Row Level Security"].map(t => (
              <Pill key={t} label={t} />
            ))}
          </div>

          <SubSection title="Frontend">
            Built with <strong style={{ color: "#fff" }}>Next.js 14</strong> using the App Router, deployed globally on
            Vercel&apos;s edge network. The UI is fully responsive, mobile-first, and optimized for high tap frequency
            with minimal input lag.
          </SubSection>

          <SubSection title="Backend & Database">
            Player data, leaderboard entries, purchases, and game sessions are stored in <strong style={{ color: "#fff" }}>Supabase</strong> (PostgreSQL).
            Real-time leaderboard updates are delivered via Supabase&apos;s live subscriptions.
            Each player account is backed by Supabase Auth — no wallet required to play.
          </SubSection>

          <SubSection title="On-Chain Integration">
            Solana wallet addresses are optional but required for reward payouts. Prize distribution is handled
            on-chain via Solana SPL transfers, fully verifiable on any Solana explorer.
          </SubSection>

          <SubSection title="Security">
            All player IDs are scoped to Supabase Auth UUIDs. Row-level security policies prevent
            any player from reading or modifying another player&apos;s data. Auto-tapper rates are validated
            server-side to prevent manipulation.
          </SubSection>
        </Section>

        <Section title="8. Roadmap">
          <p style={{ marginBottom: 24, color: "#888", fontSize: 14 }}>
            Tap. Rank Up. Earn. 🚀
          </p>
          {[
            {
              phase: "Phase 1 — Foundation & Growth",
              subtitle: "Current Focus",
              color: "#22d67a",
              items: [
                "Grow the Degen Clicker community",
                "Increase token awareness and trading volume",
                "Bond the token",
                "Secure Jupiter Verification",
                "Apply for CoinMarketCap listing",
                "Expand social presence and partnerships",
                "Reach 200K Market Cap",
                "Launch first community giveaway at 200K MC",
                "Continue leaderboard rewards every 48 hours",
                "Strengthen community engagement",
              ],
            },
            {
              phase: "Phase 2 — Platform Expansion",
              subtitle: "Making Degen Clicker Bigger",
              color: "#f5c842",
              items: [
                "Complete website redesign",
                "Improved user experience and interface",
                "New playable characters",
                "Character progression system",
                "In-game purchases using the Degen Clicker token",
                "Daily challenges and achievements",
                "Referral rewards system",
                "More reward opportunities for active players",
                "Community events and competitions",
                "Additional game modes",
              ],
            },
            {
              phase: "Phase 3 — Mobile Development",
              subtitle: "Expanding Beyond the Browser",
              color: "#a855f7",
              items: [
                "Begin Degen Clicker mobile app development",
                "Android release",
                "iOS release",
                "Mobile-exclusive rewards",
                "Push notifications for rewards and events",
                "Account syncing across devices",
                "Improved player profiles",
                "Enhanced leaderboard system",
                "More gameplay features and mechanics",
              ],
            },
            {
              phase: "Phase 4 — Ecosystem Growth",
              subtitle: "Building More Than a Clicker Game",
              color: "#4fc3f7",
              items: [
                "Launch Degen Clicker Arcade",
                "Allow developers to submit games",
                "Community voting for featured games",
                "Partnership integrations",
                "Cross-game rewards system",
                "Creator and developer incentives",
                "Expand the Degen Clicker ecosystem",
              ],
            },
            {
              phase: "Phase 5 — Long-Term Vision",
              subtitle: "The Future of Degen Clicker",
              color: "#ff6b35",
              items: [
                "Major platform partnerships",
                "Multi-game ecosystem",
                "Competitive tournaments",
                "Team and guild systems",
                "Advanced reward mechanics",
                "Community governance features",
                "Become a leading Web3 gaming ecosystem",
              ],
            },
          ].map(({ phase, subtitle, color, items }) => (
            <div key={phase} style={{
              marginBottom: 20, background: "rgba(255,255,255,0.02)",
              border: `1px solid ${color}33`, borderRadius: 12, padding: "18px 20px",
            }}>
              <div style={{ color: color, fontWeight: 900, fontSize: 15, marginBottom: 4 }}>{phase}</div>
              <div style={{ color: "#666", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" as const }}>{subtitle}</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {items.map(item => (
                  <span key={item} style={{
                    background: `${color}11`, border: `1px solid ${color}33`,
                    color: "#bbb", borderRadius: 6, fontSize: 12, padding: "3px 10px",
                  }}>✓ {item}</span>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="9. Community & Ecosystem">
          <p style={{ marginBottom: 16 }}>
            Degen Clicker is built by and for the crypto community. We believe the most engaged players
            should shape the game&apos;s future — from new shop items to reward structures.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              {
                emoji: "𝕏", title: "Twitter / X",
                href: "https://x.com/degenclickersol",
                desc: "Follow for game updates, season announcements, and alpha",
              },
              {
                emoji: "✈️", title: "Telegram",
                href: "https://t.me/degenclicker",
                desc: "Community chat, support, and exclusive sticker packs",
              },
            ].map(({ emoji, title, href, desc }) => (
              <a key={title} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{
                  background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.18)",
                  borderRadius: 12, padding: "16px", cursor: "pointer",
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{title}</div>
                  <div style={{ color: "#888", fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </a>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div style={{
          textAlign: "center", paddingTop: 32,
          borderTop: "1px solid rgba(168,85,247,0.15)",
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>👑</div>
          <p style={{ color: "#555", fontSize: 12 }}>
            © 2025 Degen Clicker. All rights reserved.<br />
            This document is for informational purposes only and does not constitute financial advice.
          </p>
          <Link href="/login" style={{
            display: "inline-block", marginTop: 16,
            background: "linear-gradient(135deg,#a855f7,#7c3aed)", borderRadius: 10,
            color: "#fff", fontSize: 13, fontWeight: 800, padding: "10px 24px", textDecoration: "none",
          }}>Play Degen Clicker →</Link>
        </div>
      </div>
    </div>
  );
}
