"use client";
import { useEffect, useState } from "react";
import { requestPushPermission, subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";
import { Bell, BellOff } from "lucide-react";

export default function PushNotifToggle({ userId }: { userId: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
    isPushSubscribed().then(setSubscribed);
  }, []);

  async function toggle() {
    setLoading(true);
    if (subscribed) {
      await unsubscribeFromPush(userId);
      setSubscribed(false);
    } else {
      const granted = await requestPushPermission();
      setPermission(Notification.permission);
      if (granted) {
        const ok = await subscribeToPush(userId);
        setSubscribed(ok);
      }
    }
    setLoading(false);
  }

  if (!("Notification" in window)) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {subscribed
          ? <Bell size={18} color="#22d67a" />
          : <BellOff size={18} color="#555" />
        }
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Push Notifications</div>
          <div style={{ color: "#444", fontSize: 11 }}>
            {subscribed
              ? "Rank alerts, season start, combo records"
              : permission === "denied"
              ? "Blocked in browser — allow in settings"
              : "Get alerts for rank drops, season starts"}
          </div>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={loading || permission === "denied"}
        style={{
          background: subscribed ? "rgba(34,214,122,0.12)" : "rgba(168,85,247,0.12)",
          border: `1px solid ${subscribed ? "rgba(34,214,122,0.3)" : "rgba(168,85,247,0.3)"}`,
          borderRadius: 10,
          color: subscribed ? "#22d67a" : "#a855f7",
          cursor: loading || permission === "denied" ? "not-allowed" : "pointer",
          padding: "7px 14px",
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {loading ? "..." : subscribed ? "ON" : "Enable"}
      </button>
    </div>
  );
}
