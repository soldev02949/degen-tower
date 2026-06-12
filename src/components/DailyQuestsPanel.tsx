"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Quest {
  quest_id: string;
  name: string;
  description: string;
  reward_coins: number;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

const QUEST_EMOJI: Record<string, string> = {
  tap_500: "👆",
  earn_10k: "💰",
  reach_combo_10: "🔥",
  floor_20: "🏰",
  buy_upgrade: "⚡",
  play_3_hours: "⏱",
};

interface DailyQuestsPanelProps {
  userId: string;
  totalTaps?: number;
  totalEarned?: number;
  currentCombo?: number;
  onRewardClaimed?: (coins: number) => void;
}

export default function DailyQuestsPanel({
  userId, totalTaps = 0, totalEarned = 0, currentCombo = 0, onRewardClaimed,
}: DailyQuestsPanelProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuests = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: questDefs } = await supabase
      .from("daily_quests")
      .select("*")
      .eq("quest_date", today)
      .eq("is_active", true);

    if (!questDefs?.length) { setLoading(false); return; }

    const { data: progress } = await supabase
      .from("player_quest_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("quest_date", today);

    const progressMap = new Map((progress || []).map((p: { quest_id: string }) => [p.quest_id, p]));

    setQuests(
      questDefs.map((q) => {
        const p = progressMap.get(q.quest_id) as { progress?: number; completed?: boolean; claimed?: boolean } | undefined;
        return {
          quest_id: q.quest_id,
          name: q.name,
          description: q.description,
          reward_coins: q.reward_coins,
          target: q.target,
          progress: p?.progress ?? 0,
          completed: p?.completed ?? false,
          claimed: p?.claimed ?? false,
        };
      })
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) loadQuests(); }, [userId, loadQuests]);

  // Update tap/earn/combo progress in realtime
  useEffect(() => {
    if (!userId || quests.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);

    const updates = quests
      .filter((q) => !q.completed)
      .map((q) => {
        let progress = 0;
        if (q.quest_id === "tap_500") progress = Math.min(totalTaps, q.target);
        if (q.quest_id === "earn_10k") progress = Math.min(totalEarned, q.target);
        if (q.quest_id === "reach_combo_10") progress = Math.min(Math.floor(currentCombo), q.target);
        return { quest_id: q.quest_id, progress, completed: progress >= q.target };
      })
      .filter((u) => u.progress > 0);

    if (updates.length === 0) return;

    updates.forEach(async (u) => {
      await supabase.from("player_quest_progress").upsert({
        user_id: userId,
        quest_id: u.quest_id,
        quest_date: today,
        progress: u.progress,
        completed: u.completed,
        completed_at: u.completed ? new Date().toISOString() : null,
      }, { onConflict: "user_id,quest_id,quest_date" });
    });

    setQuests((prev) =>
      prev.map((q) => {
        const u = updates.find((x) => x.quest_id === q.quest_id);
        return u ? { ...q, progress: u.progress, completed: u.completed } : q;
      })
    );
  }, [totalTaps, totalEarned, currentCombo]); // eslint-disable-line

  async function claimReward(questId: string, rewardCoins: number) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("player_quest_progress").upsert({
      user_id: userId,
      quest_id: questId,
      quest_date: today,
      claimed: true,
      completed: true,
    }, { onConflict: "user_id,quest_id,quest_date" });

    setQuests((prev) =>
      prev.map((q) => (q.quest_id === questId ? { ...q, claimed: true } : q))
    );
    onRewardClaimed?.(rewardCoins);
  }

  if (loading) {
    return <div style={{ color: "#553366", fontSize: 12, padding: "20px", textAlign: "center" }}>Loading quests...</div>;
  }

  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>🧭 Daily Quests</div>
        <div style={{
          background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
          borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#c084fc", fontWeight: 700,
        }}>
          {completedCount}/{quests.length} done
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {quests.map((q) => {
          const pct = Math.min(100, (q.progress / q.target) * 100);
          return (
            <div
              key={q.quest_id}
              style={{
                background: q.claimed
                  ? "rgba(34,214,122,0.05)"
                  : q.completed
                  ? "rgba(168,85,247,0.08)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  q.claimed
                    ? "rgba(34,214,122,0.2)"
                    : q.completed
                    ? "rgba(168,85,247,0.25)"
                    : "rgba(255,255,255,0.06)"
                }`,
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{QUEST_EMOJI[q.quest_id] || "🎯"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#ddd", fontWeight: 700, fontSize: 13 }}>{q.name}</span>
                    <span style={{ color: "#f5c842", fontWeight: 800, fontSize: 11 }}>+{q.reward_coins.toLocaleString()} $T</span>
                  </div>
                  <div style={{ color: "#443355", fontSize: 11, marginTop: 2 }}>{q.description}</div>
                  {/* Progress bar */}
                  <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: 2,
                      background: q.claimed ? "#22d67a" : q.completed ? "#a855f7" : "#7c3aed",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <div style={{ color: "#333", fontSize: 10, marginTop: 4 }}>
                    {q.progress.toLocaleString()} / {q.target.toLocaleString()}
                  </div>
                </div>
                {q.completed && !q.claimed && (
                  <button
                    onClick={() => claimReward(q.quest_id, q.reward_coins)}
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                      border: "none", borderRadius: 8,
                      color: "#fff", cursor: "pointer",
                      padding: "7px 12px", fontWeight: 800, fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    Claim
                  </button>
                )}
                {q.claimed && (
                  <span style={{ color: "#22d67a", fontSize: 16 }}>✅</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
