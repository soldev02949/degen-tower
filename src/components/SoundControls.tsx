"use client";
import { useSound } from "@/lib/sound";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { useState } from "react";

export default function SoundControls({ compact = false }: { compact?: boolean }) {
  const { volume, muted, setVolume, toggleMute } = useSound();
  const [showSlider, setShowSlider] = useState(false);

  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  if (compact) {
    return (
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => setShowSlider((s) => !s)}
          onBlur={() => setTimeout(() => setShowSlider(false), 150)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: muted ? "#555" : "#aaa",
            cursor: "pointer",
            padding: "5px 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
          }}
          title="Sound settings"
        >
          <Icon size={14} />
        </button>
        {showSlider && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 99,
              background: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 160,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#aaa", fontSize: 11, fontWeight: 700 }}>SOUND</span>
              <button
                onClick={toggleMute}
                style={{
                  background: muted ? "rgba(255,77,106,0.15)" : "rgba(34,214,122,0.1)",
                  border: `1px solid ${muted ? "rgba(255,77,106,0.3)" : "rgba(34,214,122,0.2)"}`,
                  borderRadius: 6,
                  color: muted ? "#ff4d6a" : "#22d67a",
                  cursor: "pointer",
                  padding: "3px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {muted ? "MUTED" : "ON"}
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0 && muted) toggleMute();
              }}
              style={{ width: "100%", accentColor: "#a855f7" }}
            />
            <div style={{ color: "#555", fontSize: 10, textAlign: "center" }}>
              {muted ? "Muted" : `${Math.round(volume * 100)}%`}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "8px 12px",
      }}
    >
      <button
        onClick={toggleMute}
        style={{
          background: "none",
          border: "none",
          color: muted ? "#ff4d6a" : "#a855f7",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        <Icon size={18} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          setVolume(v);
          if (v > 0 && muted) toggleMute();
        }}
        style={{ width: 80, accentColor: "#a855f7" }}
      />
      <span style={{ color: "#555", fontSize: 11, minWidth: 28 }}>
        {muted ? "—" : `${Math.round(volume * 100)}%`}
      </span>
    </div>
  );
}
