"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const EMOTES = [
  { key: "gg",    label: "GG",  emoji: "🤝" },
  { key: "fire",  label: "🔥",  emoji: "🔥" },
  { key: "skull", label: "💀",  emoji: "💀" },
  { key: "clown", label: "🤡",  emoji: "🤡" },
  { key: "moon",  label: "🌙",  emoji: "🌙" },
  { key: "monke", label: "🦍",  emoji: "🦍" },
];

interface EmoteMessage {
  id: string;
  username: string;
  emote: string;
  sent_at: string;
}

interface EmoteWheelProps {
  roomId: string;
  userId: string;
  username: string;
}

export default function EmoteWheel({ roomId, userId, username }: EmoteWheelProps) {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<EmoteMessage[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const feedRef = useRef<EmoteMessage[]>([]);

  useEffect(() => {
    // Subscribe to emote channel
    const channel = supabase
      .channel(`emotes:${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "game_emotes",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const msg = payload.new as EmoteMessage;
        feedRef.current = [...feedRef.current.slice(-9), msg];
        setFeed([...feedRef.current]);
        // Auto-remove after 3s
        setTimeout(() => {
          feedRef.current = feedRef.current.filter((m) => m.id !== msg.id);
          setFeed([...feedRef.current]);
        }, 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  async function sendEmote(emoteKey: string) {
    if (cooldown) return;
    setCooldown(true);
    setOpen(false);
    setTimeout(() => setCooldown(false), 1500);

    const emote = EMOTES.find((e) => e.key === emoteKey);
    if (!emote) return;

    await supabase.from("game_emotes").insert({
      room_id: roomId,
      user_id: userId,
      username: username || "Degen",
      emote: emote.emoji,
    });
  }

  return (
    <>
      {/* Emote feed overlay */}
      <div style={{
        position: "fixed", top: 80, left: 12, zIndex: 90,
        display: "flex", flexDirection: "column-reverse", gap: 4,
        pointerEvents: "none",
      }}>
        {feed.slice(-4).map((m) => (
          <div
            key={m.id}
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "5px 12px",
              display: "flex", alignItems: "center", gap: 6,
              animation: "rise 0.25s ease-out",
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 700, color: "#aaa", fontSize: 11 }}>{m.username}</span>
            <span>{m.emote}</span>
          </div>
        ))}
      </div>

      {/* Emote button + wheel */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            background: open ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${open ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 10,
            color: "#aaa",
            cursor: "pointer",
            padding: "7px 11px",
            fontSize: 16,
            lineHeight: 1,
          }}
          title="Emotes"
        >
          😄
        </button>

        {open && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
            transform: "translateX(-50%)",
            background: "#0d0020",
            border: "1px solid rgba(168,85,247,0.25)",
            borderRadius: 14,
            padding: "10px",
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
            zIndex: 200,
            boxShadow: "0 0 30px rgba(168,85,247,0.2)",
          }}>
            {EMOTES.map((e) => (
              <button
                key={e.key}
                onClick={() => sendEmote(e.key)}
                disabled={cooldown}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "#fff",
                  cursor: cooldown ? "not-allowed" : "pointer",
                  padding: "10px 8px",
                  fontSize: 22,
                  textAlign: "center",
                  lineHeight: 1,
                }}
                title={e.label}
              >
                {e.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
