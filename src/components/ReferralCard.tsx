"use client";
import { useState } from "react";
import { buildReferralUrl } from "@/lib/referral";
import { Copy, Check, Share2 } from "lucide-react";

export default function ReferralCard({ userId, referralCode }: { userId: string; referralCode: string }) {
  const [copied, setCopied] = useState(false);
  const url = buildReferralUrl(referralCode);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: "Degen Clicker — Join me!",
        text: "Play Degen Clicker and win USDC every 48hrs! Use my link and we both get 500 $TOWER:",
        url,
      }).catch(() => {});
    } else {
      copy();
    }
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg,rgba(168,85,247,0.08),rgba(168,85,247,0.03))",
        border: "1px solid rgba(168,85,247,0.25)",
        borderRadius: 16,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>🎁</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>Invite Friends</div>
          <div style={{ color: "#6644aa", fontSize: 11 }}>You + friend both get 500 $TOWER on signup</div>
        </div>
      </div>
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: 10,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          overflow: "hidden",
        }}
      >
        <span style={{ color: "#22d67a", fontFamily: "monospace", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {url}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={copy}
          style={{
            flex: 1,
            background: copied ? "rgba(34,214,122,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? "rgba(34,214,122,0.3)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 8,
            color: copied ? "#22d67a" : "#ccc",
            cursor: "pointer",
            padding: "8px 10px",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button
          onClick={share}
          style={{
            flex: 1,
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 8,
            color: "#a855f7",
            cursor: "pointer",
            padding: "8px 10px",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Share2 size={13} />
          Share
        </button>
      </div>
    </div>
  );
}
