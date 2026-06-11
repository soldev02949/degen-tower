// Device fingerprinting + security event logging
import { supabase } from "./supabase";

/** Generate a browser fingerprint from canvas, screen, and UA */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    const parts: string[] = [];

    // Canvas fingerprint
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#a855f7";
      ctx.fillText("DegenClicker🐸", 2, 2);
      ctx.fillStyle = "rgba(34,214,122,0.5)";
      ctx.fillRect(10, 1, 62, 20);
      parts.push(canvas.toDataURL().slice(-40));
    }

    // Screen + timezone
    parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    parts.push(navigator.language);
    parts.push(String(navigator.hardwareConcurrency || 0));
    parts.push(navigator.platform || "");

    const raw = parts.join("|");
    // Simple hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36) + raw.length.toString(36);
  } catch {
    return "unknown_" + Math.random().toString(36).slice(2);
  }
}

/** Store device fingerprint + IP association for this player */
export async function registerDeviceFingerprint(
  playerId: string,
  fingerprint: string
) {
  try {
    // Try to get IP via public API
    let ip = "";
    try {
      const r = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
      if (r.ok) { const d = await r.json(); ip = d.ip || ""; }
    } catch {}

    // Upsert fingerprint record
    await supabase.from("dt_device_fingerprints").upsert(
      { fingerprint, player_id: playerId, ip_address: ip, user_agent: navigator.userAgent, last_seen: new Date().toISOString() },
      { onConflict: "fingerprint,player_id" }
    );

    // Track IP→player
    if (ip) {
      await supabase.from("dt_ip_accounts").upsert(
        { ip_address: ip, player_id: playerId, last_seen: new Date().toISOString() },
        { onConflict: "ip_address,player_id" }
      );
    }

    // Update player record with fingerprint+ip
    await supabase.from("dt_players")
      .update({ device_fingerprint: fingerprint, ip_address: ip || undefined })
      .eq("wallet_address", playerId);

    // Check for multi-account abuse: same fingerprint, different players
    const { data: others } = await supabase
      .from("dt_device_fingerprints")
      .select("player_id")
      .eq("fingerprint", fingerprint)
      .neq("player_id", playerId);

    if (others && others.length > 0) {
      await flagAccount(playerId, "Multi-account detected: same device fingerprint on multiple accounts", {
        fingerprint,
        other_players: others.map((o) => o.player_id),
      });
    }

    // Check for shared IP multi-account
    if (ip) {
      const { data: ipOthers } = await supabase
        .from("dt_ip_accounts")
        .select("player_id")
        .eq("ip_address", ip)
        .neq("player_id", playerId);

      if (ipOthers && ipOthers.length > 0) {
        await flagAccount(playerId, "Multi-account detected: same IP on multiple accounts", {
          ip_address: ip,
          other_players: ipOthers.map((o) => o.player_id),
        });
      }
    }
  } catch {
    // Silent fail — security is non-blocking
  }
}

/** Flag an account for admin review */
export async function flagAccount(
  playerId: string,
  reason: string,
  details: Record<string, unknown> = {}
) {
  try {
    // Upsert flag (update if already exists)
    await supabase.from("dt_flagged_accounts").upsert(
      { player_id: playerId, flag_reason: reason, flag_details: details, status: "pending", updated_at: new Date().toISOString() },
      { onConflict: "player_id" }
    );
    // Increment flag_count manually
    const { data: pdata } = await supabase
      .from("dt_players").select("flag_count").eq("wallet_address", playerId).maybeSingle();
    await supabase.from("dt_players")
      .update({ flag_count: ((pdata?.flag_count) || 0) + 1 })
      .eq("wallet_address", playerId);
    // Log event
    await supabase.from("dt_security_events").insert({
      player_id: playerId,
      event_type: "account_flagged",
      severity: "medium",
      data: { reason, ...details },
    });
  } catch {}
}

/** Log a security event */
export async function logSecurityEvent(
  playerId: string,
  eventType: string,
  severity: "low" | "medium" | "high" = "low",
  data: Record<string, unknown> = {}
) {
  try {
    await supabase.from("dt_security_events").insert({
      player_id: playerId,
      event_type: eventType,
      severity,
      data,
    });
  } catch {}
}

/** Check if a player is banned (call on game start) */
export async function checkPlayerStatus(
  playerId: string
): Promise<{ banned: boolean; disqualified: boolean; reason?: string }> {
  try {
    const { data } = await supabase
      .from("dt_players")
      .select("is_banned,ban_reason,disqualified,disqualify_reason")
      .eq("wallet_address", playerId)
      .maybeSingle();
    if (!data) return { banned: false, disqualified: false };
    return {
      banned: data.is_banned || false,
      disqualified: data.disqualified || false,
      reason: data.ban_reason || data.disqualify_reason,
    };
  } catch {
    return { banned: false, disqualified: false };
  }
}
