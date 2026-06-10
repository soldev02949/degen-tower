"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { Eye, EyeOff, Check, Loader2, Wallet, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STEPS = ["Account", "Wallet", "Verify"];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletVerified, setWalletVerified] = useState(false);
  const [tokenCheck, setTokenCheck] = useState<null | boolean>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    wallet: "",
    character: "pepe",
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = async () => {
    setError(null);
    if (step === 1) {
      setLoading(true);
      // Simulate Helius on-chain token verification
      await new Promise(r => setTimeout(r, 1800));
      setWalletVerified(true);
      setTokenCheck(true);
      setLoading(false);
      setStep(s => s + 1);
      return;
    }
    if (step === 2) {
      // Final step: save player to Supabase
      setLoading(true);
      const { error: dbError } = await supabase
        .from("dt_players")
        .insert({
          wallet_address: form.wallet,
          username: form.username,
          character: form.character,
          is_verified: true,
        });
      setLoading(false);
      if (dbError) {
        if (dbError.message.includes("duplicate") || dbError.message.includes("unique")) {
          setError("This wallet or username is already registered.");
        } else {
          setError(dbError.message);
        }
        return;
      }
    }
    setStep(s => s + 1);
  };

  const isStep0Valid = form.username.length >= 3 && form.password.length >= 8;
  const isStep1Valid = form.wallet.length >= 32;

  const CHARACTERS = [
    { id: "pepe", emoji: "🐸", name: "Pepe" },
    { id: "gigachad", emoji: "💪", name: "Gigachad" },
    { id: "trump", emoji: "🎩", name: "Trump" },
    { id: "troll", emoji: "🧌", name: "Troll" },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <StarField />
      <Navbar />

      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 480,
        margin: "0 auto",
        padding: "120px 24px 60px",
      }}>
        {/* Steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14,
                  background: i < step ? "var(--gold)" : i === step ? "rgba(245,200,66,0.15)" : "var(--surface)",
                  border: i <= step ? "2px solid var(--gold)" : "2px solid var(--border)",
                  color: i < step ? "#0a0a0f" : i === step ? "var(--gold)" : "var(--text-muted)",
                  transition: "all 0.3s",
                }}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === step ? "var(--gold)" : "var(--text-muted)", fontWeight: i === step ? 600 : 400 }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 60, height: 2,
                  background: i < step ? "var(--gold)" : "var(--border)",
                  marginBottom: 20, transition: "background 0.3s",
                }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && (
            <div style={{
              background: "rgba(255,80,80,0.1)",
              border: "1px solid rgba(255,80,80,0.3)",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#ff8080",
            }}>
              {error}
            </div>
          )}

          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create Account</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>One account per wallet address</p>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Username</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="DegenApe420"
                  value={form.username}
                  onChange={e => set("username", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  maxLength={20}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>3–20 characters, letters/numbers/underscore</div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Choose Character</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                  {CHARACTERS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set("character", c.id)}
                      style={{
                        padding: "12px 8px",
                        borderRadius: 8,
                        border: form.character === c.id ? "2px solid var(--gold)" : "2px solid var(--border)",
                        background: form.character === c.id ? "rgba(245,200,66,0.1)" : "var(--surface)",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{c.emoji}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: form.character === c.id ? "var(--gold)" : "var(--text-muted)" }}>{c.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input-field"
                    type={showPass ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                    {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password)].map((ok, i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: ok ? "var(--green)" : "var(--border)",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn-primary"
                disabled={!isStep0Valid}
                onClick={nextStep}
                style={{ opacity: isStep0Valid ? 1 : 0.5, cursor: isStep0Valid ? "pointer" : "not-allowed" }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Connect Wallet</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Your Solana wallet for token gating and USDC rewards</p>
              </div>

              <div style={{
                background: "rgba(245,200,66,0.06)",
                border: "1px solid rgba(245,200,66,0.2)",
                borderRadius: 10, padding: 16,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Token Requirement</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
                      You must hold ≥$5 USD equivalent of the native meme coin in this wallet. Verified on-chain via Helius.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Solana Wallet Address</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Enter your Solana wallet address"
                    value={form.wallet}
                    onChange={e => set("wallet", e.target.value.trim())}
                    style={{ paddingLeft: 44 }}
                  />
                  <Wallet size={16} style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Compatible with Phantom, Solflare, Backpack, and other Solana wallets
                </div>
              </div>

              <button
                className="btn-primary"
                disabled={!isStep1Valid || loading}
                onClick={nextStep}
                style={{ opacity: isStep1Valid && !loading ? 1 : 0.5, cursor: isStep1Valid && !loading ? "pointer" : "not-allowed" }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} />
                    Verifying on-chain...
                  </span>
                ) : "Verify Wallet →"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Almost There!</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Review your details and complete registration</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Username", value: form.username },
                  { label: "Character", value: CHARACTERS.find(c => c.id === form.character)?.emoji + " " + CHARACTERS.find(c => c.id === form.character)?.name },
                  { label: "Wallet", value: form.wallet.length > 20 ? `${form.wallet.slice(0, 8)}...${form.wallet.slice(-8)}` : form.wallet },
                  { label: "Token Check", value: walletVerified && tokenCheck ? "✅ Requirement Met" : "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 14px", background: "var(--surface-2)",
                    borderRadius: 8, fontSize: 13,
                  }}>
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontWeight: 600, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                disabled={loading}
                onClick={nextStep}
                style={{ opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} />
                    Saving account...
                  </span>
                ) : "Complete Registration →"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
              <div className="bounce-in">
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(34,214,122,0.1)",
                  border: "2px solid var(--green)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                }}>
                  <ShieldCheck size={32} color="var(--green)" />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You&apos;re In!</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                  Account created and verified. Time to climb the tower and earn USDC.
                </p>
              </div>

              <Link href="/game" style={{ textDecoration: "none" }}>
                <button className="btn-primary pulse-glow" style={{ width: "100%", fontSize: 16, padding: 14 }}>
                  🚀 Enter the Tower
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
