"use client";
import { useState } from "react";
import { RANKS } from "@/lib/progression";

interface PrestigeModalProps {
  currentLevel: number;
  prestigeLevel: number;
  onPrestige: () => Promise<void>;
  onClose: () => void;
}

const PRESTIGE_BONUSES = [
  "🔥 +10% permanent tap power per prestige",
  "⚡ +5% passive income per prestige",
  "💎 Exclusive prestige badge on your profile",
  "🌟 Glowing rank border in leaderboard",
  "👑 Access to prestige-only upgrades",
];

export default function PrestigeModal({ currentLevel, prestigeLevel, onPrestige, onClose }: PrestigeModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const MAX_RANK_LEVEL = RANKS[RANKS.length - 1].minLevel;
  const canPrestige = currentLevel >= MAX_RANK_LEVEL;

  async function handlePrestige() {
    if (!canPrestige) return;
    setLoading(true);
    await onPrestige();
    setLoading(false);
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "linear-gradient(135deg,#0d0020,#08001a)",
        border: "1px solid rgba(245,200,66,0.3)",
        borderRadius: 24,
        padding: "28px 24px",
        maxWidth: 380,
        width: "100%",
        boxShadow: "0 0 80px rgba(245,200,66,0.2)",
        animation: "prestigeGlow 2s ease-in-out infinite",
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>✨</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#f5c842", letterSpacing: "-0.02em" }}>
            PRESTIGE {prestigeLevel + 1}
          </div>
          <div style={{ color: "#553366", fontSize: 13, marginTop: 4 }}>
            Reset to Level 1 — keep your wisdom
          </div>
        </div>

        {!canPrestige && (
          <div style={{
            background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.3)",
            borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "center",
          }}>
            <div style={{ color: "#ff4d6a", fontWeight: 700, fontSize: 13 }}>
              Need to reach Level {MAX_RANK_LEVEL} first
            </div>
            <div style={{ color: "#553366", fontSize: 11, marginTop: 2 }}>
              You are Level {currentLevel} — {MAX_RANK_LEVEL - currentLevel} more levels to go
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: "#f5c842", fontWeight: 800, fontSize: 12, marginBottom: 10, letterSpacing: "0.08em" }}>
            PERMANENT BONUSES YOU'LL EARN:
          </div>
          {PRESTIGE_BONUSES.map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "6px 0", borderBottom: i < PRESTIGE_BONUSES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{b.split(" ")[0]}</span>
              <span style={{ color: "#bba0dd", fontSize: 12, lineHeight: 1.5 }}>{b.split(" ").slice(1).join(" ")}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: "rgba(255,77,106,0.07)", border: "1px solid rgba(255,77,106,0.2)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 20,
        }}>
          <div style={{ color: "#ff4d6a", fontWeight: 700, fontSize: 12 }}>⚠️ What you lose:</div>
          <div style={{ color: "#553344", fontSize: 12, marginTop: 4 }}>
            Level resets to 1 · Upgrades wiped · Current coins reset · Progress starts fresh
          </div>
        </div>

        {!confirming ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, color: "#aaa", cursor: "pointer", padding: "12px", fontWeight: 700, fontSize: 14,
              }}
            >
              Not yet
            </button>
            <button
              onClick={() => setConfirming(true)}
              disabled={!canPrestige}
              style={{
                flex: 2,
                background: canPrestige
                  ? "linear-gradient(135deg,#a16207,#f5c842)"
                  : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: 12,
                color: canPrestige ? "#000" : "#555",
                cursor: canPrestige ? "pointer" : "not-allowed",
                padding: "12px", fontWeight: 900, fontSize: 14,
              }}
            >
              ✨ Prestige Now
            </button>
          </div>
        ) : (
          <div>
            <div style={{ color: "#f5c842", fontWeight: 800, fontSize: 14, textAlign: "center", marginBottom: 12 }}>
              Are you absolutely sure?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, color: "#aaa", cursor: "pointer", padding: "12px", fontWeight: 700, fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePrestige}
                disabled={loading}
                style={{
                  flex: 2,
                  background: "linear-gradient(135deg,#7c0000,#dc2626)",
                  border: "none", borderRadius: 12, color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  padding: "12px", fontWeight: 900, fontSize: 13,
                }}
              >
                {loading ? "Prestiging..." : "🔥 YES, PRESTIGE!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
