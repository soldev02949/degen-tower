"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface SoundContextType {
  volume: number;
  muted: boolean;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  playTap: (isCrit?: boolean) => void;
  playComboMilestone: (level: number) => void;
  playLevelUp: () => void;
  playSpecial: () => void;
  playPurchase: () => void;
}

const SoundContext = createContext<SoundContextType>({
  volume: 0.4,
  muted: false,
  setVolume: () => {},
  toggleMute: () => {},
  playTap: () => {},
  playComboMilestone: () => {},
  playLevelUp: () => {},
  playSpecial: () => {},
  playPurchase: () => {},
});

function createAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === "undefined") return 0.4;
    const s = localStorage.getItem("degen_volume");
    return s !== null ? parseFloat(s) : 0.4;
  });
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("degen_muted") === "1";
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const volRef = useRef(volume);
  const mutedRef = useRef(muted);

  useEffect(() => { volRef.current = volume; }, [volume]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Init music element
  useEffect(() => {
    const music = new Audio("/game-music.mp3");
    music.loop = true;
    music.volume = muted ? 0 : volume * 0.6;
    musicRef.current = music;
    return () => { music.pause(); };
  }, []); // eslint-disable-line

  // Sync music volume whenever settings change
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = muted ? 0 : volume * 0.6;
    }
  }, [volume, muted]);

  // Expose music start — called by game on first interaction
  useEffect(() => {
    const start = () => {
      if (musicRef.current && musicRef.current.paused) {
        musicRef.current.play().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", start, { once: true });
    return () => window.removeEventListener("pointerdown", start);
  }, []);

  function getCtx(): AudioContext | null {
    if (!ctxRef.current) ctxRef.current = createAudioCtx();
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }

  function tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    gainPeak: number,
    freqEnd?: number,
  ) {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd !== undefined)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    gain.gain.setValueAtTime(gainPeak * volRef.current, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  const playTap = useCallback((isCrit = false) => {
    if (isCrit) {
      tone(880, "square", 0.08, 0.15, 1200);
    } else {
      tone(200 + Math.random() * 80, "triangle", 0.05, 0.08);
    }
  }, []);

  const playComboMilestone = useCallback((level: number) => {
    const freqs = [523, 659, 784, 1047];
    const ctx = getCtx();
    if (!ctx || mutedRef.current) return;
    const v = volRef.current * 0.3;
    freqs.slice(0, Math.min(level, 4)).forEach((f, i) => {
      setTimeout(() => tone(f, "sine", 0.18, v), i * 80);
    });
  }, []);

  const playLevelUp = useCallback(() => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => tone(f, "sine", 0.25, 0.2 * volRef.current), i * 100)
    );
  }, []);

  const playSpecial = useCallback(() => {
    tone(200, "sawtooth", 0.3, 0.25, 800);
  }, []);

  const playPurchase = useCallback(() => {
    tone(440, "sine", 0.12, 0.15);
    setTimeout(() => tone(660, "sine", 0.12, 0.12), 80);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem("degen_volume", String(clamped));
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem("degen_muted", next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <SoundContext.Provider
      value={{ volume, muted, setVolume, toggleMute, playTap, playComboMilestone, playLevelUp, playSpecial, playPurchase }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
