"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { Eye, EyeOff, Check, Loader2, Wallet, ShieldCheck } from "lucide-react";

const STEPS = ["Account", "Wallet", "Verify"];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletVerified, setWalletVerified] = useState(false);
  const [tokenCheck, setTokenCheck] = useState<null | boolean>(null);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    wallet: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = async () => {
    if (step === 1) {
      setLoading(true);
      // Simulate wallet verification + token check
      await new Promise(r => setTimeout(r, 1800));
      setWalletVerified(true);
      setTokenCheck(true);
      setLoading(false);
    }
    setStep(s => s + 1);
  };

  const isStep0Valid = form.email && form.username.length >= 3 && form.password.length >= 8;
  const isStep1Valid = form.wallet.length >= 32;

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
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  background: i < step ? "var(--gold)" : i === step ? "rgba(245,200,66,0.15)" : "var(--surface)",
                  border: i <= step ? "2px solid var(--gold)" : "2px solid var(--border)",
                  color: i < step ? "#0a0a0f" : i === step ? "var(--gold)" : "var(--text-muted)",
                  transition: "all 0.3s",
                }}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span style={{
                  fontSize: 11,
                  color: i === step ? "var(--gold)" : "var(--text-muted)",
                  fontWeight: i === step ? 600 : 400,
                }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 60,
                  height: 2,
                  background: i < step ? "var(--gold)" : "var(--border)",
                  marginBottom: 20,
                  transition: "background 0.3s",
                }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 32 }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create Account</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>One account per IP address</p>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="degen@solana.com"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                />
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
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength */}
                {form.password && (
                  <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                    {[
                      form.password.length >= 8,
                      /[A-Z]/.test(form.password),
                      /[0-9]/.test(form.password),
                    ].map((ok, i) => (
                      <div key={i} style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
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

              <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <Link href="/game" style={{ color: "var(--gold)", textDecoration: "none" }}>Sign in</Link>
              </p>
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
                borderRadius: 10,
                padding: 16,
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
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
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
            <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
              <div className="bounce-in">
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(34,214,122,0.1)",
                  border: "2px solid var(--green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}>
                  <ShieldCheck size={32} color="var(--green)" />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You&apos;re Verified!</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                  Wallet verified and token requirement met. Your account is ready.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                {[
                  { label: "Email", value: form.email },
                  { label: "Username", value: form.username },
                  { label: "Wallet", value: form.wallet.length > 20 ? `${form.wallet.slice(0, 8)}...${form.wallet.slice(-8)}` : form.wallet },
                  { label: "Token Balance", value: walletVerified && tokenCheck ? "✅ Requirement Met" : "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--surface-2)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}>
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontWeight: 600, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
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
