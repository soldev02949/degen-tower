"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const BG = {
  glass: "rgba(18,8,34,0.82)",
  border: "rgba(168,85,247,0.18)",
  gold: "#f5c842",
  green: "#22d67a",
  purple: "#a855f7",
  red: "#f87171",
};

const MP_UPGRADES = [
  { id: "tap", emoji: "⚡", name: "Power Tap", desc: "+1 tap power", cost: 300, type: "tap", value: 1 },
  { id: "mult", emoji: "✖️", name: "Combo Mult", desc: "+25% score", cost: 1200, type: "mult", value: 0.25 },
  { id: "auto", emoji: "🤖", name: "Auto Bot", desc: "+1 auto tap/sec", cost: 2200, type: "auto", value: 1 },
  { id: "crit", emoji: "💥", name: "Crit Chance", desc: "+8% crit chance", cost: 2600, type: "crit", value: 0.08 },
  { id: "frenzy", emoji: "🔥", name: "Frenzy Core", desc: "+40% tap value", cost: 4200, type: "frenzy", value: 0.4 },
] as const;

type UpgradeId = (typeof MP_UPGRADES)[number]["id"];

type Stats = {
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  lossStreak: number;
  bestStreak: number;
  ladder: number;
  mmr: number;
  seasonWins: number;
  seasonPoints: number;
  totalSpent: number;
};

type PlayerMeta = {
  id: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
  charId: string;
  joinedAt: number;
  mmr: number;
  wins: number;
  streak: number;
};

type RemoteState = {
  playerId: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
  charId: string;
  taps: number;
  score: number;
  spent: number;
  upgrades: Partial<Record<UpgradeId, number>>;
  readyRematch?: boolean;
  ts: number;
};

type MatchMeta = {
  matchId: string;
  mode: "public" | "private";
  ranked: boolean;
  code?: string;
  players: PlayerMeta[];
  startAt: number;
  durationMs: number;
  createdBy: string;
};

type MPLeaderRow = {
  playerId: string;
  username: string;
  avatarUrl?: string | null;
  charId: string;
  wins: number;
  ladder: number;
  streak: number;
  lossStreak: number;
};

type ArenaProps = {
  playerId: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
  charId: string | null;
  coins: number;
  onSpendCoins: (amount: number) => Promise<boolean>;
};

function randId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function formatNum(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.floor(n)}`;
}
function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function charEmoji(id: string) {
  return ({ pepe: "🐸", gigachad: "💪", trump: "🎩", troll: "🧌", bonk: "🐕" } as Record<string, string>)[id] || "🐸";
}
function charGlow(id: string) {
  return ({ pepe: "76,175,80", gigachad: "224,184,122", trump: "59,130,246", troll: "168,85,247", bonk: "232,133,58" } as Record<string, string>)[id] || "168,85,247";
}
function baseTapForChar(id: string) {
  return ({ pepe: 1, gigachad: 1.1, trump: 1.25, troll: 1, bonk: 1.05 } as Record<string, number>)[id] || 1;
}
function statsKey(playerId: string) { return `degen_mp_stats_${playerId}`; }
function seasonKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function loadStats(playerId: string): Stats {
  const defaults: Stats = { wins: 0, losses: 0, draws: 0, streak: 0, lossStreak: 0, bestStreak: 0, ladder: 0, mmr: 1000, seasonWins: 0, seasonPoints: 0, totalSpent: 0 };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(statsKey(playerId));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Stats> & { seasonId?: string };
    if (parsed.seasonId !== seasonKey()) {
      return { ...defaults, ...parsed, seasonWins: 0, seasonPoints: 0 };
    }
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}
function saveStats(playerId: string, stats: Stats) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(statsKey(playerId), JSON.stringify({ ...stats, seasonId: seasonKey() })); } catch {}
}

export default function MultiplayerArena({ playerId, username, avatar, avatarUrl, charId, coins, onSpendCoins }: ArenaProps) {
  const [stats, setStats] = useState<Stats>(() => loadStats(playerId || "anon"));
  const [mpLeaderboard, setMpLeaderboard] = useState<MPLeaderRow[]>([]);
  const [phase, setPhase] = useState<"hub" | "queue" | "pregame" | "battle" | "result">("hub");
  const [mode, setMode] = useState<"public" | "private">("public");
  const [ranked, setRanked] = useState(true);
  const [privateCodeInput, setPrivateCodeInput] = useState("");
  const [privateCode, setPrivateCode] = useState("");
  const [privateMembers, setPrivateMembers] = useState<PlayerMeta[]>([]);
  const [queueCount, setQueueCount] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchMeta | null>(null);
  const [myTaps, setMyTaps] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [mySpent, setMySpent] = useState(0);
  const [myUpgrades, setMyUpgrades] = useState<Partial<Record<UpgradeId, number>>>({});
  const [remote, setRemote] = useState<RemoteState | null>(null);
  const [resolved, setResolved] = useState<"win" | "loss" | "draw" | null>(null);
  const [resultLocked, setResultLocked] = useState(false);
  const [matchCountdown, setMatchCountdown] = useState(0);
  const [battleTick, setBattleTick] = useState(0);
  const [rematchReady, setRematchReady] = useState(false);
  const [oppRematchReady, setOppRematchReady] = useState(false);

  const publicChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const publicWaitingRef = useRef<Record<string, PlayerMeta>>({});
  const publicPendingRef = useRef<Record<string, MatchMeta>>({});
  const privateChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const matchChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const matchRef = useRef<MatchMeta | null>(null);
  const lockRef = useRef("");
  const statsRef = useRef(stats);
  const lastBroadcastRef = useRef(0);
  const rematchSentRef = useRef(false);
  const lastRemoteTsRef = useRef(0);
  const localStateRef = useRef({ myTaps: 0, myScore: 0, mySpent: 0, myUpgrades: {} as Partial<Record<UpgradeId, number>> });

  useEffect(() => { statsRef.current = stats; saveStats(playerId || "anon", stats); }, [playerId, stats]);
  useEffect(() => { localStateRef.current = { myTaps, myScore, mySpent, myUpgrades }; }, [myTaps, myScore, mySpent, myUpgrades]);
  useEffect(() => { setStats(loadStats(playerId || "anon")); }, [playerId]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const refreshMPLeaderboard = useCallback(async () => {
    const { data, error } = await supabase
      .from("dt_players")
      .select("wallet_address,username,character,avatar_url,upgrades")
      .limit(1000);
    if (error || !data) return;
    const board = data
      .map((row) => {
        const upgrades = ((row as { upgrades?: Record<string, number> | null }).upgrades || {}) as Record<string, number>;
        return {
          playerId: (row as { wallet_address: string }).wallet_address,
          username: (row as { username?: string | null }).username || "Degen",
          avatarUrl: (row as { avatar_url?: string | null }).avatar_url || null,
          charId: (row as { character?: string | null }).character || "pepe",
          wins: Math.floor(upgrades.mp_wins || 0),
          ladder: Math.floor(upgrades.mp_ladder || 0),
          streak: Math.floor(upgrades.mp_streak || 0),
          lossStreak: Math.floor(upgrades.mp_loss_streak || 0),
        } satisfies MPLeaderRow;
      })
      .filter((row) => row.wins > 0 || row.ladder > 0 || row.streak > 0 || row.lossStreak > 0)
      .sort((a, b) => (b.ladder - a.ladder) || (b.wins - a.wins) || (b.streak - a.streak) || a.username.localeCompare(b.username))
      .slice(0, 25);
    setMpLeaderboard(board);
  }, []);

  const persistMPStats = useCallback(async (next: Stats) => {
    if (!playerId) return;
    const { data, error } = await supabase
      .from("dt_players")
      .select("upgrades")
      .eq("wallet_address", playerId)
      .limit(1)
      .maybeSingle();
    if (error) return;
    const prevUpgrades = ((data?.upgrades as Record<string, number> | null) || {}) as Record<string, number>;
    const payload = {
      ...prevUpgrades,
      mp_wins: next.wins,
      mp_losses: next.losses,
      mp_draws: next.draws,
      mp_streak: next.streak,
      mp_loss_streak: next.lossStreak,
      mp_best_streak: next.bestStreak,
      mp_ladder: next.ladder,
      mp_mmr: next.mmr,
      mp_season_wins: next.seasonWins,
      mp_season_points: next.seasonPoints,
      mp_total_spent: next.totalSpent,
    };
    await supabase.from("dt_players").update({ upgrades: payload }).eq("wallet_address", playerId);
    await refreshMPLeaderboard();
  }, [playerId, refreshMPLeaderboard]);

  useEffect(() => {
    if (!playerId) return;
    void refreshMPLeaderboard();
    void (async () => {
      const { data, error } = await supabase
        .from("dt_players")
        .select("upgrades")
        .eq("wallet_address", playerId)
        .limit(1)
        .maybeSingle();
      if (error || !data?.upgrades) return;
      const upgrades = data.upgrades as Record<string, number>;
      setStats((prev) => ({
        ...prev,
        wins: Math.floor(upgrades.mp_wins ?? prev.wins),
        losses: Math.floor(upgrades.mp_losses ?? prev.losses),
        draws: Math.floor(upgrades.mp_draws ?? prev.draws),
        streak: Math.floor(upgrades.mp_streak ?? prev.streak),
        lossStreak: Math.floor(upgrades.mp_loss_streak ?? prev.lossStreak),
        bestStreak: Math.floor(upgrades.mp_best_streak ?? prev.bestStreak),
        ladder: Math.floor(upgrades.mp_ladder ?? prev.ladder),
        mmr: Math.floor(upgrades.mp_mmr ?? prev.mmr),
        seasonWins: Math.floor(upgrades.mp_season_wins ?? prev.seasonWins),
        seasonPoints: Math.floor(upgrades.mp_season_points ?? prev.seasonPoints),
        totalSpent: Math.floor(upgrades.mp_total_spent ?? prev.totalSpent),
      }));
    })();
  }, [playerId, refreshMPLeaderboard]);

  const pushStateNow = useCallback((override?: Partial<RemoteState>) => {
    const ch = matchChannelRef.current;
    if (!ch || !playerId) return;
    const now = Date.now();
    lastBroadcastRef.current = now;
    void ch.send({
      type: "broadcast",
      event: "state",
      payload: {
        playerId,
        username: override?.username ?? username ?? "Degen",
        avatar: override?.avatar ?? avatar ?? charEmoji(charId || "pepe"),
        avatarUrl: override?.avatarUrl ?? avatarUrl,
        charId: override?.charId ?? charId ?? "pepe",
        taps: override?.taps ?? localStateRef.current.myTaps,
        score: override?.score ?? localStateRef.current.myScore,
        spent: override?.spent ?? localStateRef.current.mySpent,
        upgrades: override?.upgrades ?? localStateRef.current.myUpgrades,
        readyRematch: override?.readyRematch ?? rematchReady,
        ts: override?.ts ?? now,
      } satisfies RemoteState,
    });
  }, [avatar, avatarUrl, charId, playerId, rematchReady, username]);

  const me = useMemo<PlayerMeta>(() => ({
    id: playerId,
    username: username || "Degen",
    avatar: avatar || charEmoji(charId || "pepe"),
    avatarUrl,
    charId: charId || "pepe",
    joinedAt: Date.now(),
    mmr: stats.mmr,
    wins: stats.wins,
    streak: stats.streak,
  }), [playerId, username, avatar, avatarUrl, charId, stats]);

  const resetMatchState = useCallback(() => {
    setMyTaps(0); setMyScore(0); setMySpent(0); setMyUpgrades({}); setRemote(null);
    setResolved(null); setResultLocked(false); setRematchReady(false); setOppRematchReady(false); rematchSentRef.current = false; lastRemoteTsRef.current = 0;
  }, []);

  const leaveQueue = useCallback(async () => {
    if (publicChannelRef.current && playerId) {
      await publicChannelRef.current.send({ type: "broadcast", event: "leave_queue", payload: { playerId } });
    }
    setPhase("hub");
    setMode("public");
  }, [playerId]);

  const cleanupPrivate = useCallback(async () => {
    if (privateChannelRef.current) {
      try { await supabase.removeChannel(privateChannelRef.current); } catch {}
      privateChannelRef.current = null;
    }
    setPrivateCode("");
    setPrivateMembers([]);
  }, []);

  const cleanupMatch = useCallback(async () => {
    if (matchChannelRef.current) {
      try { await supabase.removeChannel(matchChannelRef.current); } catch {}
      matchChannelRef.current = null;
    }
    matchRef.current = null;
    setMatch(null);
  }, []);

  const beginMatch = useCallback(async (meta: MatchMeta) => {
    await cleanupMatch();
    resetMatchState();
    matchRef.current = meta;
    setMatch(meta);
    setMode(meta.mode);
    setRanked(meta.ranked);
    setPhase("pregame");

    const ch = supabase.channel(`mp_match_${meta.matchId}`, {
      config: { broadcast: { self: true } },
    });

    ch.on("broadcast", { event: "state" }, ({ payload }) => {
      const data = payload as RemoteState;
      if (!data || data.playerId === playerId) return;
      if ((data.ts || 0) < lastRemoteTsRef.current) return;
      lastRemoteTsRef.current = data.ts || Date.now();
      setRemote(data);
      setOppRematchReady(Boolean(data.readyRematch));
    });

    ch.on("broadcast", { event: "rematch_start" }, ({ payload }) => {
      const next = payload as MatchMeta;
      if (!next || !next.players?.some((p) => p.id === playerId)) return;
      void beginMatch(next);
    });

    await ch.subscribe();
    matchChannelRef.current = ch;

    if (publicChannelRef.current) {
      await publicChannelRef.current.send({ type: "broadcast", event: "leave_queue", payload: { playerId } });
    }
  }, [cleanupMatch, playerId, resetMatchState]);

  useEffect(() => {
    if (!playerId || !charId) return;
    const ch = supabase.channel("mp_public_v2", { config: { broadcast: { self: true } } });

    ch.on("broadcast", { event: "join_queue" }, ({ payload }) => {
      const p = payload as PlayerMeta;
      if (!p?.id) return;
      publicWaitingRef.current[p.id] = p;
    });
    ch.on("broadcast", { event: "leave_queue" }, ({ payload }) => {
      const p = payload as { playerId: string };
      if (p?.playerId) delete publicWaitingRef.current[p.playerId];
    });
    ch.on("broadcast", { event: "match_found" }, ({ payload }) => {
      const meta = payload as MatchMeta;
      if (!meta?.matchId) return;
      publicPendingRef.current[meta.matchId] = meta;
      if (meta.players.some((p) => p.id === playerId)) void beginMatch(meta);
      meta.players.forEach((p) => delete publicWaitingRef.current[p.id]);
    });

    ch.subscribe();
    publicChannelRef.current = ch;
    return () => { void supabase.removeChannel(ch); publicChannelRef.current = null; };
  }, [beginMatch, charId, playerId]);

  useEffect(() => {
    if (phase !== "queue" || mode !== "public" || !publicChannelRef.current) return;
    const sendJoin = () => publicChannelRef.current?.send({ type: "broadcast", event: "join_queue", payload: { ...me, joinedAt: Date.now() } });
    sendJoin();
    const iv = setInterval(sendJoin, 2500);
    return () => clearInterval(iv);
  }, [phase, mode, me]);

  useEffect(() => {
    if (phase !== "queue" || mode !== "public" || !playerId) return;
    const iv = setInterval(() => {
      const now = Date.now();
      const waiting = Object.values(publicWaitingRef.current)
        .filter((p) => now - p.joinedAt < 7000)
        .sort((a, b) => a.joinedAt - b.joinedAt);
      setQueueCount(Math.max(1, waiting.length));
      const first = waiting[0];
      const second = waiting[1];
      if (!first || !second) return;
      const sig = `${first.id}_${second.id}`;
      if (lockRef.current === sig) return;
      if (first.id !== playerId) return;
      lockRef.current = sig;
      setTimeout(() => { if (lockRef.current === sig) lockRef.current = ""; }, 8000);
      const meta: MatchMeta = {
        matchId: randId("pub"),
        mode: "public",
        ranked,
        players: [first, second],
        startAt: Date.now() + 5000,
        durationMs: 180000,
        createdBy: playerId,
      };
      void publicChannelRef.current?.send({ type: "broadcast", event: "match_found", payload: meta });
    }, 900);
    return () => clearInterval(iv);
  }, [phase, mode, playerId, ranked]);

  const openPrivateLobby = useCallback(async (code: string) => {
    await cleanupPrivate();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setPrivateCode(clean);
    setMode("private");
    setPhase("queue");
    const ch = supabase.channel(`mp_private_${clean}`, { config: { presence: { key: playerId } } });
    const syncMembers = () => {
      const state = ch.presenceState<Record<string, PlayerMeta>>();
      const members = Object.values(state).flat().map((row) => row as unknown as PlayerMeta);
      const dedup = Array.from(new Map(members.map((m) => [m.id, m])).values()).sort((a, b) => a.joinedAt - b.joinedAt);
      setPrivateMembers(dedup);
    };
    ch.on("presence", { event: "sync" }, syncMembers)
      .on("broadcast", { event: "launch_private" }, ({ payload }) => {
        const meta = payload as MatchMeta;
        if (meta?.players?.some((p) => p.id === playerId)) void beginMatch(meta);
      });
    await ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ ...me, joinedAt: Date.now() });
      }
    });
    privateChannelRef.current = ch;
  }, [beginMatch, cleanupPrivate, me, playerId]);

  const createPrivate = useCallback(async () => {
    const code = Math.random().toString(36).slice(2, 6).toUpperCase();
    await openPrivateLobby(code);
  }, [openPrivateLobby]);

  const joinPrivate = useCallback(async () => {
    const code = privateCodeInput.trim().toUpperCase();
    if (code.length < 4) { showToast("Enter a 4+ letter code"); return; }
    await openPrivateLobby(code);
  }, [openPrivateLobby, privateCodeInput, showToast]);

  const startPrivateMatch = useCallback(async () => {
    if (!privateChannelRef.current || privateMembers.length < 2) return;
    const players = privateMembers.slice(0, 2);
    const meta: MatchMeta = {
      matchId: randId("priv"),
      mode: "private",
      ranked: false,
      code: privateCode,
      players,
      startAt: Date.now() + 5000,
      durationMs: 180000,
      createdBy: playerId,
    };
    await privateChannelRef.current.send({ type: "broadcast", event: "launch_private", payload: meta });
  }, [playerId, privateCode, privateMembers]);

  useEffect(() => {
    if (!match) return;
    const iv = setInterval(() => {
      const now = Date.now();
      if (phase === "pregame") {
        const left = match.startAt - now;
        setMatchCountdown(left);
        if (left <= 0) setPhase("battle");
      } else if (phase === "battle") {
        const left = match.startAt + match.durationMs - now;
        setBattleTick(left);
        if (left <= 0) setPhase("result");
      }
    }, 100);
    return () => clearInterval(iv);
  }, [match, phase]);

  useEffect(() => {
    if (phase !== "battle") return;
    const iv = setInterval(() => {
      const autoLevel = localStateRef.current.myUpgrades.auto || 0;
      if (!autoLevel) return;
      const multLevel = localStateRef.current.myUpgrades.mult || 0;
      const add = autoLevel * 0.1;
      const nextTaps = localStateRef.current.myTaps + add;
      const nextScore = localStateRef.current.myScore + add * (1 + multLevel * 0.25);
      localStateRef.current = { ...localStateRef.current, myTaps: nextTaps, myScore: nextScore };
      setMyTaps(nextTaps);
      setMyScore(nextScore);
      pushStateNow({ taps: nextTaps, score: nextScore, upgrades: localStateRef.current.myUpgrades, spent: localStateRef.current.mySpent });
    }, 100);
    return () => clearInterval(iv);
  }, [phase, pushStateNow]);

  useEffect(() => {
    if (!matchChannelRef.current || !match || (phase !== "battle" && phase !== "result" && phase !== "pregame")) return;
    const iv = setInterval(() => {
      const now = Date.now();
      if (now - lastBroadcastRef.current < 90) return;
      pushStateNow();
    }, 100);
    return () => clearInterval(iv);
  }, [match, phase, pushStateNow]);

  useEffect(() => {
    if (phase !== "result" || resultLocked) return;
    const myFinal = myScore;
    const oppFinal = remote?.score || 0;
    const out = myFinal > oppFinal ? "win" : myFinal < oppFinal ? "loss" : "draw";
    setResolved(out);
    setResultLocked(true);
    setStats((prev) => {
      const next = { ...prev };
      if (out === "win") {
        next.wins += 1;
        next.streak += 1;
        next.lossStreak = 0;
        next.bestStreak = Math.max(next.bestStreak, next.streak);
        next.ladder += 1;
        next.seasonWins += 1;
        next.seasonPoints += match?.ranked ? 25 : 12;
        next.mmr += match?.ranked ? 24 : 8;
      } else if (out === "loss") {
        next.losses += 1;
        next.streak = 0;
        next.lossStreak += 1;
        if (next.lossStreak >= 3) {
          next.ladder = Math.max(0, next.ladder - 1);
          next.lossStreak = 0;
        }
        next.seasonPoints += match?.ranked ? 6 : 3;
        next.mmr = Math.max(700, next.mmr - (match?.ranked ? 16 : 4));
      } else {
        next.draws += 1;
        next.streak = 0;
        next.lossStreak = 0;
        next.seasonPoints += 10;
      }
      next.totalSpent += mySpent;
      return next;
    });
  }, [match?.ranked, myScore, mySpent, phase, remote?.score, resultLocked]);

  useEffect(() => {
    if (phase !== "result" || !resultLocked) return;
    void persistMPStats(stats);
  }, [persistMPStats, phase, resultLocked, stats]);

  useEffect(() => {
    if (phase !== "result" || !rematchReady || !oppRematchReady || rematchSentRef.current || !match) return;
    const host = [...match.players].sort((a, b) => a.id.localeCompare(b.id))[0];
    if (host.id !== playerId) return;
    rematchSentRef.current = true;
    const next: MatchMeta = {
      ...match,
      matchId: randId("rematch"),
      startAt: Date.now() + 5000,
      createdBy: playerId,
    };
    void matchChannelRef.current?.send({ type: "broadcast", event: "rematch_start", payload: next });
  }, [match, oppRematchReady, phase, playerId, rematchReady]);

  const tapNow = useCallback(() => {
    if (phase !== "battle") return;
    const tapLvl = localStateRef.current.myUpgrades.tap || 0;
    const multLvl = localStateRef.current.myUpgrades.mult || 0;
    const frenzyLvl = localStateRef.current.myUpgrades.frenzy || 0;
    const critLvl = localStateRef.current.myUpgrades.crit || 0;
    const currentTaps = localStateRef.current.myTaps;
    let base = baseTapForChar(charId || "pepe") + tapLvl;
    base *= 1 + multLvl * 0.25 + frenzyLvl * 0.4;
    if (Math.random() < critLvl * 0.08) base *= 2.5;
    if ((charId || "pepe") === "trump" && (currentTaps + 1) % 40 < 1) base *= 2;
    if ((charId || "pepe") === "troll") base *= 0.8 + Math.random() * 0.8;
    const nextTaps = currentTaps + 1;
    const nextScore = localStateRef.current.myScore + base;
    localStateRef.current = { ...localStateRef.current, myTaps: nextTaps, myScore: nextScore };
    setMyTaps(nextTaps);
    setMyScore(nextScore);
    pushStateNow({ taps: nextTaps, score: nextScore, upgrades: localStateRef.current.myUpgrades, spent: localStateRef.current.mySpent });
  }, [charId, phase, pushStateNow]);

  const buyUpgrade = useCallback(async (id: UpgradeId) => {
    if (phase !== "battle") return;
    const item = MP_UPGRADES.find((u) => u.id === id)!;
    const owned = localStateRef.current.myUpgrades[id] || 0;
    const price = Math.floor(item.cost * Math.pow(1.65, owned));
    const ok = await onSpendCoins(price);
    if (!ok) { showToast(coins >= price ? "Coin sync failed — retrying against your real balance" : "Not enough real coins"); return; }
    const nextSpent = localStateRef.current.mySpent + price;
    const nextUpgrades = { ...localStateRef.current.myUpgrades, [id]: owned + 1 };
    localStateRef.current = { ...localStateRef.current, mySpent: nextSpent, myUpgrades: nextUpgrades };
    setMySpent(nextSpent);
    setMyUpgrades(nextUpgrades);
    pushStateNow({ spent: nextSpent, upgrades: nextUpgrades, taps: localStateRef.current.myTaps, score: localStateRef.current.myScore });
    showToast(`${item.emoji} ${item.name} Lv.${owned + 1} bought for ${formatNum(price)}`);
  }, [onSpendCoins, phase, pushStateNow, showToast]);

  const opponent = useMemo(() => match?.players.find((p) => p.id !== playerId) || null, [match, playerId]);
  const battleLeft = match ? Math.max(0, match.startAt + match.durationMs - Date.now()) : 0;

  return (
    <div style={{ minHeight: "100vh", paddingTop: 58, paddingBottom: 110, background: "radial-gradient(circle at top, rgba(168,85,247,0.16), transparent 30%), #06000f", position: "relative" }}>
      <div className="arcade-grid" />
      {toast && <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 260, background: "rgba(34,214,122,0.12)", border: "1px solid rgba(34,214,122,0.28)", borderRadius: 16, color: BG.green, fontWeight: 900, fontSize: 12, padding: "9px 14px", backdropFilter: "blur(12px)" }}>{toast}</div>}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", padding: "14px 0 12px" }}>
          <div className="neon-flicker" style={{ color: "#f87171", fontWeight: 900, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6 }}>⚔ MULTIPLAYER ARENA ⚔</div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>1v1 Tap Battles</div>
          <div style={{ color: "#65507f", fontSize: 12, marginTop: 5 }}>Use your real clicker coins to buy match upgrades and out-tap the other player.</div>
        </div>

        {phase === "hub" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[
                { label: "Wins", value: stats.wins, color: BG.green },
                { label: "Ladder", value: stats.ladder, color: BG.gold },
                { label: "Win Streak", value: stats.streak, color: "#c084fc" },
                { label: "Season", value: stats.seasonPoints, color: "#60a5fa" },
              ].map((s) => (
                <div key={s.label} className="shine-card" style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 18, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ color: s.color, fontWeight: 900, fontSize: 18 }}>{s.value}</div>
                  <div style={{ color: "#5c4a72", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.12),rgba(168,85,247,0.08))", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 22, padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 30 }}>🌐</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>Public Matchmaking</div>
                  <div style={{ color: "#7f6c97", fontSize: 11.5 }}>Auto-pairs the next 2 players into a ranked 3-minute battle.</div>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#d7c6ef", fontSize: 12, fontWeight: 700 }}>
                <input type="checkbox" checked={ranked} onChange={(e) => setRanked(e.target.checked)} /> Ranked queue
              </label>
              <button disabled={!charId || !playerId} onClick={() => { setMode("public"); setPhase("queue"); }} className="press-fx" style={{ width: "100%", background: "linear-gradient(135deg,#dc2626,#a855f7)", color: "#fff", fontWeight: 900, border: "none", borderRadius: 16, padding: "15px 16px", fontSize: 15, boxShadow: "0 0 28px rgba(239,68,68,0.28)" }}>Start Public Match</button>
            </div>

            <div style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.12),rgba(168,85,247,0.08))", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 22, padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 30 }}>🔐</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>Private Lobby</div>
                  <div style={{ color: "#7f6c97", fontSize: 11.5 }}>V2 mode: create a code, invite 1 player, and run rematches.</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 10 }}>
                <input value={privateCodeInput} onChange={(e) => setPrivateCodeInput(e.target.value.toUpperCase().slice(0, 8))} placeholder="ENTER CODE" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, color: "#fff", padding: "12px 14px", fontWeight: 800, letterSpacing: "0.14em" }} />
                <button onClick={joinPrivate} className="press-fx" style={{ background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.35)", color: "#93c5fd", fontWeight: 900, borderRadius: 14, padding: "0 14px" }}>Join</button>
              </div>
              <button onClick={createPrivate} className="press-fx" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontWeight: 900, borderRadius: 16, padding: "14px 16px", fontSize: 14 }}>Create Private Code</button>
            </div>

            <div style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 20, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ color: BG.gold, fontWeight: 900, fontSize: 16 }}>🏆 Multiplayer Leaderboard</div>
                <button onClick={() => void refreshMPLeaderboard()} className="press-fx" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 800 }}>Refresh</button>
              </div>
              {mpLeaderboard.length === 0 ? (
                <div style={{ color: "#7f6c97", fontSize: 11.5 }}>No ranked multiplayer wins yet. First winners will appear here.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {mpLeaderboard.map((row, idx) => (
                    <div key={row.playerId} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center", background: idx < 3 ? "linear-gradient(135deg,rgba(245,200,66,0.12),rgba(168,85,247,0.06))" : "rgba(255,255,255,0.03)", border: `1px solid ${idx < 3 ? "rgba(245,200,66,0.22)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "10px 12px" }}>
                      <div style={{ color: idx === 0 ? BG.gold : idx === 1 ? "#cbd5e1" : idx === 2 ? "#f59e0b" : "#8b7aa3", fontWeight: 900, fontSize: 13, minWidth: 26 }}>#{idx + 1}</div>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: 12.5 }}>{row.username}</div>
                        <div style={{ color: "#7f6c97", fontSize: 10.5 }}>{charEmoji(row.charId)} {row.charId} · {row.wins} wins · W streak {row.streak}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: BG.green, fontWeight: 900, fontSize: 14 }}>Ladder {row.ladder}</div>
                        <div style={{ color: "#6f5f86", fontSize: 10 }}>L streak {row.lossStreak}/3</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "rgba(34,214,122,0.05)", border: "1px solid rgba(34,214,122,0.14)", borderRadius: 18, padding: 14 }}>
              <div style={{ color: BG.green, fontWeight: 900, marginBottom: 8 }}>How this mode works</div>
              <div style={{ color: "#8b7aa3", fontSize: 11.5, lineHeight: 1.6 }}>• Public = instant 2-player pairing<br/>• Private = code lobbies + rematches<br/>• Matches last 3 minutes<br/>• Multiplayer upgrades are temporary<br/>• *Leaderboard ranks up by wins*<br/>• *3 losses in a row drops your ladder by 1*<br/>• The coins spent to buy them are permanently deducted from your real balance</div>
            </div>
          </>
        )}

        {phase === "queue" && mode === "public" && (
          <div style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 24, padding: 22, textAlign: "center" }}>
            <div style={{ fontSize: 54, marginBottom: 12, animation: "charFloat 3s ease-in-out infinite" }}>⚔️</div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 21, marginBottom: 6 }}>Searching for opponent…</div>
            <div style={{ color: "#7d6a95", fontSize: 12, marginBottom: 16 }}>Public queue creates 2-player lobbies only.</div>
            <div style={{ color: BG.gold, fontWeight: 900, fontSize: 15, marginBottom: 14 }}>Players in queue: {queueCount}</div>
            <button onClick={() => void leaveQueue()} className="press-fx" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: BG.red, fontWeight: 900, borderRadius: 14, padding: "12px 20px" }}>Cancel</button>
          </div>
        )}

        {phase === "queue" && mode === "private" && (
          <div style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 24, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ color: "#93c5fd", fontWeight: 900, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>Private Lobby</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>Code {privateCode}</div>
              </div>
              <button onClick={() => { void cleanupPrivate(); setPhase("hub"); }} className="press-fx" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: BG.red, fontWeight: 900, borderRadius: 12, padding: "10px 12px" }}>Close</button>
            </div>
            <div style={{ color: "#7d6a95", fontSize: 12, marginBottom: 12 }}>Share this code with 1 friend. Once 2 people are inside, start the duel.</div>
            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              {privateMembers.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "10px 12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `radial-gradient(circle, rgba(${charGlow(m.charId)},0.22), rgba(6,0,15,0.95))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : m.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: 800 }}>{m.username}</div>
                    <div style={{ color: "#66557c", fontSize: 10.5 }}>MMR {m.mmr} · Win streak {m.streak}</div>
                  </div>
                </div>
              ))}
            </div>
            <button disabled={privateMembers.length < 2} onClick={() => void startPrivateMatch()} className="press-fx" style={{ width: "100%", background: privateMembers.length >= 2 ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: privateMembers.length >= 2 ? "#fff" : "#6b7280", fontWeight: 900, borderRadius: 16, padding: "14px 16px", fontSize: 15 }}>Start 1v1 Duel</button>
          </div>
        )}

        {phase === "pregame" && match && (
          <div style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 28, padding: 22, textAlign: "center" }}>
            <div style={{ color: match.mode === "public" ? BG.red : "#93c5fd", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10 }}>{match.mode === "public" ? (match.ranked ? "Ranked Match Found" : "Public Match Found") : `Private Lobby ${match.code}`}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", marginBottom: 18 }}>
              {[me, opponent].map((p, idx) => p ? <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 14 }}><div style={{ width: 72, height: 72, margin: "0 auto 10px", borderRadius: "50%", background: `radial-gradient(circle, rgba(${charGlow(p.charId)},0.22), rgba(6,0,15,0.95))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>{p.avatarUrl ? <img src={p.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : p.avatar}</div><div style={{ color: idx === 0 ? "#c084fc" : "#fff", fontWeight: 900 }}>{p.username}</div><div style={{ color: "#6f5e87", fontSize: 11 }}>{charEmoji(p.charId)} {p.charId}</div></div> : <div key={idx} />)}
              <div style={{ color: BG.gold, fontWeight: 900, fontSize: 22 }}>VS</div>
            </div>
            <div style={{ color: BG.green, fontWeight: 900, fontSize: 42, marginBottom: 8 }}>{Math.max(0, Math.ceil(matchCountdown / 1000))}</div>
            <div style={{ color: "#7b6a92", fontSize: 12 }}>3 minutes. Buy temporary upgrades with real coins. Highest score wins.</div>
          </div>
        )}

        {phase === "battle" && match && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", marginBottom: 10 }}>
              {[{ label: me.username || "You", score: myScore, taps: myTaps, self: true, charId: me.charId }, { label: opponent?.username || "Opponent", score: remote?.score || 0, taps: remote?.taps || 0, self: false, charId: opponent?.charId || "pepe" }].map((card, idx) => (
                <div key={idx} style={{ background: card.self ? "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(168,85,247,0.06))" : BG.glass, border: `1px solid ${card.self ? "rgba(168,85,247,0.32)" : BG.border}`, borderRadius: 18, padding: 12 }}>
                  <div style={{ color: card.self ? "#c084fc" : "#fff", fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{card.label}</div>
                  <div style={{ color: BG.gold, fontWeight: 900, fontSize: 22 }}>{formatNum(card.score)}</div>
                  <div style={{ color: "#716182", fontSize: 10.5 }}>{formatNum(card.taps)} taps · {charEmoji(card.charId)} {card.charId}</div>
                </div>
              ))}
              <div style={{ textAlign: "center" }}>
                <div style={{ color: BG.red, fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Time Left</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 26 }}>{formatClock(battleTick || battleLeft)}</div>
              </div>
            </div>

            <div style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 24, padding: 18, marginBottom: 12 }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <button onClick={tapNow} className="press-fx char-breathe" style={{ width: 210, height: 210, borderRadius: "50%", border: `2px solid rgba(${charGlow(charId || "pepe")},0.45)`, background: `radial-gradient(circle at 50% 30%, rgba(${charGlow(charId || "pepe")},0.18), rgba(6,0,15,0.96))`, color: "#fff", fontSize: 84, boxShadow: `0 0 40px rgba(${charGlow(charId || "pepe")},0.28)` }}>{avatar || charEmoji(charId || "pepe")}</button>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, marginTop: 12 }}>TAP TO DOMINATE</div>
                <div style={{ color: "#6f5f86", fontSize: 11.5 }}>Every tap stacks your battle score. Upgrades are match-only, but the coins spent are permanent.</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MP_UPGRADES.map((u) => {
                  const owned = myUpgrades[u.id] || 0;
                  const price = Math.floor(u.cost * Math.pow(1.65, owned));
                  const can = coins >= price;
                  return (
                    <button key={u.id} disabled={!can} onClick={() => void buyUpgrade(u.id)} className={can ? "press-fx" : ""} style={{ textAlign: "left", background: can ? `linear-gradient(135deg,rgba(168,85,247,0.14),rgba(168,85,247,0.05))` : "rgba(255,255,255,0.03)", border: `1px solid ${can ? "rgba(168,85,247,0.24)" : "rgba(255,255,255,0.06)"}`, borderRadius: 18, padding: 12, cursor: can ? "pointer" : "not-allowed", opacity: can ? 1 : 0.5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 5 }}>
                        <span style={{ color: "#fff", fontWeight: 900, fontSize: 12.5 }}>{u.emoji} {u.name}</span>
                        <span style={{ color: "#c084fc", fontWeight: 900, fontSize: 10.5 }}>Lv.{owned}</span>
                      </div>
                      <div style={{ color: "#76668d", fontSize: 10.5, minHeight: 28 }}>{u.desc}</div>
                      <div style={{ color: can ? BG.gold : "#62546f", fontWeight: 900, fontSize: 12, marginTop: 8 }}>💰 {formatNum(price)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Real Coins Left", value: formatNum(coins), color: BG.gold },
                { label: "Spent This Match", value: formatNum(mySpent), color: BG.red },
                { label: "Queue Type", value: match.mode === "public" ? (match.ranked ? "RANKED" : "PUBLIC") : "PRIVATE", color: match.mode === "public" ? BG.green : "#93c5fd" },
              ].map((s) => (
                <div key={s.label} style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 16, padding: 12, textAlign: "center" }}>
                  <div style={{ color: s.color, fontWeight: 900, fontSize: 14 }}>{s.value}</div>
                  <div style={{ color: "#6d5d83", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {phase === "result" && match && (
          <div style={{ background: BG.glass, border: `1px solid ${BG.border}`, borderRadius: 28, padding: 22 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{resolved === "win" ? "🏆" : resolved === "loss" ? "💀" : "🤝"}</div>
              <div style={{ color: resolved === "win" ? BG.green : resolved === "loss" ? BG.red : BG.gold, fontWeight: 900, fontSize: 28 }}>{resolved === "win" ? "Victory" : resolved === "loss" ? "Defeat" : "Draw"}</div>
              <div style={{ color: "#7b6c92", fontSize: 12, marginTop: 4 }}>{match.ranked ? "Ranked result locked in" : "Private match finished"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 18, padding: 14 }}>
                <div style={{ color: "#c084fc", fontWeight: 900, marginBottom: 6 }}>{me.username}</div>
                <div style={{ color: BG.gold, fontWeight: 900, fontSize: 22 }}>{formatNum(myScore)}</div>
                <div style={{ color: "#7f6f97", fontSize: 11 }}>{formatNum(myTaps)} taps · spent {formatNum(mySpent)}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 14 }}>
                <div style={{ color: "#fff", fontWeight: 900, marginBottom: 6 }}>{opponent?.username || "Opponent"}</div>
                <div style={{ color: BG.gold, fontWeight: 900, fontSize: 22 }}>{formatNum(remote?.score || 0)}</div>
                <div style={{ color: "#7f6f97", fontSize: 11 }}>{formatNum(remote?.taps || 0)} taps · spent {formatNum(remote?.spent || 0)}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ background: "rgba(34,214,122,0.05)", border: "1px solid rgba(34,214,122,0.14)", borderRadius: 16, padding: 12 }}>
                <div style={{ color: BG.green, fontWeight: 900, fontSize: 12 }}>Season Points</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{stats.seasonPoints}</div>
              </div>
              <div style={{ background: "rgba(245,200,66,0.05)", border: "1px solid rgba(245,200,66,0.14)", borderRadius: 16, padding: 12 }}>
                <div style={{ color: BG.gold, fontWeight: 900, fontSize: 12 }}>Current MMR</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{stats.mmr}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setRematchReady(true)} className="press-fx" style={{ background: rematchReady ? "rgba(34,214,122,0.16)" : "linear-gradient(135deg,#22c55e,#16a34a)", border: "1px solid rgba(34,214,122,0.35)", color: "#fff", fontWeight: 900, borderRadius: 16, padding: "14px 16px" }}>{rematchReady ? (oppRematchReady ? "Rematch loading…" : "Waiting for opponent…") : "Ready Rematch"}</button>
              <button onClick={async () => { await cleanupMatch(); if (match.mode === "private" && privateCode) { setPhase("queue"); } else { setPhase("hub"); } }} className="press-fx" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontWeight: 900, borderRadius: 16, padding: "14px 16px" }}>Leave Match</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
