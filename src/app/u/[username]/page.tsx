"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getLevelFromXP, getRankFromLevel, getNextRank, totalXPToReachLevel } from "@/lib/progression";
import { generateReferralCode, buildReferralUrl } from "@/lib/referral";
import { Copy, Check } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  avatar_emoji: string;
  avatar_url?: string;
  total_score: number;
  total_taps: number;
  character_id: string;
  prestige_level?: number;
  created_at: string;
}

const CHAR_EMOJIS: Record<string, string> = {
  pepe: "🐸", gigachad: "💪", trump: "🎩", troll: "🧌", bonk: "🐕",
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;
    supabase
      .from("players")
      .select("id,username,avatar_emoji,avatar_url,total_score,total_taps,character_id,prestige_level,created_at")
      .ilike("username", username as string)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) { setNotFound(true); return; }
        setProfile(data as Profile);
      });
  }, [username]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080010", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#a855f7", fontSize: 32 }}>⏳</div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#080010", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 48 }}>👤</div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>Player not found</div>
        <Link href="/" style={{ color: "#a855f7", textDecoration: "none" }}>← Back to home</Link>
      </div>
    );
  }

  const xp = profile.total_score || 0;
  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);
  const nextRank = getNextRank(level);
  const prestige = profile.prestige_level || 0;
  const refCode = generateReferralCode(profile.id);
  const refUrl = buildReferralUrl(refCode);

  const stats = [
    { label: "Total Taps", value: (profile.total_taps || 0).toLocaleString(), emoji: "👆" },
    { label: "Total Earned", value: `${xp.toLocaleString()} $TOWER`, emoji: "💰" },
    { label: "Level", value: String(level), emoji: "⭐" },
    { label: "Prestige", value: prestige > 0 ? `× ${prestige}` : "—", emoji: "🌟" },
  ];

  const charEmoji = CHAR_EMOJIS[profile.character_id] || "🐸";

  async function copyRef() {
    await navigator.clipboard.writeText(refUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080010", color: "#e8e8f0", fontFamily: "system-ui,sans-serif" }}>
      {/* Back nav */}
      <nav style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{ color: "#a855f7", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>← Home</Link>
        <span style={{ color: "#333", fontSize: 13 }}>/</span>
        <span style={{ color: "#aaa", fontSize: 13 }}>{profile.username}</span>
      </nav>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "32px 16px" }}>
        {/* Avatar + name */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", margin: "0 auto 16px",
            background: `linear-gradient(135deg,rgba(168,85,247,0.3),rgba(168,85,247,0.1))`,
            border: `3px solid ${rank.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48,
            boxShadow: prestige > 0 ? `0 0 40px ${rank.color}88` : `0 0 20px ${rank.color}44`,
          }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : profile.avatar_emoji || charEmoji
            }
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: "-0.02em" }}>{profile.username}</span>
            {prestige > 0 && (
              <span style={{ background: "linear-gradient(135deg,#f5c842,#e0a820)", borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 800, color: "#000" }}>
                ✨ PRESTIGE {prestige}
              </span>
            )}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${rank.color}18`, border: `1px solid ${rank.color}44`, borderRadius: 20, padding: "5px 14px" }}>
            <span style={{ fontSize: 16 }}>{rank.emoji}</span>
            <span style={{ color: rank.color, fontWeight: 800, fontSize: 13 }}>{rank.name}</span>
            <span style={{ color: "#444", fontSize: 12 }}>Lv {level}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{s.value}</div>
              <div style={{ color: "#444", fontSize: 11, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Current character */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 36 }}>{charEmoji}</div>
          <div>
            <div style={{ color: "#aaa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Main Character</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, textTransform: "capitalize" }}>{profile.character_id || "Pepe"}</div>
          </div>
        </div>

        {/* Referral */}
        <div style={{
          background: "linear-gradient(135deg,rgba(168,85,247,0.07),rgba(168,85,247,0.02))",
          border: "1px solid rgba(168,85,247,0.2)", borderRadius: 14, padding: "14px 16px",
        }}>
          <div style={{ color: "#c084fc", fontWeight: 800, fontSize: 13, marginBottom: 4 }}>🎁 Referral Code</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{ color: "#22d67a", fontFamily: "monospace", fontSize: 13, flex: 1 }}>{refCode}</code>
            <button onClick={copyRef} style={{
              background: copied ? "rgba(34,214,122,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${copied ? "rgba(34,214,122,0.3)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8, color: copied ? "#22d67a" : "#aaa", cursor: "pointer",
              padding: "6px 10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
            }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div style={{ color: "#443355", fontSize: 11, marginTop: 6 }}>Share & both get +500 $TOWER on signup</div>
        </div>

        {/* Joined date */}
        <div style={{ color: "#221530", fontSize: 11, textAlign: "center", marginTop: 20 }}>
          Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
