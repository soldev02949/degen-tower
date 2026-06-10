"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import { ShoppingBag, Zap, Shield, Star, ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ShopItem } from "@/lib/supabase";

const CATEGORIES = [
  { id: "all", label: "All Items", icon: <ShoppingBag size={14} /> },
  { id: "gameplay", label: "Gameplay", icon: <Zap size={14} /> },
  { id: "powerups", label: "Power-Ups", icon: <Shield size={14} /> },
  { id: "cosmetics", label: "Cosmetics", icon: <Star size={14} /> },
  { id: "boosters", label: "Boosters", icon: <Star size={14} /> },
];

export default function ShopPage() {
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const { data } = await supabase
        .from("dt_shop_items")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      setItems((data as ShopItem[]) ?? []);
      setLoading(false);
    }
    fetchItems();
  }, []);

  const filtered = items.filter(i => category === "all" || i.category === category);
  const cartTotal = cart.reduce((sum, id) => {
    const item = items.find(i => i.id === id);
    return sum + (item?.price || 0);
  }, 0);

  const toggleCart = (id: string) => {
    if (purchased.includes(id)) return;
    setCart(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const checkout = () => {
    setPurchased(prev => [...prev, ...cart]);
    setCart([]);
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <StarField />
      <Navbar />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "100px 24px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em" }}>
            🛒 Shop
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 15 }}>
          Spend native tokens on power-ups, revives, and cosmetics.
        </p>

        {/* Token balance */}
        <div style={{
          background: "rgba(245,200,66,0.06)",
          border: "1px solid rgba(245,200,66,0.2)",
          borderRadius: 10,
          padding: "14px 20px",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>💰</span>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Balance</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: "var(--gold)" }}>— $TOWER</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Connect wallet to see balance
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Left: items */}
          <div style={{ flex: 1, minWidth: 300 }}>
            {/* Category tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {CATEGORIES.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: category === id ? "1.5px solid var(--gold)" : "1.5px solid var(--border)",
                    background: category === id ? "rgba(245,200,66,0.1)" : "transparent",
                    color: category === id ? "var(--gold)" : "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: category === id ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Items grid */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                <Loader2 size={28} style={{ animation: "spin-slow 1s linear infinite", margin: "0 auto 12px" }} />
                <div>Loading items...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                No items in this category yet.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {filtered.map(item => {
                  const inCart = cart.includes(item.id);
                  const isPurchased = purchased.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        cursor: isPurchased ? "default" : "pointer",
                        transition: "all 0.2s",
                        borderColor: inCart ? "var(--gold)" : isPurchased ? "var(--green)" : "var(--border)",
                        background: inCart ? "rgba(245,200,66,0.05)" : isPurchased ? "rgba(34,214,122,0.05)" : "var(--surface)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onClick={() => toggleCart(item.id)}
                      onMouseEnter={e => { if (!isPurchased) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"}
                    >
                      {item.tag && (
                        <div style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: item.tag_color ?? "var(--gold)",
                          color: "#0a0a0f",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          letterSpacing: "0.04em",
                        }}>
                          {item.tag}
                        </div>
                      )}
                      <div style={{ fontSize: 36, marginBottom: 10 }}>{item.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{item.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{item.description}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 800, color: "var(--gold)", fontSize: 16 }}>{item.price} <span style={{ fontSize: 12, fontWeight: 600 }}>$TOWER</span></span>
                        {isPurchased ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--green)", fontSize: 13, fontWeight: 600 }}>
                            <Check size={14} /> Owned
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: inCart ? "var(--gold)" : "var(--text-muted)" }}>
                            {inCart ? "✓ In Cart" : "+ Add"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: cart */}
          <div style={{ width: 240 }}>
            <div className="card" style={{ position: "sticky", top: 80 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingBag size={18} /> Cart {cart.length > 0 && `(${cart.length})`}
              </div>

              {cart.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  Click items to add to cart
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {cart.map(id => {
                    const item = items.find(i => i.id === id)!;
                    return (
                      <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span>{item.emoji.split("")[0]}</span>
                          <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        </span>
                        <span style={{ fontWeight: 700, color: "var(--gold)", whiteSpace: "nowrap" }}>{item.price}</span>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: "var(--gold)" }}>{cartTotal} $TOWER</span>
                  </div>
                </div>
              )}

              <button
                className="btn-primary"
                disabled={cart.length === 0}
                onClick={checkout}
                style={{ width: "100%", opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? "not-allowed" : "pointer" }}
              >
                Checkout
              </button>

              {purchased.length > 0 && (
                <div style={{ marginTop: 16, fontSize: 12, color: "var(--green)", textAlign: "center" }}>
                  ✓ {purchased.length} item{purchased.length > 1 ? "s" : ""} purchased
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Link href="/game">
            <button className="btn-secondary" style={{ fontSize: 14, padding: "11px 28px" }}>
              <Zap size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Back to Game
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
