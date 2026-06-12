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
  { id: "tap_1", emoji: "⚡", name: "Spark Plug", desc: "+0.8 tap power", cost: 462, type: "tap", value: 0.8, category: "strikers" },
  { id: "tap_2", emoji: "⚡", name: "Pulse Knuckle", desc: "+1.2 tap power", cost: 889, type: "tap", value: 1.2, category: "strikers" },
  { id: "tap_3", emoji: "⚡", name: "Shock Baton", desc: "+1.8 tap power", cost: 1709, type: "tap", value: 1.8, category: "strikers" },
  { id: "tap_4", emoji: "⚡", name: "Arc Hammer", desc: "+2.5 tap power", cost: 3279, type: "tap", value: 2.5, category: "strikers" },
  { id: "tap_5", emoji: "⚡", name: "Volt Injector", desc: "+3.5 tap power", cost: 6284, type: "tap", value: 3.5, category: "strikers" },
  { id: "tap_6", emoji: "⚡", name: "Thunder Claw", desc: "+5 tap power", cost: 12026, type: "tap", value: 5, category: "strikers" },
  { id: "tap_7", emoji: "⚡", name: "Storm Driver", desc: "+7 tap power", cost: 22991, type: "tap", value: 7, category: "strikers" },
  { id: "tap_8", emoji: "⚡", name: "Overload Edge", desc: "+10 tap power", cost: 43905, type: "tap", value: 10, category: "strikers" },
  { id: "tap_9", emoji: "⚡", name: "Nova Fist", desc: "+14 tap power", cost: 83764, type: "tap", value: 14, category: "strikers" },
  { id: "tap_10", emoji: "⚡", name: "Singularity Palm", desc: "+20 tap power", cost: 159660, type: "tap", value: 20, category: "strikers" },
  { id: "mult_1", emoji: "✖️", name: "Combo Sigil", desc: "+12% score multiplier", cost: 647, type: "mult", value: 0.12, category: "relics" },
  { id: "mult_2", emoji: "✖️", name: "Mirror Crest", desc: "+16% score multiplier", cost: 1232, type: "mult", value: 0.16, category: "relics" },
  { id: "mult_3", emoji: "✖️", name: "Golden Relay", desc: "+20% score multiplier", cost: 2342, type: "mult", value: 0.2, category: "relics" },
  { id: "mult_4", emoji: "✖️", name: "Pressure Loop", desc: "+24% score multiplier", cost: 4451, type: "mult", value: 0.24, category: "relics" },
  { id: "mult_5", emoji: "✖️", name: "King Rune", desc: "+30% score multiplier", cost: 8451, type: "mult", value: 0.3, category: "relics" },
  { id: "mult_6", emoji: "✖️", name: "Chain Matrix", desc: "+36% score multiplier", cost: 16035, type: "mult", value: 0.36, category: "relics" },
  { id: "mult_7", emoji: "✖️", name: "Crown Prism", desc: "+44% score multiplier", cost: 30407, type: "mult", value: 0.44, category: "relics" },
  { id: "mult_8", emoji: "✖️", name: "Warlord Mark", desc: "+54% score multiplier", cost: 57626, type: "mult", value: 0.54, category: "relics" },
  { id: "mult_9", emoji: "✖️", name: "Titan Emblem", desc: "+66% score multiplier", cost: 109147, type: "mult", value: 0.66, category: "relics" },
  { id: "mult_10", emoji: "✖️", name: "Apex Seal", desc: "+80% score multiplier", cost: 206618, type: "mult", value: 0.8, category: "relics" },
  { id: "auto_1", emoji: "🤖", name: "Tap Drone", desc: "+0.5 auto taps/sec", cost: 832, type: "auto", value: 0.5, category: "bots" },
  { id: "auto_2", emoji: "🤖", name: "Gear Bot", desc: "+0.8 auto taps/sec", cost: 1574, type: "auto", value: 0.8, category: "bots" },
  { id: "auto_3", emoji: "🤖", name: "Assist Walker", desc: "+1.2 auto taps/sec", cost: 2975, type: "auto", value: 1.2, category: "bots" },
  { id: "auto_4", emoji: "🤖", name: "Micro Miner", desc: "+1.6 auto taps/sec", cost: 5622, type: "auto", value: 1.6, category: "bots" },
  { id: "auto_5", emoji: "🤖", name: "Lane Sweeper", desc: "+2.2 auto taps/sec", cost: 10618, type: "auto", value: 2.2, category: "bots" },
  { id: "auto_6", emoji: "🤖", name: "Tap Turret", desc: "+3 auto taps/sec", cost: 20044, type: "auto", value: 3.0, category: "bots" },
  { id: "auto_7", emoji: "🤖", name: "Signal Swarm", desc: "+4 auto taps/sec", cost: 37824, type: "auto", value: 4.0, category: "bots" },
  { id: "auto_8", emoji: "🤖", name: "Mech Choir", desc: "+5.5 auto taps/sec", cost: 71347, type: "auto", value: 5.5, category: "bots" },
  { id: "auto_9", emoji: "🤖", name: "Forge Hive", desc: "+7.5 auto taps/sec", cost: 134530, type: "auto", value: 7.5, category: "bots" },
  { id: "auto_10", emoji: "🤖", name: "Omega Factory", desc: "+10 auto taps/sec", cost: 253577, type: "auto", value: 10.0, category: "bots" },
  { id: "crit_1", emoji: "💥", name: "Sharp Lens", desc: "+4% crit chance", cost: 1017, type: "crit", value: 0.04, category: "aimers" },
  { id: "crit_2", emoji: "💥", name: "Red Dot", desc: "+5% crit chance", cost: 1916, type: "crit", value: 0.05, category: "aimers" },
  { id: "crit_3", emoji: "💥", name: "Prism Scope", desc: "+6% crit chance", cost: 3609, type: "crit", value: 0.06, category: "aimers" },
  { id: "crit_4", emoji: "💥", name: "Hunter Glass", desc: "+7% crit chance", cost: 6793, type: "crit", value: 0.07, category: "aimers" },
  { id: "crit_5", emoji: "💥", name: "Oracle Eye", desc: "+8% crit chance", cost: 12785, type: "crit", value: 0.08, category: "aimers" },
  { id: "crit_6", emoji: "💥", name: "Sniper Halo", desc: "+9% crit chance", cost: 24053, type: "crit", value: 0.09, category: "aimers" },
  { id: "crit_7", emoji: "💥", name: "Rift Targeter", desc: "+10% crit chance", cost: 45240, type: "crit", value: 0.1, category: "aimers" },
  { id: "crit_8", emoji: "💥", name: "War Seer", desc: "+12% crit chance", cost: 85067, type: "crit", value: 0.12, category: "aimers" },
  { id: "crit_9", emoji: "💥", name: "Rage Sight", desc: "+14% crit chance", cost: 159913, type: "crit", value: 0.14, category: "aimers" },
  { id: "crit_10", emoji: "💥", name: "Doom Focus", desc: "+16% crit chance", cost: 300536, type: "crit", value: 0.16, category: "aimers" },
  { id: "frenzy_1", emoji: "🔥", name: "Rage Tonic", desc: "+18% tap value", cost: 1202, type: "frenzy", value: 0.18, category: "potions" },
  { id: "frenzy_2", emoji: "🔥", name: "Heat Serum", desc: "+22% tap value", cost: 2258, type: "frenzy", value: 0.22, category: "potions" },
  { id: "frenzy_3", emoji: "🔥", name: "Blaze Phial", desc: "+28% tap value", cost: 4242, type: "frenzy", value: 0.28, category: "potions" },
  { id: "frenzy_4", emoji: "🔥", name: "Turbo Flask", desc: "+34% tap value", cost: 7965, type: "frenzy", value: 0.34, category: "potions" },
  { id: "frenzy_5", emoji: "🔥", name: "Fury Draft", desc: "+42% tap value", cost: 14952, type: "frenzy", value: 0.42, category: "potions" },
  { id: "frenzy_6", emoji: "🔥", name: "Overdrive Mix", desc: "+50% tap value", cost: 28062, type: "frenzy", value: 0.5, category: "potions" },
  { id: "frenzy_7", emoji: "🔥", name: "Berserk Bottle", desc: "+60% tap value", cost: 52657, type: "frenzy", value: 0.6, category: "potions" },
  { id: "frenzy_8", emoji: "🔥", name: "Chaos Tincture", desc: "+72% tap value", cost: 98788, type: "frenzy", value: 0.72, category: "potions" },
  { id: "frenzy_9", emoji: "🔥", name: "Inferno Vial", desc: "+86% tap value", cost: 185297, type: "frenzy", value: 0.86, category: "potions" },
  { id: "frenzy_10", emoji: "🔥", name: "Cataclysm Brew", desc: "+100% tap value", cost: 347495, type: "frenzy", value: 1.0, category: "potions" },
  { id: "tap_11", emoji: "⚡", name: "Artifacts Mk.11", desc: "+4.71 tap power", cost: 91187, type: "tap", value: 4.71, category: "artifacts" },
  { id: "tap_12", emoji: "⚡", name: "Artifacts Mk.12", desc: "+5.558 tap power", cost: 142552, type: "tap", value: 5.558, category: "artifacts" },
  { id: "tap_13", emoji: "⚡", name: "Artifacts Mk.13", desc: "+6.559 tap power", cost: 222833, type: "tap", value: 6.559, category: "artifacts" },
  { id: "tap_14", emoji: "⚡", name: "Artifacts Mk.14", desc: "+7.739 tap power", cost: 348303, type: "tap", value: 7.739, category: "artifacts" },
  { id: "tap_15", emoji: "⚡", name: "Artifacts Mk.15", desc: "+9.133 tap power", cost: 544381, type: "tap", value: 9.133, category: "artifacts" },
  { id: "tap_16", emoji: "⚡", name: "Artifacts Mk.16", desc: "+10.776 tap power", cost: 850784, type: "tap", value: 10.776, category: "artifacts" },
  { id: "tap_17", emoji: "⚡", name: "Artifacts Mk.17", desc: "+12.716 tap power", cost: 1329554, type: "tap", value: 12.716, category: "artifacts" },
  { id: "tap_18", emoji: "⚡", name: "Artifacts Mk.18", desc: "+15.005 tap power", cost: 2077608, type: "tap", value: 15.005, category: "artifacts" },
  { id: "tap_19", emoji: "⚡", name: "Artifacts Mk.19", desc: "+17.706 tap power", cost: 3246333, type: "tap", value: 17.706, category: "artifacts" },
  { id: "tap_20", emoji: "⚡", name: "Artifacts Mk.20", desc: "+20.893 tap power", cost: 5072179, type: "tap", value: 20.893, category: "artifacts" },
  { id: "tap_21", emoji: "⚡", name: "Artifacts Mk.21", desc: "+24.654 tap power", cost: 7924439, type: "tap", value: 24.654, category: "artifacts" },
  { id: "tap_22", emoji: "⚡", name: "Artifacts Mk.22", desc: "+29.091 tap power", cost: 12379851, type: "tap", value: 29.091, category: "artifacts" },
  { id: "tap_23", emoji: "⚡", name: "Artifacts Mk.23", desc: "+34.328 tap power", cost: 19339073, type: "tap", value: 34.328, category: "artifacts" },
  { id: "tap_24", emoji: "⚡", name: "Artifacts Mk.24", desc: "+40.507 tap power", cost: 30208534, type: "tap", value: 40.507, category: "artifacts" },
  { id: "tap_25", emoji: "⚡", name: "Artifacts Mk.25", desc: "+47.798 tap power", cost: 47184332, type: "tap", value: 47.798, category: "artifacts" },
  { id: "tap_26", emoji: "⚡", name: "Artifacts Mk.26", desc: "+56.402 tap power", cost: 73695427, type: "tap", value: 56.402, category: "artifacts" },
  { id: "tap_27", emoji: "⚡", name: "Artifacts Mk.27", desc: "+66.554 tap power", cost: 115095466, type: "tap", value: 66.554, category: "artifacts" },
  { id: "tap_28", emoji: "⚡", name: "Artifacts Mk.28", desc: "+78.534 tap power", cost: 179742681, type: "tap", value: 78.534, category: "artifacts" },
  { id: "tap_29", emoji: "⚡", name: "Artifacts Mk.29", desc: "+92.67 tap power", cost: 280685454, type: "tap", value: 92.67, category: "artifacts" },
  { id: "tap_30", emoji: "⚡", name: "Artifacts Mk.30", desc: "+109.35 tap power", cost: 438293115, type: "tap", value: 109.35, category: "artifacts" },
  { id: "tap_31", emoji: "⚡", name: "Artifacts Mk.31", desc: "+129.034 tap power", cost: 684361854, type: "tap", value: 129.034, category: "artifacts" },
  { id: "tap_32", emoji: "⚡", name: "Artifacts Mk.32", desc: "+152.26 tap power", cost: 1068522539, type: "tap", value: 152.26, category: "artifacts" },
  { id: "tap_33", emoji: "⚡", name: "Artifacts Mk.33", desc: "+179.666 tap power", cost: 1668240517, type: "tap", value: 179.666, category: "artifacts" },
  { id: "tap_34", emoji: "⚡", name: "Artifacts Mk.34", desc: "+212.006 tap power", cost: 2604420202, type: "tap", value: 212.006, category: "artifacts" },
  { id: "mult_11", emoji: "✖️", name: "Glyphs Mk.11", desc: "+18% score multiplier", cost: 109946, type: "mult", value: 0.183, category: "glyphs" },
  { id: "mult_12", emoji: "✖️", name: "Glyphs Mk.12", desc: "+21% score multiplier", cost: 171628, type: "mult", value: 0.216, category: "glyphs" },
  { id: "mult_13", emoji: "✖️", name: "Glyphs Mk.13", desc: "+25% score multiplier", cost: 267901, type: "mult", value: 0.255, category: "glyphs" },
  { id: "mult_14", emoji: "✖️", name: "Glyphs Mk.14", desc: "+30% score multiplier", cost: 418157, type: "mult", value: 0.301, category: "glyphs" },
  { id: "mult_15", emoji: "✖️", name: "Glyphs Mk.15", desc: "+35% score multiplier", cost: 652656, type: "mult", value: 0.355, category: "glyphs" },
  { id: "mult_16", emoji: "✖️", name: "Glyphs Mk.16", desc: "+41% score multiplier", cost: 1018609, type: "mult", value: 0.419, category: "glyphs" },
  { id: "mult_17", emoji: "✖️", name: "Glyphs Mk.17", desc: "+49% score multiplier", cost: 1589684, type: "mult", value: 0.495, category: "glyphs" },
  { id: "mult_18", emoji: "✖️", name: "Glyphs Mk.18", desc: "+58% score multiplier", cost: 2480810, type: "mult", value: 0.584, category: "glyphs" },
  { id: "mult_19", emoji: "✖️", name: "Glyphs Mk.19", desc: "+68% score multiplier", cost: 3871296, type: "mult", value: 0.689, category: "glyphs" },
  { id: "mult_20", emoji: "✖️", name: "Glyphs Mk.20", desc: "+81% score multiplier", cost: 6040871, type: "mult", value: 0.813, category: "glyphs" },
  { id: "mult_21", emoji: "✖️", name: "Glyphs Mk.21", desc: "+95% score multiplier", cost: 9425912, type: "mult", value: 0.959, category: "glyphs" },
  { id: "mult_22", emoji: "✖️", name: "Glyphs Mk.22", desc: "+113% score multiplier", cost: 14707134, type: "mult", value: 1.131, category: "glyphs" },
  { id: "mult_23", emoji: "✖️", name: "Glyphs Mk.23", desc: "+133% score multiplier", cost: 22946361, type: "mult", value: 1.335, category: "glyphs" },
  { id: "mult_24", emoji: "✖️", name: "Glyphs Mk.24", desc: "+157% score multiplier", cost: 35799830, type: "mult", value: 1.575, category: "glyphs" },
  { id: "mult_25", emoji: "✖️", name: "Glyphs Mk.25", desc: "+185% score multiplier", cost: 55850842, type: "mult", value: 1.859, category: "glyphs" },
  { id: "mult_26", emoji: "✖️", name: "Glyphs Mk.26", desc: "+219% score multiplier", cost: 87128518, type: "mult", value: 2.193, category: "glyphs" },
  { id: "mult_27", emoji: "✖️", name: "Glyphs Mk.27", desc: "+258% score multiplier", cost: 135916756, type: "mult", value: 2.588, category: "glyphs" },
  { id: "mult_28", emoji: "✖️", name: "Glyphs Mk.28", desc: "+305% score multiplier", cost: 212015681, type: "mult", value: 3.054, category: "glyphs" },
  { id: "mult_29", emoji: "✖️", name: "Glyphs Mk.29", desc: "+360% score multiplier", cost: 330708604, type: "mult", value: 3.604, category: "glyphs" },
  { id: "mult_30", emoji: "✖️", name: "Glyphs Mk.30", desc: "+425% score multiplier", cost: 515828998, type: "mult", value: 4.253, category: "glyphs" },
  { id: "mult_31", emoji: "✖️", name: "Glyphs Mk.31", desc: "+501% score multiplier", cost: 804542473, type: "mult", value: 5.018, category: "glyphs" },
  { id: "mult_32", emoji: "✖️", name: "Glyphs Mk.32", desc: "+592% score multiplier", cost: 1254802498, type: "mult", value: 5.921, category: "glyphs" },
  { id: "mult_33", emoji: "✖️", name: "Glyphs Mk.33", desc: "+698% score multiplier", cost: 1956974453, type: "mult", value: 6.987, category: "glyphs" },
  { id: "mult_34", emoji: "✖️", name: "Glyphs Mk.34", desc: "+824% score multiplier", cost: 3051957802, type: "mult", value: 8.245, category: "glyphs" },
  { id: "auto_11", emoji: "🤖", name: "Machines Mk.11", desc: "+2.355 auto taps/sec", cost: 128704, type: "auto", value: 2.355, category: "machines" },
  { id: "auto_12", emoji: "🤖", name: "Machines Mk.12", desc: "+2.779 auto taps/sec", cost: 200704, type: "auto", value: 2.779, category: "machines" },
  { id: "auto_13", emoji: "🤖", name: "Machines Mk.13", desc: "+3.279 auto taps/sec", cost: 312969, type: "auto", value: 3.279, category: "machines" },
  { id: "auto_14", emoji: "🤖", name: "Machines Mk.14", desc: "+3.87 auto taps/sec", cost: 488012, type: "auto", value: 3.87, category: "machines" },
  { id: "auto_15", emoji: "🤖", name: "Machines Mk.15", desc: "+4.566 auto taps/sec", cost: 760931, type: "auto", value: 4.566, category: "machines" },
  { id: "auto_16", emoji: "🤖", name: "Machines Mk.16", desc: "+5.388 auto taps/sec", cost: 1186435, type: "auto", value: 5.388, category: "machines" },
  { id: "auto_17", emoji: "🤖", name: "Machines Mk.17", desc: "+6.358 auto taps/sec", cost: 1849814, type: "auto", value: 6.358, category: "machines" },
  { id: "auto_18", emoji: "🤖", name: "Machines Mk.18", desc: "+7.503 auto taps/sec", cost: 2884012, type: "auto", value: 7.503, category: "machines" },
  { id: "auto_19", emoji: "🤖", name: "Machines Mk.19", desc: "+8.853 auto taps/sec", cost: 4496258, type: "auto", value: 8.853, category: "machines" },
  { id: "auto_20", emoji: "🤖", name: "Machines Mk.20", desc: "+10.446 auto taps/sec", cost: 7009563, type: "auto", value: 10.446, category: "machines" },
  { id: "auto_21", emoji: "🤖", name: "Machines Mk.21", desc: "+12.327 auto taps/sec", cost: 10927384, type: "auto", value: 12.327, category: "machines" },
  { id: "auto_22", emoji: "🤖", name: "Machines Mk.22", desc: "+14.546 auto taps/sec", cost: 17034416, type: "auto", value: 14.546, category: "machines" },
  { id: "auto_23", emoji: "🤖", name: "Machines Mk.23", desc: "+17.164 auto taps/sec", cost: 26553649, type: "auto", value: 17.164, category: "machines" },
  { id: "auto_24", emoji: "🤖", name: "Machines Mk.24", desc: "+20.253 auto taps/sec", cost: 41391127, type: "auto", value: 20.253, category: "machines" },
  { id: "auto_25", emoji: "🤖", name: "Machines Mk.25", desc: "+23.899 auto taps/sec", cost: 64517352, type: "auto", value: 23.899, category: "machines" },
  { id: "auto_26", emoji: "🤖", name: "Machines Mk.26", desc: "+28.201 auto taps/sec", cost: 100561608, type: "auto", value: 28.201, category: "machines" },
  { id: "auto_27", emoji: "🤖", name: "Machines Mk.27", desc: "+33.277 auto taps/sec", cost: 156738047, type: "auto", value: 33.277, category: "machines" },
  { id: "auto_28", emoji: "🤖", name: "Machines Mk.28", desc: "+39.267 auto taps/sec", cost: 244288681, type: "auto", value: 39.267, category: "machines" },
  { id: "auto_29", emoji: "🤖", name: "Machines Mk.29", desc: "+46.335 auto taps/sec", cost: 380731754, type: "auto", value: 46.335, category: "machines" },
  { id: "auto_30", emoji: "🤖", name: "Machines Mk.30", desc: "+54.675 auto taps/sec", cost: 593364881, type: "auto", value: 54.675, category: "machines" },
  { id: "auto_31", emoji: "🤖", name: "Machines Mk.31", desc: "+64.517 auto taps/sec", cost: 924723091, type: "auto", value: 64.517, category: "machines" },
  { id: "auto_32", emoji: "🤖", name: "Machines Mk.32", desc: "+76.13 auto taps/sec", cost: 1441082457, type: "auto", value: 76.13, category: "machines" },
  { id: "auto_33", emoji: "🤖", name: "Machines Mk.33", desc: "+89.833 auto taps/sec", cost: 2245708389, type: "auto", value: 89.833, category: "machines" },
  { id: "auto_34", emoji: "🤖", name: "Machines Mk.34", desc: "+106.003 auto taps/sec", cost: 3499495403, type: "auto", value: 106.003, category: "machines" },
  { id: "crit_11", emoji: "💥", name: "Scopes Mk.11", desc: "+6% crit chance", cost: 147463, type: "crit", value: 0.063, category: "scopes" },
  { id: "crit_12", emoji: "💥", name: "Scopes Mk.12", desc: "+7% crit chance", cost: 229779, type: "crit", value: 0.074, category: "scopes" },
  { id: "crit_13", emoji: "💥", name: "Scopes Mk.13", desc: "+8% crit chance", cost: 358036, type: "crit", value: 0.087, category: "scopes" },
  { id: "crit_14", emoji: "💥", name: "Scopes Mk.14", desc: "+10% crit chance", cost: 557867, type: "crit", value: 0.103, category: "scopes" },
  { id: "crit_15", emoji: "💥", name: "Scopes Mk.15", desc: "+12% crit chance", cost: 869205, type: "crit", value: 0.122, category: "scopes" },
  { id: "crit_16", emoji: "💥", name: "Scopes Mk.16", desc: "+14% crit chance", cost: 1354261, type: "crit", value: 0.144, category: "scopes" },
  { id: "crit_17", emoji: "💥", name: "Scopes Mk.17", desc: "+17% crit chance", cost: 2109944, type: "crit", value: 0.17, category: "scopes" },
  { id: "crit_18", emoji: "💥", name: "Scopes Mk.18", desc: "+20% crit chance", cost: 3287213, type: "crit", value: 0.2, category: "scopes" },
  { id: "crit_19", emoji: "💥", name: "Scopes Mk.19", desc: "+23% crit chance", cost: 5121221, type: "crit", value: 0.236, category: "scopes" },
  { id: "crit_20", emoji: "💥", name: "Scopes Mk.20", desc: "+27% crit chance", cost: 7978255, type: "crit", value: 0.279, category: "scopes" },
  { id: "crit_21", emoji: "💥", name: "Scopes Mk.21", desc: "+32% crit chance", cost: 12428857, type: "crit", value: 0.329, category: "scopes" },
  { id: "crit_22", emoji: "💥", name: "Scopes Mk.22", desc: "+38% crit chance", cost: 19361699, type: "crit", value: 0.388, category: "scopes" },
  { id: "crit_23", emoji: "💥", name: "Scopes Mk.23", desc: "+45% crit chance", cost: 30160938, type: "crit", value: 0.458, category: "scopes" },
  { id: "crit_24", emoji: "💥", name: "Scopes Mk.24", desc: "+54% crit chance", cost: 46982424, type: "crit", value: 0.54, category: "scopes" },
  { id: "crit_25", emoji: "💥", name: "Scopes Mk.25", desc: "+63% crit chance", cost: 73183862, type: "crit", value: 0.637, category: "scopes" },
  { id: "crit_26", emoji: "💥", name: "Scopes Mk.26", desc: "+75% crit chance", cost: 113994699, type: "crit", value: 0.752, category: "scopes" },
  { id: "crit_27", emoji: "💥", name: "Scopes Mk.27", desc: "+88% crit chance", cost: 177559337, type: "crit", value: 0.887, category: "scopes" },
  { id: "crit_28", emoji: "💥", name: "Scopes Mk.28", desc: "+104% crit chance", cost: 276561681, type: "crit", value: 1.047, category: "scopes" },
  { id: "crit_29", emoji: "💥", name: "Scopes Mk.29", desc: "+123% crit chance", cost: 430754904, type: "crit", value: 1.236, category: "scopes" },
  { id: "crit_30", emoji: "💥", name: "Scopes Mk.30", desc: "+145% crit chance", cost: 670900764, type: "crit", value: 1.458, category: "scopes" },
  { id: "crit_31", emoji: "💥", name: "Scopes Mk.31", desc: "+172% crit chance", cost: 1044903710, type: "crit", value: 1.72, category: "scopes" },
  { id: "crit_32", emoji: "💥", name: "Scopes Mk.32", desc: "+202% crit chance", cost: 1627362415, type: "crit", value: 2.03, category: "scopes" },
  { id: "crit_33", emoji: "💥", name: "Scopes Mk.33", desc: "+239% crit chance", cost: 2534442324, type: "crit", value: 2.396, category: "scopes" },
  { id: "crit_34", emoji: "💥", name: "Scopes Mk.34", desc: "+282% crit chance", cost: 3947033003, type: "crit", value: 2.827, category: "scopes" },
  { id: "frenzy_11", emoji: "🔥", name: "Elixirs Mk.11", desc: "+26% tap value", cost: 166222, type: "frenzy", value: 0.262, category: "elixirs" },
  { id: "frenzy_12", emoji: "🔥", name: "Elixirs Mk.12", desc: "+30% tap value", cost: 258855, type: "frenzy", value: 0.309, category: "elixirs" },
  { id: "frenzy_13", emoji: "🔥", name: "Elixirs Mk.13", desc: "+36% tap value", cost: 403104, type: "frenzy", value: 0.364, category: "elixirs" },
  { id: "frenzy_14", emoji: "🔥", name: "Elixirs Mk.14", desc: "+43% tap value", cost: 627721, type: "frenzy", value: 0.43, category: "elixirs" },
  { id: "frenzy_15", emoji: "🔥", name: "Elixirs Mk.15", desc: "+50% tap value", cost: 977480, type: "frenzy", value: 0.507, category: "elixirs" },
  { id: "frenzy_16", emoji: "🔥", name: "Elixirs Mk.16", desc: "+59% tap value", cost: 1522087, type: "frenzy", value: 0.599, category: "elixirs" },
  { id: "frenzy_17", emoji: "🔥", name: "Elixirs Mk.17", desc: "+70% tap value", cost: 2370074, type: "frenzy", value: 0.706, category: "elixirs" },
  { id: "frenzy_18", emoji: "🔥", name: "Elixirs Mk.18", desc: "+83% tap value", cost: 3690415, type: "frenzy", value: 0.834, category: "elixirs" },
  { id: "frenzy_19", emoji: "🔥", name: "Elixirs Mk.19", desc: "+98% tap value", cost: 5746184, type: "frenzy", value: 0.984, category: "elixirs" },
  { id: "frenzy_20", emoji: "🔥", name: "Elixirs Mk.20", desc: "+116% tap value", cost: 8946947, type: "frenzy", value: 1.161, category: "elixirs" },
  { id: "frenzy_21", emoji: "🔥", name: "Elixirs Mk.21", desc: "+137% tap value", cost: 13930330, type: "frenzy", value: 1.37, category: "elixirs" },
  { id: "frenzy_22", emoji: "🔥", name: "Elixirs Mk.22", desc: "+161% tap value", cost: 21688982, type: "frenzy", value: 1.616, category: "elixirs" },
  { id: "frenzy_23", emoji: "🔥", name: "Elixirs Mk.23", desc: "+190% tap value", cost: 33768226, type: "frenzy", value: 1.907, category: "elixirs" },
  { id: "frenzy_24", emoji: "🔥", name: "Elixirs Mk.24", desc: "+225% tap value", cost: 52573721, type: "frenzy", value: 2.25, category: "elixirs" },
  { id: "frenzy_25", emoji: "🔥", name: "Elixirs Mk.25", desc: "+265% tap value", cost: 81850372, type: "frenzy", value: 2.655, category: "elixirs" },
  { id: "frenzy_26", emoji: "🔥", name: "Elixirs Mk.26", desc: "+313% tap value", cost: 127427789, type: "frenzy", value: 3.133, category: "elixirs" },
  { id: "frenzy_27", emoji: "🔥", name: "Elixirs Mk.27", desc: "+369% tap value", cost: 198380628, type: "frenzy", value: 3.697, category: "elixirs" },
  { id: "frenzy_28", emoji: "🔥", name: "Elixirs Mk.28", desc: "+436% tap value", cost: 308834681, type: "frenzy", value: 4.363, category: "elixirs" },
  { id: "frenzy_29", emoji: "🔥", name: "Elixirs Mk.29", desc: "+514% tap value", cost: 480778054, type: "frenzy", value: 5.148, category: "elixirs" },
  { id: "frenzy_30", emoji: "🔥", name: "Elixirs Mk.30", desc: "+607% tap value", cost: 748436646, type: "frenzy", value: 6.075, category: "elixirs" },
  { id: "frenzy_31", emoji: "🔥", name: "Elixirs Mk.31", desc: "+716% tap value", cost: 1165084328, type: "frenzy", value: 7.169, category: "elixirs" },
  { id: "frenzy_32", emoji: "🔥", name: "Elixirs Mk.32", desc: "+845% tap value", cost: 1813642374, type: "frenzy", value: 8.459, category: "elixirs" },
  { id: "frenzy_33", emoji: "🔥", name: "Elixirs Mk.33", desc: "+998% tap value", cost: 2823176260, type: "frenzy", value: 9.981, category: "elixirs" },
  { id: "frenzy_34", emoji: "🔥", name: "Elixirs Mk.34", desc: "+1177% tap value", cost: 4394570603, type: "frenzy", value: 11.778, category: "elixirs" },
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

const MP_CATEGORIES = Array.from(new Set(MP_UPGRADES.map((u) => u.category)));

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

const MATCH_BANK_START = 100_000_000;

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
  const [bankCoins, setBankCoins] = useState(MATCH_BANK_START);
  const [storeCat, setStoreCat] = useState<string>(MP_CATEGORIES[0] || "strikers");
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
  const pendingBroadcastRef = useRef<Partial<RemoteState> | null>(null);
  const broadcastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const sendStateSnapshot = useCallback((override?: Partial<RemoteState>) => {
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

  const queueStateBroadcast = useCallback((override?: Partial<RemoteState>) => {
    const merged = { ...(pendingBroadcastRef.current || {}), ...(override || {}) };
    pendingBroadcastRef.current = merged;
    const now = Date.now();
    const elapsed = now - lastBroadcastRef.current;
    const flush = () => {
      const next = pendingBroadcastRef.current || {};
      pendingBroadcastRef.current = null;
      if (broadcastTimerRef.current) {
        clearTimeout(broadcastTimerRef.current);
        broadcastTimerRef.current = null;
      }
      sendStateSnapshot(next);
    };
    if (elapsed >= 33) {
      flush();
      return;
    }
    if (broadcastTimerRef.current) return;
    broadcastTimerRef.current = setTimeout(flush, Math.max(0, 33 - elapsed));
  }, [sendStateSnapshot]);

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

  const sumUpgradeType = useCallback((type: typeof MP_UPGRADES[number]["type"]) => MP_UPGRADES.reduce((sum, u) => sum + (u.type === type ? (localStateRef.current.myUpgrades[u.id] || 0) * u.value : 0), 0), []);

  const resetMatchState = useCallback(() => {
    setMyTaps(0); setMyScore(0); setMySpent(0); setMyUpgrades({}); setBankCoins(MATCH_BANK_START); setRemote(null);
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
      const autoPower = sumUpgradeType("auto");
      if (!autoPower) return;
      const multPower = sumUpgradeType("mult");
      const frenzyPower = sumUpgradeType("frenzy");
      const add = autoPower * 0.1;
      const nextTaps = localStateRef.current.myTaps + add;
      const nextScore = localStateRef.current.myScore + add * (1 + multPower + frenzyPower);
      localStateRef.current = { ...localStateRef.current, myTaps: nextTaps, myScore: nextScore };
      setMyTaps(nextTaps);
      setMyScore(nextScore);
      queueStateBroadcast({ taps: nextTaps, score: nextScore, upgrades: localStateRef.current.myUpgrades, spent: localStateRef.current.mySpent });
    }, 50);
    return () => clearInterval(iv);
  }, [phase, queueStateBroadcast, sumUpgradeType]);

  useEffect(() => {
    if (!matchChannelRef.current || !match || (phase !== "battle" && phase !== "result" && phase !== "pregame")) return;
    const iv = setInterval(() => {
      const now = Date.now();
      if (now - lastBroadcastRef.current < 45) return;
      queueStateBroadcast();
    }, 50);
    return () => clearInterval(iv);
  }, [match, phase, queueStateBroadcast]);

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


  const spendMatchCoins = useCallback(async (amount: number) => {
    if (amount <= 0) return false;
    if (bankCoins < amount) return false;
    setBankCoins((prev) => Math.max(0, prev - amount));
    return true;
  }, [bankCoins]);


  const tapNow = useCallback(() => {
    if (phase !== "battle") return;
    const tapPower = sumUpgradeType("tap");
    const multPower = sumUpgradeType("mult");
    const frenzyPower = sumUpgradeType("frenzy");
    const critPower = sumUpgradeType("crit");
    const currentTaps = localStateRef.current.myTaps;
    let base = baseTapForChar(charId || "pepe") + tapPower;
    base *= 1 + multPower + frenzyPower;
    if (Math.random() < Math.min(0.9, critPower)) base *= 2.5;
    if ((charId || "pepe") === "trump" && (currentTaps + 1) % 40 < 1) base *= 2;
    if ((charId || "pepe") === "troll") base *= 0.8 + Math.random() * 0.8;
    const nextTaps = currentTaps + 1;
    const nextScore = localStateRef.current.myScore + base;
    localStateRef.current = { ...localStateRef.current, myTaps: nextTaps, myScore: nextScore };
    setMyTaps(nextTaps);
    setMyScore(nextScore);
    queueStateBroadcast({ taps: nextTaps, score: nextScore, upgrades: localStateRef.current.myUpgrades, spent: localStateRef.current.mySpent });
  }, [charId, phase, queueStateBroadcast, sumUpgradeType]);

  const buyUpgrade = useCallback(async (id: UpgradeId) => {
    if (phase !== "battle") return;
    const item = MP_UPGRADES.find((u) => u.id === id)!;
    const owned = localStateRef.current.myUpgrades[id] || 0;
    const price = Math.floor(item.cost * Math.pow(1.65, owned));
    const ok = await spendMatchCoins(price);
    if (!ok) { showToast("Not enough match coins"); return; }
    const nextSpent = localStateRef.current.mySpent + price;
    const nextUpgrades = { ...localStateRef.current.myUpgrades, [id]: owned + 1 };
    localStateRef.current = { ...localStateRef.current, mySpent: nextSpent, myUpgrades: nextUpgrades };
    setMySpent(nextSpent);
    setMyUpgrades(nextUpgrades);
    queueStateBroadcast({ spent: nextSpent, upgrades: nextUpgrades, taps: localStateRef.current.myTaps, score: localStateRef.current.myScore });
    showToast(`${item.emoji} ${item.name} Lv.${owned + 1} bought for ${formatNum(price)}`);
  }, [bankCoins, phase, queueStateBroadcast, showToast, spendMatchCoins]);

  const opponent = useMemo(() => match?.players.find((p) => p.id !== playerId) || null, [match, playerId]);
  const battleLeft = match ? Math.max(0, match.startAt + match.durationMs - Date.now()) : 0;
  const storeItems = useMemo(() => MP_UPGRADES.filter((u) => u.category === storeCat), [storeCat]);

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
              <div style={{ color: "#8b7aa3", fontSize: 11.5, lineHeight: 1.6 }}>• Public = instant 2-player pairing<br/>• Private = code lobbies + rematches<br/>• Matches last 3 minutes<br/>• Each match starts with *100M match coins*<br/>• Multiplayer upgrades are temporary<br/>• *Leaderboard ranks up by wins*<br/>• *3 losses in a row drops your ladder by 1*</div>
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
            <div style={{ color: "#7b6a92", fontSize: 12 }}>3 minutes. Buy temporary upgrades with 100M match coins. Highest score wins.</div>
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
                <div style={{ color: "#6f5f86", fontSize: 11.5 }}>Every tap stacks your battle score. Upgrades and coins are match-only in multiplayer.</div>
              </div>

              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
                {MP_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setStoreCat(cat)} style={{ whiteSpace: "nowrap", borderRadius: 999, border: `1px solid ${storeCat === cat ? "rgba(168,85,247,0.42)" : "rgba(255,255,255,0.08)"}`, background: storeCat === cat ? "rgba(168,85,247,0.16)" : "rgba(255,255,255,0.03)", color: storeCat === cat ? "#fff" : "#8b7aa3", fontWeight: 800, fontSize: 10.5, padding: "8px 12px", cursor: "pointer", textTransform: "capitalize" }}>{cat}</button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxHeight: 380, overflowY: "auto", paddingRight: 2 }}>
                {storeItems.map((u) => {
                  const owned = myUpgrades[u.id] || 0;
                  const price = Math.floor(u.cost * Math.pow(1.65, owned));
                  const can = bankCoins >= price;
                  return (
                    <button key={u.id} onClick={() => void buyUpgrade(u.id)} className="press-fx" style={{ textAlign: "left", background: can ? `linear-gradient(135deg,rgba(168,85,247,0.14),rgba(168,85,247,0.05))` : "rgba(255,255,255,0.03)", border: `1px solid ${can ? "rgba(168,85,247,0.24)" : "rgba(255,255,255,0.06)"}`, borderRadius: 18, padding: 12, cursor: "pointer", opacity: can ? 1 : 0.72 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 5 }}>
                        <span style={{ color: "#fff", fontWeight: 900, fontSize: 12.5 }}>{u.emoji} {u.name}</span>
                        <span style={{ color: "#c084fc", fontWeight: 900, fontSize: 10.5 }}>Lv.{owned}</span>
                      </div>
                      <div style={{ color: "#76668d", fontSize: 10.5, minHeight: 28 }}>{u.desc}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8 }}>
                        <span style={{ color: "#7f6c97", fontSize: 10, textTransform: "capitalize" }}>{u.category}</span>
                        <span style={{ color: can ? BG.gold : "#62546f", fontWeight: 900, fontSize: 12 }}>💰 {formatNum(price)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Match Coins Left", value: formatNum(bankCoins), color: BG.gold },
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
