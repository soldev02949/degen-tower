"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STREAK_REWARDS = [
  { day: 1, reward: "100 $TOWER", emoji: "🎁" },
  { day: 2, reward: "200 $TOWER", emoji: "🎁" },
  { day: 3, reward: "400 $TOWER", emoji: "💰" },
  { day: 4, reward: "600 $TOWER", emoji: "💰" },
  { day: 5, reward: "1,000 $TOWER", emoji: "💎" },
  { day: 6, reward: "1,500 $TOWER", emoji: "💎" },
  { day: 7, reward: "3,000 + Skin", emoji: "👑" },
];

interface StreakData {
  current_streak: number;
  last_login_date: string | null;
  longest_streak: number;
}

interface StreakWidgetProps {
  userId: string;
  onRewardClaimed?: (coins: number) => void;
}

export default function StreakWidget({ userId, onRewardClaimed }: StreakWidgetProps) {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [claimedToday, setClaimedToday] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadStreak();
  }, [userId]);

  async function loadStreak() {
    const { data } = await supabase
      .from("dt_player_streaks")
      .select("current_streak,last_login_date,longest_streak")
      .eq("user_id", userId)
      .single();

    if (data) {
      setStreak(data);
      const today = new Date().toISOString().slice(0, 10);
      setClaimedToday(data.last_login_date === today);
    } else {
      // Initialize streak row
      await supabase.from("dt_player_streaks").insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_login_date: null,
      });
      setStreak({ current_streak: 0, last_login_date: null, longest_streak: 0 });
    }
  }

  async function claimStreak() {
    if (!userId || claimedToday || claiming) return;
    setClaiming(true);

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const wasYesterday = streak?.last_login_date === yesterday;
    const newStreak = wasYesterday ? (streak?.current_streak || 0) + 1 : 1;
    const dayIndex = Math.min(newStreak, 7) - 1;
    const rewardAmounts = [100, 200, 400, 600, 1000, 1500, 3000];
    const rewardCoins = rewardAmounts[dayIndex] || 3000;

    await supabase.from("dt_player_streaks").upsert({
      user_id: userId,
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak?.longest_streak || 0),
      last_login_date: today,
    });

    setStreak((s) => s ? { ...s, current_streak: newStreak, last_login_date: today } : s);
    setClaimedToday(true);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
    onRewardClaimed?.(rewardCoins);
    setClaiming(false);
  }

  if (!streak) return null;

  const currentDay = Math.min(streak.current_streak % 7 || 7, 7);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "16px",
      position: "relative",
    }}>
      {/* Reward claimed toast */}
      {showReward && (
        <div style={{
          position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#7c3aed,#a855f7)",
          borderRadius: 20, padding: "8px 18px", color: "#fff", fontWeight: 900, fontSize: 13,
          whiteSpace: "nowrap", animation: "rise 0.3s ease-out",
          boxShadow: "0 0 30px rgba(168,85,247,0.5)",
        }}>
          🎁 Streak claimed!
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>
            🔥 Daily Streak
          </div>
          <div style={{ color: "#553366", fontSize: 11, marginTop: 2 }}>
            {streak.current_streak} day streak · Best: {streak.longest_streak}
          </div>
        </div>
        <button
          onClick={claimStreak}
          disabled={claimedToday || claiming}
          style={{
            background: claimedToday
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(135deg,#7c3aed,#a855f7)",
            border: claimedToday ? "1px solid rgba(255,255,255,0.1)" : "none",
            borderRadius: 10,
            color: claimedToday ? "#444" : "#fff",
            cursor: claimedToday ? "not-allowed" : "pointer",
            padding: "8px 14px",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {claimedToday ? "✓ Claimed" : claiming ? "..." : "Claim"}
        </button>
      </div>

      {/* 7-day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {STREAK_REWARDS.map((day, i) => {
          const completed = i + 1 < currentDay || (claimedToday && i + 1 === currentDay);
          const isToday = !claimedToday && i + 1 === currentDay;
          return (
            <div
              key={day.day}
              style={{
                background: completed
                  ? "rgba(34,214,122,0.1)"
                  : isToday
                  ? "rgba(168,85,247,0.15)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  completed
                    ? "rgba(34,214,122,0.3)"
                    : isToday
                    ? "rgba(168,85,247,0.4)"
                    : "rgba(255,255,255,0.06)"
                }`,
                borderRadius: 8,
                padding: "6px 4px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 14 }}>{completed ? "✅" : day.emoji}</div>
              <div style={{ color: "#333", fontSize: 9, marginTop: 2 }}>Day {day.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
