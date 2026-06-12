"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getLevelFromXP, getLevelProgress, getRankFromLevel, getNextRank } from "@/lib/progression";
import { useAuth } from "@/lib/auth";
import MultiplayerArena from "./MultiplayerArena";
import { useSound } from "@/lib/sound";
import SoundControls from "@/components/SoundControls";

// ─── Characters ───────────────────────────────────────────────────────────────
export const CHARACTERS = [
  { id:"pepe",     name:"Pepe",      emoji:"🐸", image:"/characters/pepe.png",     color:"#4caf50", glow:"76,175,80",   baseCoins:1, ability:"Lucky Tap",   abilityDesc:"15% chance to triple coins",       specialName:"Comfy Mode",   specialDesc:"2× all earnings for 30s", specialDuration:30, passive:(c:number)=>Math.random()<0.15?c*3:c, specialMultiplier:2, energyRegen:1,   comboMax:10 },
  { id:"gigachad", name:"Gigachad",  emoji:"💪", image:"/characters/gigachad.png", color:"#e0b87a", glow:"224,184,122", baseCoins:1, ability:"Sigma Grind", abilityDesc:"Combo builds 2× faster, 20× max",  specialName:"Max Mode",     specialDesc:"20× combo instantly for 20s", specialDuration:20, passive:(c:number)=>c, specialMultiplier:5, energyRegen:1,   comboMax:20 },
  { id:"trump",    name:"Trump",     emoji:"🎩", image:"/characters/trump.png",    color:"#3b82f6", glow:"59,130,246",  baseCoins:2, ability:"Deal Maker",  abilityDesc:"Every 50 taps = 10× burst",        specialName:"MAGA Mode",    specialDesc:"Helpers 5× + tap 3× for 40s", specialDuration:40, passive:(c:number)=>c, specialMultiplier:3, energyRegen:0.8, comboMax:12 },
  { id:"troll",    name:"Trollface", emoji:"🧌", image:"/characters/troll.png",    color:"#a855f7", glow:"168,85,247",  baseCoins:1, ability:"Chaos Agent", abilityDesc:"Random 0.5–8× per tap",            specialName:"CHAOS MODE",   specialDesc:"10s of 1–15× random", specialDuration:10, passive:(c:number)=>c*(0.5+Math.random()*7.5), specialMultiplier:1, energyRegen:1.2, comboMax:10 },
  { id:"bonk",     name:"Bonk",      emoji:"🐕", image:"/characters/bonk.png",     color:"#e8853a", glow:"232,133,58",  baseCoins:1, ability:"BONK Speed",  abilityDesc:"3× energy regen",                  specialName:"BONK Frenzy",  specialDesc:"Infinite energy + 3× for 15s", specialDuration:15, passive:(c:number)=>c, specialMultiplier:3, energyRegen:3,   comboMax:10 },
];

// ─── Upgrades (40 items) ──────────────────────────────────────────────────────
type UpgradeEffect = { tapsPerSec?:number; tapFlat?:number; tapMult?:number; chainBonus?:number; critChance?:number; critMultScale?:number; allIncomeMult?:number; energyRegen?:number; maxEnergy?:number; comboSpeed?:number; comboMax?:number; specialCharge?:number; specialPower?:number; passivePerSec?:number; passiveMult?:number; };
const UPGRADES: Array<{id:string;name:string;emoji:string;desc:string;baseCost:number;costMult:number;tapsPerSec?:number;minLevel?:number;category:string;effect?:UpgradeEffect}> = [
  { id:"helper_1",   name:"FUD Bear",         emoji:"🐻", desc:"5 auto-taps/sec",              baseCost:200,       costMult:2.8,  tapsPerSec:5,    minLevel:1,  category:"auto" },
  { id:"helper_2",   name:"Bot Army",         emoji:"🤖", desc:"10 auto-taps/sec",             baseCost:1000,      costMult:3.0,  tapsPerSec:10,   minLevel:1,  category:"auto" },
  { id:"helper_3",   name:"Click Farm",       emoji:"🏭", desc:"25 auto-taps/sec",             baseCost:5000,      costMult:3.2,  tapsPerSec:25,   minLevel:5,  category:"auto" },
  { id:"helper_4",   name:"Whale Wallet",     emoji:"🐋", desc:"50 auto-taps/sec",             baseCost:20000,     costMult:3.5,  tapsPerSec:50,   minLevel:8,  category:"auto" },
  { id:"helper_5",   name:"Hedge Fund",       emoji:"🏦", desc:"80 auto-taps/sec",             baseCost:80000,     costMult:3.8,  tapsPerSec:80,   minLevel:11, category:"auto" },
  { id:"helper_6",   name:"AI Engine",        emoji:"🧠", desc:"130 auto-taps/sec",            baseCost:300000,    costMult:4.0,  tapsPerSec:130,  minLevel:15, category:"auto" },
  { id:"helper_7",   name:"Quantum Farm",     emoji:"⚛️", desc:"250 auto-taps/sec",            baseCost:1200000,   costMult:4.2,  tapsPerSec:250,  minLevel:20, category:"auto" },
  { id:"helper_8",   name:"Sigma Mine",       emoji:"💪", desc:"500 auto-taps/sec",            baseCost:5000000,   costMult:4.5,  tapsPerSec:500,  minLevel:25, category:"auto" },
  { id:"helper_9",   name:"Tower Lord Farm",  emoji:"🏆", desc:"1000 auto-taps/sec 👑",        baseCost:20000000,  costMult:5.0,  tapsPerSec:1000, minLevel:30, category:"auto" },
  { id:"tap_power",  name:"Power Tap",        emoji:"⚡", desc:"+1 coin per tap",              baseCost:50,        costMult:1.8,  category:"tap"  },
  { id:"tap_pow2",   name:"Double Strike",    emoji:"⚡⚡",desc:"+3 coins per tap",             baseCost:400,       costMult:2.0,  category:"tap"  },
  { id:"tap_pow3",   name:"Force Tap",        emoji:"🔥", desc:"+8 coins per tap",             baseCost:3000,      costMult:2.2,  category:"tap"  },
  { id:"tap_pow4",   name:"Mega Strike",      emoji:"💣", desc:"+20 coins per tap",            baseCost:25000,     costMult:2.5,  category:"tap"  },
  { id:"tap_pow5",   name:"God Tap",          emoji:"🌋", desc:"+60 coins per tap",            baseCost:200000,    costMult:2.8,  category:"tap"  },
  { id:"tap_pow6",   name:"Void Tap",         emoji:"🌌", desc:"+200 coins per tap",           baseCost:2000000,   costMult:3.0,  category:"tap"  },
  { id:"multi_tap",  name:"Multi Tap",        emoji:"✖️", desc:"×2 coins per tap",             baseCost:500,       costMult:2.5,  category:"tap"  },
  { id:"multi_tap2", name:"Triple Tap",       emoji:"✖️✖️",desc:"×0.5 more multiplier",        baseCost:3000,      costMult:2.8,  category:"tap"  },
  { id:"multi_tap3", name:"Quad Tap",         emoji:"🔱", desc:"×1 more multiplier",           baseCost:20000,     costMult:3.0,  category:"tap"  },
  { id:"multi_tap4", name:"Omega Tap",        emoji:"♾️", desc:"×2 more multiplier",           baseCost:200000,    costMult:3.5,  category:"tap"  },
  { id:"crit_chance",name:"Crit Hit",         emoji:"💥", desc:"+10% crit chance",             baseCost:300,       costMult:2.2,  category:"crit" },
  { id:"crit_chan2", name:"Eagle Eye",         emoji:"🦅", desc:"+10% more crit chance",        baseCost:1500,      costMult:2.4,  category:"crit" },
  { id:"crit_chan3", name:"Laser Focus",       emoji:"🎯", desc:"+10% more crit chance",        baseCost:8000,      costMult:2.8,  category:"crit" },
  { id:"crit_pow",   name:"Crit Force",        emoji:"💢", desc:"Crit = 8× instead of 5×",     baseCost:5000,      costMult:2.5,  category:"crit" },
  { id:"crit_pow2",  name:"Crit Nuke",         emoji:"☢️", desc:"Crit = 15× instead",          baseCost:50000,     costMult:3.0,  category:"crit" },
  { id:"energy_max", name:"Energy Tank",       emoji:"🔋", desc:"+200 max energy",              baseCost:100,       costMult:2.0,  category:"energy" },
  { id:"energy_max2",name:"Power Cell",        emoji:"⚡🔋",desc:"+500 max energy",             baseCost:700,       costMult:2.2,  category:"energy" },
  { id:"energy_max3",name:"Mega Battery",      emoji:"🏋️", desc:"+1000 max energy",            baseCost:5000,      costMult:2.5,  category:"energy" },
  { id:"energy_reg", name:"Quick Charge",      emoji:"⚡", desc:"Energy regen +0.5×",           baseCost:150,       costMult:1.9,  category:"energy" },
  { id:"energy_reg2",name:"Fast Charge",       emoji:"⚡⚡",desc:"Energy regen +1×",            baseCost:1000,      costMult:2.1,  category:"energy" },
  { id:"energy_reg3",name:"Turbo Charge",      emoji:"🌩️", desc:"Energy regen +2×",            baseCost:8000,      costMult:2.4,  category:"energy" },
  { id:"combo_speed",name:"Combo Rush",        emoji:"🔥", desc:"Combo builds 20% faster",      baseCost:80,        costMult:1.9,  category:"combo" },
  { id:"combo_spd2", name:"Turbo Combo",        emoji:"🔥🔥",desc:"Combo builds 50% faster",   baseCost:600,       costMult:2.1,  category:"combo" },
  { id:"combo_spd3", name:"Lightning Combo",    emoji:"⚡🔥",desc:"Combo builds 100% faster",  baseCost:4000,      costMult:2.4,  category:"combo" },
  { id:"combo_max",  name:"Combo King",         emoji:"👑", desc:"+5 max combo",                baseCost:400,       costMult:2.3,  category:"combo" },
  { id:"combo_max2", name:"Combo God",          emoji:"👑👑",desc:"+15 max combo",             baseCost:3000,      costMult:2.6,  category:"combo" },
  { id:"combo_max3", name:"Infinite Combo",     emoji:"♾️🔥",desc:"+30 max combo",            baseCost:25000,     costMult:3.0,  category:"combo" },
  { id:"special_cd", name:"Special Charger",    emoji:"⏩", desc:"Special charges 50% faster",  baseCost:300,       costMult:2.2,  category:"special" },
  { id:"special_cd2",name:"Quick Special",      emoji:"⚡⏩",desc:"Special charges 100% faster",baseCost:2000,      costMult:2.5,  category:"special" },
  { id:"special_cd3",name:"Instant Special",    emoji:"💫", desc:"Special charges 200% faster", baseCost:15000,     costMult:2.8,  category:"special" },
  // ── Bonus / Lucky ───────────────────────────────────────────────────────────
  { id:"lucky_strike", name:"Lucky Strike",      emoji:"🎰", desc:"+5% lucky tap chance",          baseCost:500,        costMult:2.8, category:"bonus" },
  { id:"lucky_str2",   name:"Fortune Tap",        emoji:"🍀", desc:"+10% lucky tap chance",         baseCost:3000,       costMult:2.9, category:"bonus" },
  { id:"lucky_str3",   name:"Jackpot Fingers",    emoji:"🎲", desc:"+15% lucky tap chance",         baseCost:20000,      costMult:3.1, category:"bonus" },
  { id:"lucky_str4",   name:"Casino Lord",        emoji:"🃏", desc:"+25% lucky tap chance",         baseCost:200000,     costMult:3.4, minLevel:15, category:"bonus" },
  { id:"coin_aura",    name:"Coin Aura",           emoji:"💰", desc:"All coins +50%",                baseCost:10000,      costMult:3.2, category:"bonus" },
  { id:"coin_aura2",   name:"Gold Aura",           emoji:"💎", desc:"All coins +100%",               baseCost:80000,      costMult:3.5, category:"bonus" },
  { id:"coin_aura3",   name:"Diamond Aura",        emoji:"💠", desc:"All coins +250%",               baseCost:700000,     costMult:3.8, category:"bonus" },
  { id:"coin_aura4",   name:"Singularity Aura",    emoji:"🌌", desc:"All coins +1000%",              baseCost:10000000,   costMult:4.2, minLevel:25, category:"bonus" },
  { id:"double_coins", name:"Double Dip",          emoji:"2️⃣", desc:"25% chance to double coins",   baseCost:5000,       costMult:3.0, category:"bonus" },
  { id:"triple_coins", name:"Triple Threat",       emoji:"3️⃣", desc:"10% chance to triple coins",   baseCost:50000,      costMult:3.4, category:"bonus" },
  { id:"rainbow_tap",  name:"Rainbow Tap",         emoji:"🌈", desc:"Random +50-500% on tap",        baseCost:15000,      costMult:3.0, category:"bonus" },
  { id:"moon_shot",    name:"Moon Shot",           emoji:"🚀", desc:"1% chance for 100x tap",        baseCost:500000,     costMult:4.0, minLevel:20, category:"bonus" },
  // ── More Auto Tiers ──────────────────────────────────────────────────────────
  { id:"helper_10",    name:"Degen Swarm",         emoji:"🐝", desc:"2000 auto-taps/sec",            baseCost:80000000,   costMult:5.2, tapsPerSec:2000,  minLevel:32, category:"auto" },
  { id:"helper_11",    name:"Mega Mine",           emoji:"⛏️", desc:"4000 auto-taps/sec",            baseCost:350000000,  costMult:5.5, tapsPerSec:4000,  minLevel:35, category:"auto" },
  { id:"helper_12",    name:"Galactic Tap",        emoji:"🌠", desc:"8000 auto-taps/sec",            baseCost:1500000000, costMult:5.8, tapsPerSec:8000,  minLevel:40, category:"auto" },
  { id:"helper_13",    name:"God Mode Farm",       emoji:"👑", desc:"20000 auto-taps/sec",           baseCost:8000000000, costMult:6.0, tapsPerSec:20000, minLevel:45, category:"auto" },
  { id:"auto_boost",   name:"Auto Overdrive",      emoji:"🔧", desc:"All auto +10%",                 baseCost:50000,      costMult:2.8, category:"auto" },
  { id:"auto_boost2",  name:"Overclock",           emoji:"🔩", desc:"All auto +25%",                 baseCost:400000,     costMult:3.0, category:"auto" },
  { id:"auto_boost3",  name:"Hyper Overclock",     emoji:"⚙️", desc:"All auto +50%",                 baseCost:3000000,    costMult:3.3, category:"auto" },
  { id:"auto_boost4",  name:"God Clock",           emoji:"⏱️", desc:"All auto +150%",               baseCost:25000000,   costMult:3.8, minLevel:25, category:"auto" },
  { id:"auto_mult",    name:"Auto Multiplier",     emoji:"🤖", desc:"x2 all auto income",            baseCost:200000,     costMult:3.5, category:"auto" },
  { id:"auto_mult2",   name:"Auto Turbo",          emoji:"🌀", desc:"x3 all auto income",            baseCost:2000000,    costMult:4.0, minLevel:20, category:"auto" },
  { id:"auto_mult3",   name:"Auto God",            emoji:"🌟", desc:"x5 all auto income",            baseCost:20000000,   costMult:4.5, minLevel:30, category:"auto" },
  { id:"idle_bonus",   name:"Idle Hustle",         emoji:"😴", desc:"Auto earns 20% more while idle",baseCost:8000,       costMult:2.5, category:"auto" },
  { id:"idle_bonus2",  name:"AFK King",            emoji:"🛌", desc:"Auto earns 50% more while idle",baseCost:60000,      costMult:2.8, category:"auto" },
  // ── More Tap Power ───────────────────────────────────────────────────────────
  { id:"tap_pow7",     name:"Nova Tap",            emoji:"💥", desc:"+600 coins per tap",           baseCost:20000000,   costMult:3.2, minLevel:25, category:"tap" },
  { id:"tap_pow8",     name:"Black Hole Tap",      emoji:"🕳️", desc:"+2000 coins per tap",          baseCost:200000000,  costMult:3.5, minLevel:30, category:"tap" },
  { id:"tap_pow9",     name:"Singularity Tap",     emoji:"🌌", desc:"+8000 coins per tap",          baseCost:2000000000, costMult:3.8, minLevel:40, category:"tap" },
  { id:"tap_spd",      name:"Quick Hands",         emoji:"👋", desc:"Taps cost 10% less energy",    baseCost:200,        costMult:2.0, category:"tap" },
  { id:"tap_spd2",     name:"Lightning Hands",     emoji:"⚡", desc:"Taps cost 25% less energy",    baseCost:2000,       costMult:2.3, category:"tap" },
  { id:"tap_spd3",     name:"Phantom Hands",       emoji:"👻", desc:"Taps cost 50% less energy",    baseCost:20000,      costMult:2.6, category:"tap" },
  { id:"tap_spd4",     name:"Zero Energy Tap",     emoji:"🔮", desc:"Taps cost 80% less energy",    baseCost:200000,     costMult:3.0, minLevel:20, category:"tap" },
  { id:"multi_tap5",   name:"Ultra Tap",           emoji:"✖️", desc:"x3 more multiplier",           baseCost:2000000,    costMult:3.8, minLevel:20, category:"tap" },
  { id:"multi_tap6",   name:"Sigma Tap",           emoji:"∑",  desc:"x5 more multiplier",           baseCost:20000000,   costMult:4.2, minLevel:28, category:"tap" },
  { id:"multi_tap7",   name:"God Multiplier",      emoji:"∞",  desc:"x10 more multiplier",          baseCost:200000000,  costMult:4.8, minLevel:35, category:"tap" },
  { id:"tap_chain",    name:"Chain Tap",           emoji:"⛓️", desc:"+1 bonus tap per click",       baseCost:10000,      costMult:3.0, category:"tap" },
  { id:"tap_chain2",   name:"Double Chain",        emoji:"🔗", desc:"+2 bonus taps per click",      baseCost:100000,     costMult:3.3, category:"tap" },
  { id:"tap_chain3",   name:"Tap Storm",           emoji:"🌪️", desc:"+5 bonus taps per click",      baseCost:1000000,    costMult:3.6, minLevel:15, category:"tap" },
  // ── More Crit ────────────────────────────────────────────────────────────────
  { id:"crit_chan4",    name:"Sniper Eye",          emoji:"🔭", desc:"+10% more crit chance",        baseCost:80000,      costMult:3.0, category:"crit" },
  { id:"crit_chan5",    name:"God Eye",             emoji:"👁️", desc:"+15% more crit chance",        baseCost:800000,     costMult:3.5, minLevel:20, category:"crit" },
  { id:"crit_pow3",     name:"Crit Omega",          emoji:"💀", desc:"Crit = 25x instead",           baseCost:500000,     costMult:3.5, minLevel:15, category:"crit" },
  { id:"crit_pow4",     name:"Crit Godmode",        emoji:"👑", desc:"Crit = 50x instead",           baseCost:5000000,    costMult:4.0, minLevel:25, category:"crit" },
  { id:"crit_pow5",     name:"Crit Singularity",    emoji:"🌋", desc:"Crit = 100x instead",          baseCost:50000000,   costMult:4.5, minLevel:35, category:"crit" },
  { id:"crit_aura",     name:"Crit Aura",           emoji:"💢", desc:"+25% crit damage bonus",        baseCost:20000,      costMult:2.8, category:"crit" },
  { id:"crit_aura2",    name:"Crit Storm",          emoji:"⚡", desc:"+75% crit damage bonus",       baseCost:200000,     costMult:3.2, minLevel:15, category:"crit" },
  { id:"crit_chain",    name:"Crit Chain",          emoji:"💫", desc:"Crits can chain (20% chance)", baseCost:100000,     costMult:3.5, minLevel:15, category:"crit" },
  { id:"crit_chain2",   name:"Crit Cascade",        emoji:"🌊", desc:"Crit chains more often (+30%)",baseCost:1000000,    costMult:4.0, minLevel:22, category:"crit" },
  // ── More Energy ──────────────────────────────────────────────────────────────
  { id:"energy_max4",   name:"Ultra Battery",       emoji:"🔋", desc:"+2000 max energy",             baseCost:40000,      costMult:2.8, minLevel:15, category:"energy" },
  { id:"energy_max5",   name:"God Battery",         emoji:"⚡", desc:"+5000 max energy",             baseCost:300000,     costMult:3.2, minLevel:20, category:"energy" },
  { id:"energy_max6",   name:"Infinite Cell",       emoji:"♾️", desc:"+15000 max energy",            baseCost:2000000,    costMult:3.6, minLevel:28, category:"energy" },
  { id:"energy_reg4",   name:"Ultra Charge",        emoji:"🌩️", desc:"Energy regen +4x",             baseCost:60000,      costMult:2.7, minLevel:15, category:"energy" },
  { id:"energy_reg5",   name:"Infinite Charge",     emoji:"🌀", desc:"Energy regen +8x",             baseCost:500000,     costMult:3.0, minLevel:22, category:"energy" },
  { id:"energy_saver",  name:"Energy Saver",        emoji:"🍃", desc:"Taps use 1 less energy",       baseCost:500,        costMult:2.0, category:"energy" },
  { id:"energy_saver2", name:"Eco Mode",            emoji:"🌿", desc:"Taps use 3 less energy",       baseCost:5000,       costMult:2.3, category:"energy" },
  { id:"overflow_tap",  name:"Overflow Tap",        emoji:"💥", desc:"+coins when energy is full",   baseCost:30000,      costMult:2.8, category:"energy" },
  // ── More Combo ───────────────────────────────────────────────────────────────
  { id:"combo_max4",    name:"Combo Legend",        emoji:"👑", desc:"+60 max combo",                baseCost:200000,     costMult:3.3, minLevel:15, category:"combo" },
  { id:"combo_max5",    name:"Combo Sigma",         emoji:"∑",  desc:"+120 max combo",               baseCost:2000000,    costMult:3.8, minLevel:22, category:"combo" },
  { id:"combo_max6",    name:"Infinite Combo",      emoji:"∞",  desc:"+300 max combo",               baseCost:20000000,   costMult:4.2, minLevel:30, category:"combo" },
  { id:"combo_hold",    name:"Combo Hold",          emoji:"🤝", desc:"Combo decays 30% slower",      baseCost:200,        costMult:2.0, category:"combo" },
  { id:"combo_hold2",   name:"Combo Lock",          emoji:"🔒", desc:"Combo decays 60% slower",      baseCost:2000,       costMult:2.3, category:"combo" },
  { id:"combo_hold3",   name:"Combo Freeze",        emoji:"❄️", desc:"Combo decays 90% slower",      baseCost:20000,      costMult:2.6, category:"combo" },
  { id:"combo_hold4",   name:"Eternal Combo",       emoji:"🕊️", desc:"Combo never decays",           baseCost:1000000,    costMult:3.5, minLevel:20, category:"combo" },
  { id:"combo_spd4",    name:"Warp Combo",          emoji:"🌀", desc:"Combo builds 200% faster",     baseCost:30000,      costMult:2.8, minLevel:12, category:"combo" },
  { id:"combo_spd5",    name:"God Combo Speed",     emoji:"⚡", desc:"Combo builds 500% faster",     baseCost:300000,     costMult:3.2, minLevel:20, category:"combo" },
  // ── More Special ─────────────────────────────────────────────────────────────
  { id:"special_cd4",   name:"Hyper Special",       emoji:"💫", desc:"Special charges 400% faster",  baseCost:100000,     costMult:3.2, minLevel:12, category:"special" },
  { id:"special_cd5",   name:"Ultra Special",       emoji:"🌟", desc:"Special charges 800% faster",  baseCost:1000000,    costMult:3.8, minLevel:20, category:"special" },
  { id:"special_cd6",   name:"God Special",         emoji:"👑", desc:"Special charges 2000% faster", baseCost:10000000,   costMult:4.2, minLevel:28, category:"special" },
  { id:"special_dur",   name:"Extended Special",    emoji:"⏳", desc:"Special lasts 20% longer",     baseCost:800,        costMult:2.2, category:"special" },
  { id:"special_dur2",  name:"Power Special",       emoji:"⚡", desc:"Special lasts 50% longer",     baseCost:8000,       costMult:2.5, category:"special" },
  { id:"special_dur3",  name:"Eternal Special",     emoji:"🌠", desc:"Special lasts 100% longer",    baseCost:80000,      costMult:2.8, minLevel:12, category:"special" },
  { id:"special_pow",   name:"Special Force",       emoji:"💥", desc:"Special multiplier +50%",      baseCost:5000,       costMult:2.8, category:"special" },
  { id:"special_pow2",  name:"Special Nuke",        emoji:"☢️", desc:"Special multiplier +150%",     baseCost:50000,      costMult:3.2, minLevel:12, category:"special" },
  { id:"special_pow3",  name:"Special God",         emoji:"🔱", desc:"Special multiplier +500%",     baseCost:500000,     costMult:3.8, minLevel:20, category:"special" },
  // ── Prestige ─────────────────────────────────────────────────────────────────
  { id:"prestige_tap",  name:"Prestige Power",      emoji:"🏅", desc:"All tap gains +20%",           baseCost:100000,     costMult:2.8, minLevel:15, category:"prestige" },
  { id:"prestige_tap2", name:"Elite Tap",           emoji:"🥇", desc:"All tap gains +50%",           baseCost:800000,     costMult:3.0, minLevel:20, category:"prestige" },
  { id:"prestige_tap3", name:"Legendary Tap",       emoji:"🏆", desc:"All tap gains +100%",          baseCost:6000000,    costMult:3.3, minLevel:25, category:"prestige" },
  { id:"prestige_auto", name:"Prestige Auto",       emoji:"🤖", desc:"All auto gains +20%",          baseCost:150000,     costMult:2.8, minLevel:15, category:"prestige" },
  { id:"prestige_auto2",name:"Elite Auto",          emoji:"🌐", desc:"All auto gains +60%",          baseCost:1200000,    costMult:3.0, minLevel:20, category:"prestige" },
  { id:"prestige_auto3",name:"Legendary Auto",      emoji:"🌟", desc:"All auto gains +150%",         baseCost:10000000,   costMult:3.4, minLevel:28, category:"prestige" },
  { id:"prestige_all",  name:"Total Prestige",      emoji:"💎", desc:"ALL gains +25%",               baseCost:500000,     costMult:3.2, minLevel:20, category:"prestige" },
  { id:"prestige_all2", name:"Diamond Prestige",    emoji:"🔷", desc:"ALL gains +75%",               baseCost:5000000,    costMult:3.6, minLevel:28, category:"prestige" },
  { id:"prestige_all3", name:"Sigma Prestige",      emoji:"⚜️", desc:"ALL gains +200%",              baseCost:50000000,   costMult:4.0, minLevel:35, category:"prestige" },
  { id:"prestige_all4", name:"God Prestige",        emoji:"👑", desc:"ALL gains +500%",              baseCost:500000000,  costMult:4.5, minLevel:42, category:"prestige" },
  // ── Degen ────────────────────────────────────────────────────────────────────
  { id:"degen_lore",    name:"Degen Lore",          emoji:"📖", desc:"+5% all income",               baseCost:100,        costMult:1.7, category:"degen" },
  { id:"degen_lore2",   name:"Deep Lore",           emoji:"📚", desc:"+15% all income",              baseCost:800,        costMult:1.9, category:"degen" },
  { id:"degen_lore3",   name:"Galaxy Brain",        emoji:"🧠", desc:"+35% all income",              baseCost:6000,       costMult:2.2, category:"degen" },
  { id:"degen_lore4",   name:"Sigma Brain",         emoji:"🔮", desc:"+80% all income",              baseCost:50000,      costMult:2.5, category:"degen" },
  { id:"degen_lore5",   name:"Omniscient",          emoji:"👁️", desc:"+200% all income",             baseCost:500000,     costMult:3.0, minLevel:18, category:"degen" },
  { id:"ngmi_tax",      name:"NGMI Tax",            emoji:"📉", desc:"Earn from the weak +10%",      baseCost:2000,       costMult:2.2, category:"degen" },
  { id:"wagmi_boost",   name:"WAGMI Boost",         emoji:"📈", desc:"+20% all income",              baseCost:15000,      costMult:2.5, category:"degen" },
  { id:"ape_in",        name:"Ape In",              emoji:"🦍", desc:"+15% global multiplier",       baseCost:5000,       costMult:2.8, category:"degen" },
  { id:"ape_in2",       name:"Full Ape",            emoji:"🦧", desc:"+40% global multiplier",       baseCost:50000,      costMult:3.2, minLevel:10, category:"degen" },
  { id:"diamond_hands", name:"Diamond Hands",       emoji:"💎", desc:"+25% all income",              baseCost:3000,       costMult:2.3, category:"degen" },
  { id:"diamond_hands2",name:"Unbreakable",         emoji:"🙌", desc:"+60% all income",              baseCost:30000,      costMult:2.7, minLevel:10, category:"degen" },
  { id:"hype_train",    name:"Hype Train",          emoji:"🚂", desc:"+30% all income",              baseCost:20000,      costMult:2.5, category:"degen" },
  { id:"degen_grind",   name:"Degen Grind",         emoji:"⚒️", desc:"+20% tap income",              baseCost:8000,       costMult:2.4, category:"degen" },
  { id:"degen_grind2",  name:"Chad Grind",          emoji:"💪", desc:"+50% tap income",              baseCost:80000,      costMult:2.7, minLevel:12, category:"degen" },
  { id:"alpha_call",    name:"Alpha Call",          emoji:"📣", desc:"+25% all income",              baseCost:20000,      costMult:2.8, category:"degen" },
  { id:"alpha_call2",   name:"God Alpha",           emoji:"📢", desc:"+75% all income",              baseCost:200000,     costMult:3.2, minLevel:15, category:"degen" },
  { id:"nft_flex",      name:"NFT Flex",            emoji:"🖼️", desc:"+20% when avatar is set",      baseCost:5000,       costMult:2.5, category:"degen" },
  { id:"whitelist",     name:"WL Secured",          emoji:"📋", desc:"+15% all income",              baseCost:3000,       costMult:2.2, category:"degen" },
  // ── Passive income ───────────────────────────────────────────────────────────
  { id:"passive_1",     name:"Staking Yield",       emoji:"🏦", desc:"+0.1 coins/sec passively",     baseCost:500,        costMult:2.0, category:"passive" },
  { id:"passive_2",     name:"LP Farm",             emoji:"🌾", desc:"+0.5 coins/sec passively",     baseCost:3000,       costMult:2.2, category:"passive" },
  { id:"passive_3",     name:"Yield Farm",          emoji:"🌻", desc:"+2 coins/sec passively",       baseCost:15000,      costMult:2.4, category:"passive" },
  { id:"passive_4",     name:"Degen Vault",         emoji:"🏛️", desc:"+8 coins/sec passively",      baseCost:80000,      costMult:2.6, category:"passive" },
  { id:"passive_5",     name:"DAO Treasury",        emoji:"🌐", desc:"+30 coins/sec passively",      baseCost:500000,     costMult:2.8, minLevel:15, category:"passive" },
  { id:"passive_6",     name:"Protocol Fees",       emoji:"⚙️", desc:"+100 coins/sec passively",     baseCost:3000000,    costMult:3.0, minLevel:22, category:"passive" },
  { id:"passive_7",     name:"Whale Staking",       emoji:"🐋", desc:"+400 coins/sec passively",     baseCost:20000000,   costMult:3.3, minLevel:30, category:"passive" },
  { id:"passive_8",     name:"God Yield",           emoji:"🌟", desc:"+2000 coins/sec passively",    baseCost:200000000,  costMult:3.8, minLevel:38, category:"passive" },
  { id:"passive_boost", name:"Compound Effect",     emoji:"📊", desc:"Passive income +20%",          baseCost:30000,      costMult:2.5, category:"passive" },
  { id:"passive_boost2",name:"Exponential Growth",  emoji:"📈", desc:"Passive income +60%",          baseCost:300000,     costMult:2.8, minLevel:15, category:"passive" },
  { id:"passive_boost3",name:"Hyperbolic Yield",    emoji:"🌀", desc:"Passive income +200%",         baseCost:3000000,    costMult:3.2, minLevel:22, category:"passive" },
  // ── Tower upgrades ───────────────────────────────────────────────────────────
  { id:"tower_1",       name:"Tower Floor 1",       emoji:"🏗️", desc:"+5% all income",               baseCost:1000,       costMult:2.0, category:"tower" },
  { id:"tower_2",       name:"Tower Floor 2",       emoji:"🏠", desc:"+12% all income",              baseCost:8000,       costMult:2.2, category:"tower" },
  { id:"tower_3",       name:"Tower Floor 3",       emoji:"🏢", desc:"+25% all income",              baseCost:60000,      costMult:2.4, minLevel:8, category:"tower" },
  { id:"tower_4",       name:"Tower Floor 4",       emoji:"🏬", desc:"+50% all income",              baseCost:500000,     costMult:2.6, minLevel:12, category:"tower" },
  { id:"tower_5",       name:"Tower Floor 5",       emoji:"🌆", desc:"+100% all income",             baseCost:4000000,    costMult:2.8, minLevel:18, category:"tower" },
  { id:"tower_6",       name:"Tower Floor 6",       emoji:"🌇", desc:"+200% all income",             baseCost:30000000,   costMult:3.0, minLevel:25, category:"tower" },
  { id:"tower_7",       name:"Tower Floor 7",       emoji:"🌃", desc:"+500% all income",             baseCost:250000000,  costMult:3.4, minLevel:32, category:"tower" },
  { id:"tower_8",       name:"Tower Penthouse",     emoji:"🌌", desc:"+1500% all income",            baseCost:2000000000, costMult:3.8, minLevel:40, category:"tower" },
  { id:"tower_guard",   name:"Tower Guard",         emoji:"💂", desc:"+8% income while online",      baseCost:20000,      costMult:2.3, category:"tower" },
  { id:"tower_skin",    name:"Tower Glow",          emoji:"✨", desc:"+3% per tower floor owned",    baseCost:50000,      costMult:2.5, category:"tower" },
  { id:"tower_lord",    name:"Tower Lord",          emoji:"👑", desc:"+50% all income",              baseCost:5000000,    costMult:3.2, minLevel:20, category:"tower" },
  // ── Meme Upgrades ────────────────────────────────────────────────────────────
  { id:"meme_1",        name:"Pepe Blessing",       emoji:"🐸", desc:"+10% all income",              baseCost:500,        costMult:2.2, category:"meme" },
  { id:"meme_2",        name:"Gigachad Aura",       emoji:"💪", desc:"+12% all income",              baseCost:1500,       costMult:2.3, category:"meme" },
  { id:"meme_3",        name:"Trump Deal",          emoji:"🎩", desc:"+15% all income",              baseCost:3000,       costMult:2.3, category:"meme" },
  { id:"meme_4",        name:"Troll Chaos",         emoji:"🧌", desc:"+18% all income",              baseCost:5000,       costMult:2.4, category:"meme" },
  { id:"meme_5",        name:"Bonk Energy",         emoji:"🐕", desc:"+12% all income",              baseCost:2000,       costMult:2.3, category:"meme" },
  { id:"meme_6",        name:"Sigma Energy",        emoji:"⚡", desc:"+20% all income",              baseCost:10000,      costMult:2.5, category:"meme" },
  { id:"meme_7",        name:"Diamond Meme",        emoji:"💎", desc:"+30% all income",              baseCost:50000,      costMult:2.7, category:"meme" },
  { id:"meme_8",        name:"Galaxy Meme",         emoji:"🌌", desc:"+50% all income",              baseCost:300000,     costMult:3.0, minLevel:12, category:"meme" },
  { id:"meme_combo",    name:"Meme Synergy",        emoji:"🌐", desc:"+25% all income",              baseCost:25000,      costMult:2.8, category:"meme" },
  { id:"meme_legend",   name:"Meme Legend",         emoji:"🌟", desc:"+100% all income",             baseCost:1000000,    costMult:3.5, minLevel:20, category:"meme" },
  { id:"viral_tap",     name:"Go Viral",            emoji:"📱", desc:"+20% all income",              baseCost:10000,      costMult:2.8, category:"meme" },
  { id:"viral_tap2",    name:"Full Send",           emoji:"📲", desc:"+50% all income",              baseCost:100000,     costMult:3.2, minLevel:12, category:"meme" },
  { id:"rug_pull",      name:"Rug Insurance",       emoji:"🛡️", desc:"+15% all income",              baseCost:8000,       costMult:2.5, category:"meme" },
  { id:"pump_it",       name:"Pump It",             emoji:"🔥", desc:"+35% all income",              baseCost:40000,      costMult:2.9, category:"meme" },
  { id:"to_da_moon",    name:"To Da Moon",          emoji:"🌙", desc:"+60% all income",              baseCost:250000,     costMult:3.3, minLevel:15, category:"meme" },
  // ── Galaxy end-game ──────────────────────────────────────────────────────────
  { id:"galaxy_1",      name:"Galaxy Tap",          emoji:"🌌", desc:"ALL gains x2",                 baseCost:50000000,   costMult:4.0, minLevel:30, category:"galaxy" },
  { id:"galaxy_2",      name:"Universe Tap",        emoji:"🌠", desc:"ALL gains x3",                 baseCost:500000000,  costMult:4.5, minLevel:38, category:"galaxy" },
  { id:"galaxy_3",      name:"Multiverse Tap",      emoji:"🌀", desc:"ALL gains x5",                 baseCost:5000000000, costMult:5.0, minLevel:45, category:"galaxy" },
  { id:"dark_energy",   name:"Dark Energy",         emoji:"🌑", desc:"+100% auto & passive",          baseCost:300000000,  costMult:4.8, minLevel:40, category:"galaxy" },
  { id:"big_bang",      name:"Big Bang",            emoji:"💥", desc:"ALL gains x1.5 permanent",     baseCost:200000000,  costMult:5.0, minLevel:38, category:"galaxy" },
  { id:"galaxy_forge",  name:"Galaxy Forge",        emoji:"⚒️", desc:"ALL gains x10",               baseCost:50000000000,costMult:6.0, minLevel:50, category:"galaxy" },
  { id:"new_auto_1", name:"Drone Bots", emoji:"🤖", desc:"+12 auto-taps/sec", baseCost:684, costMult:2.03, minLevel:1, category:"auto", effect:{tapsPerSec:12} },
  { id:"new_auto_2", name:"Miner Bots", emoji:"🤖", desc:"+25 auto-taps/sec", baseCost:1339, costMult:2.11, minLevel:3, category:"auto", effect:{tapsPerSec:25} },
  { id:"new_auto_3", name:"Factory Bots", emoji:"🤖", desc:"+60 auto-taps/sec", baseCost:2616, costMult:2.19, minLevel:6, category:"auto", effect:{tapsPerSec:60} },
  { id:"new_auto_4", name:"Swarm Bots", emoji:"🤖", desc:"+140 auto-taps/sec", baseCost:5108, costMult:2.27, minLevel:9, category:"auto", effect:{tapsPerSec:140} },
  { id:"new_auto_5", name:"Engine Bots", emoji:"🤖", desc:"+320 auto-taps/sec", baseCost:9966, costMult:2.35, minLevel:12, category:"auto", effect:{tapsPerSec:320} },
  { id:"new_auto_6", name:"Forge Bots", emoji:"🤖", desc:"+760 auto-taps/sec", baseCost:19429, costMult:2.43, minLevel:15, category:"auto", effect:{tapsPerSec:760} },
  { id:"new_auto_7", name:"Server Bots", emoji:"🤖", desc:"+1800 auto-taps/sec", baseCost:37855, costMult:2.51, minLevel:18, category:"auto", effect:{tapsPerSec:1800} },
  { id:"new_auto_8", name:"Fleet Bots", emoji:"🤖", desc:"+4200 auto-taps/sec", baseCost:73708, costMult:2.59, minLevel:21, category:"auto", effect:{tapsPerSec:4200} },
  { id:"new_tap_1", name:"Potion Tap", emoji:"⚡", desc:"+4 coins per tap", baseCost:844, costMult:2.03, minLevel:1, category:"tap", effect:{tapFlat:4} },
  { id:"new_tap_2", name:"Glove Tap", emoji:"⚡", desc:"+9 coins per tap", baseCost:1642, costMult:2.11, minLevel:3, category:"tap", effect:{tapFlat:9} },
  { id:"new_tap_3", name:"Hammer Tap", emoji:"⚡", desc:"+18 coins per tap", baseCost:3192, costMult:2.19, minLevel:6, category:"tap", effect:{tapFlat:18} },
  { id:"new_tap_4", name:"Injector Tap", emoji:"⚡", desc:"+40 coins per tap", baseCost:6203, costMult:2.27, minLevel:9, category:"tap", effect:{tapFlat:40} },
  { id:"new_tap_5", name:"Core Tap", emoji:"⚡", desc:"+95 coins per tap", baseCost:12046, costMult:2.35, minLevel:12, category:"tap", effect:{tapFlat:95} },
  { id:"new_tap_6", name:"Rune Tap", emoji:"⚡", desc:"+220 coins per tap", baseCost:23381, costMult:2.43, minLevel:15, category:"tap", effect:{tapFlat:220} },
  { id:"new_tap_7", name:"Sigil Tap", emoji:"⚡", desc:"+520 coins per tap", baseCost:45363, costMult:2.51, minLevel:18, category:"tap", effect:{tapFlat:520} },
  { id:"new_tap_8", name:"Surge Tap", emoji:"⚡", desc:"+1200 coins per tap", baseCost:87974, costMult:2.59, minLevel:21, category:"tap", effect:{tapFlat:1200} },
  { id:"new_crit_1", name:"Scope Crit", emoji:"💥", desc:"+3% crit chance and stronger crits", baseCost:1004, costMult:2.03, minLevel:1, category:"crit", effect:{critChance:0.03,critMultScale:0.2} },
  { id:"new_crit_2", name:"Laser Crit", emoji:"💥", desc:"+4% crit chance and stronger crits", baseCost:1945, costMult:2.11, minLevel:3, category:"crit", effect:{critChance:0.04,critMultScale:0.25} },
  { id:"new_crit_3", name:"Prism Crit", emoji:"💥", desc:"+5% crit chance and stronger crits", baseCost:3769, costMult:2.19, minLevel:6, category:"crit", effect:{critChance:0.05,critMultScale:0.30000000000000004} },
  { id:"new_crit_4", name:"Targeter Crit", emoji:"💥", desc:"+6% crit chance and stronger crits", baseCost:7297, costMult:2.27, minLevel:9, category:"crit", effect:{critChance:0.06,critMultScale:0.35} },
  { id:"new_crit_5", name:"Oracle Crit", emoji:"💥", desc:"+8% crit chance and stronger crits", baseCost:14126, costMult:2.35, minLevel:12, category:"crit", effect:{critChance:0.08,critMultScale:0.4} },
  { id:"new_crit_6", name:"Catalyst Crit", emoji:"💥", desc:"+10% crit chance and stronger crits", baseCost:27333, costMult:2.43, minLevel:15, category:"crit", effect:{critChance:0.1,critMultScale:0.45000000000000007} },
  { id:"new_energy_1", name:"Battery Energy", emoji:"🔋", desc:"+0.4 energy regen and +150 max energy", baseCost:1123, costMult:2.03, minLevel:1, category:"energy", effect:{energyRegen:0.4,maxEnergy:150} },
  { id:"new_energy_2", name:"Cell Energy", emoji:"🔋", desc:"+0.8 energy regen and +300 max energy", baseCost:2173, costMult:2.11, minLevel:3, category:"energy", effect:{energyRegen:0.8,maxEnergy:300} },
  { id:"new_energy_3", name:"Reactor Energy", emoji:"🔋", desc:"+1.5 energy regen and +700 max energy", baseCost:4201, costMult:2.19, minLevel:6, category:"energy", effect:{energyRegen:1.5,maxEnergy:700} },
  { id:"new_energy_4", name:"Reservoir Energy", emoji:"🔋", desc:"+2.5 energy regen and +1400 max energy", baseCost:8118, costMult:2.27, minLevel:9, category:"energy", effect:{energyRegen:2.5,maxEnergy:1400} },
  { id:"new_energy_5", name:"Conduit Energy", emoji:"🔋", desc:"+4 energy regen and +3000 max energy", baseCost:15686, costMult:2.35, minLevel:12, category:"energy", effect:{energyRegen:4,maxEnergy:3000} },
  { id:"new_energy_6", name:"Matrix Energy", emoji:"🔋", desc:"+6 energy regen and +6500 max energy", baseCost:30297, costMult:2.43, minLevel:15, category:"energy", effect:{energyRegen:6,maxEnergy:6500} },
  { id:"new_combo_1", name:"Rhythm Combo", emoji:"🔥", desc:"Faster combo build and +8 max combo", baseCost:1243, costMult:2.03, minLevel:1, category:"combo", effect:{comboSpeed:0.25,comboMax:8} },
  { id:"new_combo_2", name:"Loop Combo", emoji:"🔥", desc:"Faster combo build and +12 max combo", baseCost:2400, costMult:2.11, minLevel:3, category:"combo", effect:{comboSpeed:0.4,comboMax:12} },
  { id:"new_combo_3", name:"Chain Combo", emoji:"🔥", desc:"Faster combo build and +18 max combo", baseCost:4633, costMult:2.19, minLevel:6, category:"combo", effect:{comboSpeed:0.65,comboMax:18} },
  { id:"new_combo_4", name:"Burst Combo", emoji:"🔥", desc:"Faster combo build and +28 max combo", baseCost:8940, costMult:2.27, minLevel:9, category:"combo", effect:{comboSpeed:1.0,comboMax:28} },
  { id:"new_combo_5", name:"Drive Combo", emoji:"🔥", desc:"Faster combo build and +40 max combo", baseCost:17246, costMult:2.35, minLevel:12, category:"combo", effect:{comboSpeed:1.5,comboMax:40} },
  { id:"new_combo_6", name:"Engine Combo", emoji:"🔥", desc:"Faster combo build and +60 max combo", baseCost:33261, costMult:2.43, minLevel:15, category:"combo", effect:{comboSpeed:2.4,comboMax:60} },
  { id:"new_special_1", name:"Charger Special", emoji:"✨", desc:"Special charges faster and hits harder", baseCost:1363, costMult:2.03, minLevel:1, category:"special", effect:{specialCharge:1.5,specialPower:0.15} },
  { id:"new_special_2", name:"Totem Special", emoji:"✨", desc:"Special charges faster and hits harder", baseCost:2628, costMult:2.11, minLevel:3, category:"special", effect:{specialCharge:2.5,specialPower:0.25} },
  { id:"new_special_3", name:"Beacon Special", emoji:"✨", desc:"Special charges faster and hits harder", baseCost:5065, costMult:2.19, minLevel:6, category:"special", effect:{specialCharge:4,specialPower:0.35} },
  { id:"new_special_4", name:"Idol Special", emoji:"✨", desc:"Special charges faster and hits harder", baseCost:9761, costMult:2.27, minLevel:9, category:"special", effect:{specialCharge:6.5,specialPower:0.5} },
  { id:"new_special_5", name:"Flux Special", emoji:"✨", desc:"Special charges faster and hits harder", baseCost:18805, costMult:2.35, minLevel:12, category:"special", effect:{specialCharge:10,specialPower:0.8} },
  { id:"new_special_6", name:"Crown Special", emoji:"✨", desc:"Special charges faster and hits harder", baseCost:36225, costMult:2.43, minLevel:15, category:"special", effect:{specialCharge:16,specialPower:1.2} },
  { id:"new_bonus_1", name:"Luck Brew Potion", emoji:"🍀", desc:"+8% all income", baseCost:1482, costMult:2.03, minLevel:1, category:"bonus", effect:{allIncomeMult:0.08} },
  { id:"new_bonus_2", name:"Jackpot Juice Potion", emoji:"🍀", desc:"+12% all income", baseCost:2855, costMult:2.11, minLevel:3, category:"bonus", effect:{allIncomeMult:0.12} },
  { id:"new_bonus_3", name:"Moon Elixir Potion", emoji:"🍀", desc:"+18% all income", baseCost:5497, costMult:2.19, minLevel:6, category:"bonus", effect:{allIncomeMult:0.18} },
  { id:"new_bonus_4", name:"Fortune Tonic Potion", emoji:"🍀", desc:"+26% all income", baseCost:10582, costMult:2.27, minLevel:9, category:"bonus", effect:{allIncomeMult:0.26} },
  { id:"new_bonus_5", name:"Gold Mist Potion", emoji:"🍀", desc:"+38% all income", baseCost:20365, costMult:2.35, minLevel:12, category:"bonus", effect:{allIncomeMult:0.38} },
  { id:"new_bonus_6", name:"Prism Soda Potion", emoji:"🍀", desc:"+55% all income", baseCost:39189, costMult:2.43, minLevel:15, category:"bonus", effect:{allIncomeMult:0.55} },
  { id:"new_prestige_1", name:"Crest Relic", emoji:"🏆", desc:"+8% all income", baseCost:1602, costMult:2.03, minLevel:1, category:"prestige", effect:{allIncomeMult:0.08} },
  { id:"new_prestige_2", name:"Medal Relic", emoji:"🏆", desc:"+12% all income", baseCost:3082, costMult:2.11, minLevel:3, category:"prestige", effect:{allIncomeMult:0.12} },
  { id:"new_prestige_3", name:"Laurel Relic", emoji:"🏆", desc:"+18% all income", baseCost:5929, costMult:2.19, minLevel:6, category:"prestige", effect:{allIncomeMult:0.18} },
  { id:"new_prestige_4", name:"Crown Relic", emoji:"🏆", desc:"+26% all income", baseCost:11403, costMult:2.27, minLevel:9, category:"prestige", effect:{allIncomeMult:0.26} },
  { id:"new_prestige_5", name:"Halo Relic", emoji:"🏆", desc:"+38% all income", baseCost:21925, costMult:2.35, minLevel:12, category:"prestige", effect:{allIncomeMult:0.38} },
  { id:"new_prestige_6", name:"Seal Relic", emoji:"🏆", desc:"+55% all income", baseCost:42153, costMult:2.43, minLevel:15, category:"prestige", effect:{allIncomeMult:0.55} },
  { id:"new_degen_1", name:"Alpha Leak Degen", emoji:"🦍", desc:"+8% all income", baseCost:1722, costMult:2.03, minLevel:1, category:"degen", effect:{allIncomeMult:0.08} },
  { id:"new_degen_2", name:"Whale Ping Degen", emoji:"🦍", desc:"+12% all income", baseCost:3310, costMult:2.11, minLevel:3, category:"degen", effect:{allIncomeMult:0.12} },
  { id:"new_degen_3", name:"Ape Serum Degen", emoji:"🦍", desc:"+18% all income", baseCost:6361, costMult:2.19, minLevel:6, category:"degen", effect:{allIncomeMult:0.18} },
  { id:"new_degen_4", name:"Flex Fuel Degen", emoji:"🦍", desc:"+26% all income", baseCost:12224, costMult:2.27, minLevel:9, category:"degen", effect:{allIncomeMult:0.26} },
  { id:"new_degen_5", name:"Hype Can Degen", emoji:"🦍", desc:"+38% all income", baseCost:23485, costMult:2.35, minLevel:12, category:"degen", effect:{allIncomeMult:0.38} },
  { id:"new_degen_6", name:"Diamond Dust Degen", emoji:"🦍", desc:"+55% all income", baseCost:45116, costMult:2.43, minLevel:15, category:"degen", effect:{allIncomeMult:0.55} },
  { id:"new_passive_1", name:"Cache Yield", emoji:"🏦", desc:"+3/sec passive income", baseCost:1842, costMult:2.03, minLevel:1, category:"passive", effect:{passivePerSec:3,passiveMult:0.05} },
  { id:"new_passive_2", name:"Vault Yield", emoji:"🏦", desc:"+8/sec passive income", baseCost:3537, costMult:2.11, minLevel:3, category:"passive", effect:{passivePerSec:8,passiveMult:0.08} },
  { id:"new_passive_3", name:"Reservoir Yield", emoji:"🏦", desc:"+20/sec passive income", baseCost:6793, costMult:2.19, minLevel:6, category:"passive", effect:{passivePerSec:20,passiveMult:0.12} },
  { id:"new_passive_4", name:"Stream Yield", emoji:"🏦", desc:"+55/sec passive income", baseCost:13045, costMult:2.27, minLevel:9, category:"passive", effect:{passivePerSec:55,passiveMult:0.18} },
  { id:"new_passive_5", name:"Pipeline Yield", emoji:"🏦", desc:"+140/sec passive income", baseCost:25045, costMult:2.35, minLevel:12, category:"passive", effect:{passivePerSec:140,passiveMult:0.25} },
  { id:"new_passive_6", name:"Drip Yield", emoji:"🏦", desc:"+360/sec passive income", baseCost:48080, costMult:2.43, minLevel:15, category:"passive", effect:{passivePerSec:360,passiveMult:0.35} },
  { id:"new_tower_1", name:"Module Tower", emoji:"🏙️", desc:"+8% all income", baseCost:1961, costMult:2.03, minLevel:1, category:"tower", effect:{allIncomeMult:0.08} },
  { id:"new_tower_2", name:"Wing Tower", emoji:"🏙️", desc:"+12% all income", baseCost:3765, costMult:2.11, minLevel:3, category:"tower", effect:{allIncomeMult:0.12} },
  { id:"new_tower_3", name:"Vault Tower", emoji:"🏙️", desc:"+18% all income", baseCost:7225, costMult:2.19, minLevel:6, category:"tower", effect:{allIncomeMult:0.18} },
  { id:"new_tower_4", name:"Lab Tower", emoji:"🏙️", desc:"+26% all income", baseCost:13866, costMult:2.27, minLevel:9, category:"tower", effect:{allIncomeMult:0.26} },
  { id:"new_tower_5", name:"Bridge Tower", emoji:"🏙️", desc:"+38% all income", baseCost:26605, costMult:2.35, minLevel:12, category:"tower", effect:{allIncomeMult:0.38} },
  { id:"new_tower_6", name:"Penthouse Tower", emoji:"🏙️", desc:"+55% all income", baseCost:51044, costMult:2.43, minLevel:15, category:"tower", effect:{allIncomeMult:0.55} },
  { id:"new_meme_1", name:"Sticker Pack Meme", emoji:"📱", desc:"+8% all income", baseCost:2081, costMult:2.03, minLevel:1, category:"meme", effect:{allIncomeMult:0.08} },
  { id:"new_meme_2", name:"Viral Clip Meme", emoji:"📱", desc:"+12% all income", baseCost:3992, costMult:2.11, minLevel:3, category:"meme", effect:{allIncomeMult:0.12} },
  { id:"new_meme_3", name:"Trend Beam Meme", emoji:"📱", desc:"+18% all income", baseCost:7658, costMult:2.19, minLevel:6, category:"meme", effect:{allIncomeMult:0.18} },
  { id:"new_meme_4", name:"Emoji Cannon Meme", emoji:"📱", desc:"+26% all income", baseCost:14687, costMult:2.27, minLevel:9, category:"meme", effect:{allIncomeMult:0.26} },
  { id:"new_meme_5", name:"Hype Loop Meme", emoji:"📱", desc:"+38% all income", baseCost:28165, costMult:2.35, minLevel:12, category:"meme", effect:{allIncomeMult:0.38} },
  { id:"new_meme_6", name:"Chaos Post Meme", emoji:"📱", desc:"+55% all income", baseCost:54008, costMult:2.43, minLevel:15, category:"meme", effect:{allIncomeMult:0.55} },
  { id:"new_galaxy_1", name:"Nebula Shard Galaxy", emoji:"🌌", desc:"+8% all income", baseCost:2201, costMult:2.03, minLevel:1, category:"galaxy", effect:{allIncomeMult:0.08} },
  { id:"new_galaxy_2", name:"Star Forge Galaxy", emoji:"🌌", desc:"+12% all income", baseCost:4220, costMult:2.11, minLevel:3, category:"galaxy", effect:{allIncomeMult:0.12} },
  { id:"new_galaxy_3", name:"Void Prism Galaxy", emoji:"🌌", desc:"+18% all income", baseCost:8090, costMult:2.19, minLevel:6, category:"galaxy", effect:{allIncomeMult:0.18} },
  { id:"new_galaxy_4", name:"Quasar Core Galaxy", emoji:"🌌", desc:"+26% all income", baseCost:15508, costMult:2.27, minLevel:9, category:"galaxy", effect:{allIncomeMult:0.26} },
  { id:"new_galaxy_5", name:"Warp Crown Galaxy", emoji:"🌌", desc:"+38% all income", baseCost:29725, costMult:2.35, minLevel:12, category:"galaxy", effect:{allIncomeMult:0.38} },
  { id:"new_galaxy_6", name:"Cosmic Engine Galaxy", emoji:"🌌", desc:"+55% all income", baseCost:56972, costMult:2.43, minLevel:15, category:"galaxy", effect:{allIncomeMult:0.55} },
];

const upgradeEffectTotal = (upgrades:Record<string,number>, key:keyof UpgradeEffect) => UPGRADES.reduce((sum,u)=>sum+((u.effect?.[key]||0)*(upgrades[u.id]||0)),0);

// ─── Glass UI helpers ─────────────────────────────────────────────────────────
const G = {
  bg: "#06000f",
  surface: "rgba(255,255,255,0.035)",
  surfaceHover: "rgba(255,255,255,0.065)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(168,85,247,0.35)",
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.1)",
  purple: "#a855f7",
  purpleDim: "rgba(168,85,247,0.12)",
  gold: "#f5c842",
  goldDim: "rgba(245,200,66,0.1)",
  green: "#22d67a",
  red: "#ef4444",
  blur: "blur(24px)",
};

// ─── Utils ────────────────────────────────────────────────────────────────────
function fmt(n:number){ if(n>=1e9)return(n/1e9).toFixed(2)+"B"; if(n>=1e6)return(n/1e6).toFixed(2)+"M"; if(n>=1e3)return(n/1e3).toFixed(1)+"K"; return Math.floor(n).toString(); }
function getUpgCost(u:typeof UPGRADES[0], lv:number){ return Math.floor(u.baseCost*Math.pow(u.costMult,lv)); }
function getPlayerName(uid:string=""){ const k=uid?`degen_username_${uid}`:"degen_username"; try{ return localStorage.getItem(k)||""; }catch{ return ""; } }
function setPlayerName(n:string,uid:string=""){ const k=uid?`degen_username_${uid}`:"degen_username"; try{ localStorage.setItem(k,n); }catch{} }
function getPlayerWallet(uid:string=""){ const k=uid?`degen_sol_wallet_${uid}`:"degen_sol_wallet"; try{ return localStorage.getItem(k)||""; }catch{ return ""; } }
function setPlayerWallet(w:string,uid:string=""){ const k=uid?`degen_sol_wallet_${uid}`:"degen_sol_wallet"; try{ localStorage.setItem(k,w); }catch{} }
function getAvatar(uid:string=""){ const k=uid?`degen_avatar_${uid}`:"degen_avatar"; try{return localStorage.getItem(k)||"";}catch{return "";} }
function setAvatarStore(a:string,uid:string=""){ const k=uid?`degen_avatar_${uid}`:"degen_avatar"; try{localStorage.setItem(k,a);}catch{} }

// ── Global tap counter (shared across all characters) ────────────────────────
function getGlobalTaps(uid:string):{totalTaps:number;totalEarned:number}{
  if(typeof window==="undefined")return{totalTaps:0,totalEarned:0};
  try{ const r=localStorage.getItem(uid?`degen_global_${uid}`:"degen_global"); if(r){ const d=JSON.parse(r); return{totalTaps:d.totalTaps||0,totalEarned:d.totalEarned||0}; } }catch{}
  return{totalTaps:0,totalEarned:0};
}
function setGlobalTaps(uid:string,totalTaps:number,totalEarned:number){
  if(typeof window==="undefined")return;
  try{ localStorage.setItem(uid?`degen_global_${uid}`:"degen_global",JSON.stringify({totalTaps:Math.floor(totalTaps),totalEarned})); }catch{}
}

interface SaveData { charId:string; coins:number; totalEarned:number; totalTaps:number; upgrades:Record<string,number>; highScore:number; }

function loadSave(uid:string,charId:string):SaveData{
  const scopedKey=uid?`degen_save_${uid}_${charId}`:`degen_save_${charId}`;
  const legacyKey=`degen_save_${charId}`;
  // Try scoped key first
  try{ const r=localStorage.getItem(scopedKey); if(r){ const d=JSON.parse(r); return { charId:d.charId, coins:d.coins||0, totalEarned:d.totalEarned||0, totalTaps:d.totalTaps||0, upgrades:d.upgrades||{}, highScore:d.highScore||0 }; } }catch{}
  // Fall back to legacy global key (one-time migration for existing users)
  if(uid&&scopedKey!==legacyKey){
    try{ const r=localStorage.getItem(legacyKey); if(r){ const d=JSON.parse(r); const save={ charId:d.charId||charId, coins:d.coins||0, totalEarned:d.totalEarned||0, totalTaps:d.totalTaps||0, upgrades:d.upgrades||{}, highScore:d.highScore||0 }; localStorage.setItem(scopedKey,JSON.stringify(save)); localStorage.removeItem(legacyKey); return save; } }catch{}
  }
  return { charId, coins:0, totalEarned:0, totalTaps:0, upgrades:{}, highScore:0 };
}
function persistSave(uid:string,d:SaveData){ const k=uid?`degen_save_${uid}_${d.charId}`:`degen_save_${d.charId}`; try{ localStorage.setItem(k,JSON.stringify(d)); }catch{} }

const SUPA_URL_CONST="https://paxtohwiycuhwmlziwrr.supabase.co";
const SUPA_KEY_CONST="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheHRvaHdpeWN1aHdtbHppd3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTEzNjMsImV4cCI6MjA5NjY4NzM2M30.HtHcTkUO35c_4WTjufHRHUhAHPDuATw23bqh39D_qkQ";

type DirectSyncPayload = {
  pid:string;
  uname:string;
  charId:string;
  totalEarned?:number;
  totalTaps:number;
  coins?:number;
  upgrades?:Record<string,number>;
  solWallet?:string;
  avatarUrl?:string;
};

let _upsertPlayerRpcBroken=false;
let _syncTapsRpcBroken=false;

async function getAuthToken(){
  let authToken=SUPA_KEY_CONST;
  try{
    const{supabase}=await import("@/lib/supabase");
    const{data:{session}}=await supabase.auth.getSession();
    if(session?.access_token)authToken=session.access_token;
  }catch{}
  return authToken;
}

function dbNum(v:unknown):number{
  if(typeof v==="number")return Number.isFinite(v)?v:0;
  if(typeof v==="bigint")return Number(v);
  if(typeof v==="string"){
    const n=Number(v);
    return Number.isFinite(n)?n:0;
  }
  return 0;
}

function mergeUpgrades(local?:Record<string,number>,db?:Record<string,number>){
  const merged:Record<string,number>={...(db||{})};
  for(const[k,v]of Object.entries(local||{}))merged[k]=Math.max(Number(merged[k])||0,Number(v)||0);
  return merged;
}

async function fetchPlayerDirect(pid:string,authToken:string):Promise<Record<string,unknown>|null>{
  const resp=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players?select=id,wallet_address,username,character,total_score,games_played,token_balance,upgrades,sol_wallet,avatar_url&wallet_address=eq.${encodeURIComponent(pid)}&limit=1`,{
    headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache, no-store","Pragma":"no-cache"},
    cache:"no-store",
  });
  if(!resp.ok)throw new Error(`direct_fetch_failed_${resp.status}: ${await resp.text()}`);
  const text=await resp.text();
  const rows=JSON.parse(text.replace(/:(\d{16,})([,}])/g, ':"$1"$2')) as Record<string,unknown>[];
  return rows[0]||null;
}

// Direct table fallback used when Supabase RPCs fail. It always reads the current row first
// and writes MAX(current DB, local browser) values so a stale tab cannot lower leaderboard stats.
async function syncPlayerDirect(p:DirectSyncPayload,authToken?:string):Promise<number|null>{
  if(!p.pid||p.totalTaps<=0)return null;
  const token=authToken||await getAuthToken();
  const existing=await fetchPlayerDirect(p.pid,token);
  const localTaps=Math.floor(p.totalTaps)||0;
  const localScore=Math.floor(p.totalEarned||0)||0;
  const localCoins=Math.floor(p.coins||0)||0;
  const payload:Record<string,unknown>={
    wallet_address:p.pid,
    username:p.uname||(`Degen_${p.pid.slice(-6)}`),
    character:p.charId||"pepe",
    games_played:localTaps,
    last_seen:new Date().toISOString(),
  };

  if(typeof p.totalEarned==="number")payload.total_score=localScore;
  if(typeof p.coins==="number")payload.token_balance=localCoins;
  if(p.upgrades)payload.upgrades=p.upgrades;
  if(p.solWallet)payload.sol_wallet=p.solWallet;
  if(p.avatarUrl)payload.avatar_url=p.avatarUrl;

  if(existing){
    payload.games_played=Math.max(dbNum(existing.games_played),localTaps);
    if(typeof p.totalEarned==="number")payload.total_score=Math.max(dbNum(existing.total_score),localScore);
    if(typeof p.coins==="number")payload.token_balance=Math.max(dbNum(existing.token_balance),localCoins);
    if(p.upgrades)payload.upgrades=mergeUpgrades(p.upgrades,existing.upgrades as Record<string,number>|undefined);
    const patch=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players?wallet_address=eq.${encodeURIComponent(p.pid)}`,{
      method:"PATCH",
      headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${token}`,"Content-Type":"application/json","Prefer":"return=representation","Cache-Control":"no-cache"},
      body:JSON.stringify(payload),
    });
    if(!patch.ok)throw new Error(`direct_patch_failed_${patch.status}: ${await patch.text()}`);
    const saved=(await patch.json()) as Record<string,unknown>[];
    return dbNum(saved?.[0]?.games_played);
  }

  const insert=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players`,{
    method:"POST",
    headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${token}`,"Content-Type":"application/json","Prefer":"return=representation","Cache-Control":"no-cache"},
    body:JSON.stringify(payload),
  });
  if(!insert.ok)throw new Error(`direct_insert_failed_${insert.status}: ${await insert.text()}`);
  const saved=(await insert.json()) as Record<string,unknown>[];
  return dbNum(saved?.[0]?.games_played);
}

async function syncDB(pid:string,uname:string,charId:string,totalEarned:number,totalTaps:number,coins:number,upgrades?:Record<string,number>,solWallet?:string,avatarUrl?:string){
  if(!pid)return;
  const authToken=await getAuthToken();
  const payload={pid,uname,charId,totalEarned,totalTaps,coins,upgrades,solWallet,avatarUrl};
  if(!_upsertPlayerRpcBroken){
    try{
      const rpcPayload:Record<string,unknown>={
        p_wallet_address:pid,
        p_username:uname||("Degen_"+pid.slice(-6)),
        p_character:charId,
        // Send numeric here; string payloads hit overloaded RPC ambiguity in this Supabase project.
        p_total_score:Math.floor(totalEarned)||0,
        p_games_played:Math.floor(totalTaps),
        p_token_balance:Math.floor(coins),
        p_is_verified:false,
        p_last_seen:new Date().toISOString(),
      };
      if(upgrades)rpcPayload.p_upgrades=upgrades;
      if(solWallet)rpcPayload.p_sol_wallet=solWallet;
      if(avatarUrl)rpcPayload.p_avatar_url=avatarUrl;
      const resp=await fetch(`${SUPA_URL_CONST}/rest/v1/rpc/upsert_player_safe`,{
        method:"POST",
        headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json","Cache-Control":"no-cache"},
        body:JSON.stringify(rpcPayload),
      });
      if(resp.ok)return;
      const errText=await resp.text();
      console.error("[syncDB] RPC rejected; falling back to direct table sync:",errText);
      logSyncError(pid,"syncDB_rpc_error",errText,totalTaps);
      if(errText.includes("PGRST203")||errText.includes("function")||errText.includes("column"))_upsertPlayerRpcBroken=true;
    }catch(e){
      console.error("[syncDB] RPC error; falling back to direct table sync",e);
      logSyncError(pid,"syncDB_rpc_exception",String(e),totalTaps);
    }
  }
  try{await syncPlayerDirect(payload,authToken);}catch(e){console.error("[syncDB] direct fallback failed",e);logSyncError(pid,"syncDB_direct_error",String(e),totalTaps);}
}

// ─── DEDICATED TAP SYNC (fully independent of earned/currency) ───────────────
// This function ONLY writes games_played (taps). It never touches total_score.
// Even if earned values overflow or have issues, taps still sync correctly.
// ─── RETRY QUEUE: any failed tap sync is stored and retried automatically ─────
const _tapRetryQueue: Map<string,{pid:string;uname:string;charId:string;taps:number;retries:number}> = new Map();

// syncTaps: writes taps to DB via dedicated RPC, returns DB value (or null on failure).
// On failure, tries a direct monotonic table update before queueing for retry.
async function syncTaps(pid:string,uname:string,charId:string,taps:number): Promise<number|null>{
  if(!pid||taps<=0)return null;
  const authToken=await getAuthToken();
  if(!_syncTapsRpcBroken){
    try{
      const resp=await fetch(`${SUPA_URL_CONST}/rest/v1/rpc/sync_taps_only`,{
        method:"POST",
        headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json","Cache-Control":"no-cache","Prefer":"return=representation"},
        body:JSON.stringify({p_walletaddress:pid,p_username:uname||("Degen_"+pid.slice(-6)),p_character:charId||"pepe",p_gamesplayed:Math.floor(taps),p_lastseen:new Date().toISOString()}),
      });
      if(resp.ok){
        const dbVal=await resp.json();
        const dbTaps=dbNum(dbVal)||((Array.isArray(dbVal)&&dbVal[0])?dbNum(dbVal[0]):0);
        _tapRetryQueue.delete(pid);
        return dbTaps||Math.floor(taps);
      }
      const errText=await resp.text();
      console.error("[syncTaps] RPC rejected; falling back to direct table sync:",errText);
      logSyncError(pid,"syncTaps_rpc_error",errText,taps);
      if(errText.includes("PGRST202")||errText.includes("column")||errText.includes("42703"))_syncTapsRpcBroken=true;
    }catch(e){
      console.error("[syncTaps] RPC network error; falling back to direct table sync",e);
      logSyncError(pid,"syncTaps_rpc_exception",String(e),taps);
    }
  }
  try{
    const dbTaps=await syncPlayerDirect({pid,uname,charId,totalTaps:taps},authToken);
    _tapRetryQueue.delete(pid);
    return dbTaps;
  }catch(e){
    console.error("[syncTaps] Direct fallback failed — queueing for retry",e);
    logSyncError(pid,"syncTaps_direct_error",String(e),taps);
    _tapRetryQueue.set(pid,{pid,uname,charId,taps,retries:(_tapRetryQueue.get(pid)?.retries||0)+1});
    return null;
  }
}

// Drain the retry queue — called every sync cycle
async function drainRetryQueue(){
  for(const[,entry] of _tapRetryQueue){
    if(entry.retries>20){_tapRetryQueue.delete(entry.pid);continue;}// give up after 20 retries
    await syncTaps(entry.pid,entry.uname,entry.charId,entry.taps);
  }
}

// Store sync errors to localStorage so they surface in admin / debugging
function logSyncError(pid:string,type:string,msg:string,taps:number){
  if(typeof window==="undefined")return;
  try{
    const key="degen_sync_errors";
    const existing=JSON.parse(localStorage.getItem(key)||"[]");
    existing.unshift({pid,type,msg:msg.slice(0,200),taps,ts:new Date().toISOString()});
    localStorage.setItem(key,JSON.stringify(existing.slice(0,20)));// keep last 20
  }catch{}
}

interface Particle { id:number; x:number; y:number; value:string; color:string; big:boolean; }
interface LBEntry { id:string; wallet_address:string; username:string; character:string; total_score:number; games_played:number; avatar_url?:string; last_seen?:string; }
function isOnline(last_seen?:string){if(!last_seen)return false;return(Date.now()-new Date(last_seen).getTime())<3*60*1000;}

// ─── Countdown ────────────────────────────────────────────────────────────────
function useCountdown(){
  const [t,setT]=useState("");
  useEffect(()=>{
    function c(){ const now=Date.now(),p=7*24*3600000,epoch=new Date("2026-06-09T00:00:00Z").getTime(),next=epoch+Math.ceil((now-epoch)/p)*p,d=next-now; const days=Math.floor(d/86400000),h=Math.floor((d%86400000)/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000); setT(days>0?`${days}d ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`); }
    c(); const id=setInterval(c,1000); return()=>clearInterval(id);
  },[]);
  return t;
}

// ─── TOP BAR (glass) ─────────────────────────────────────────────────────────
function AvatarDisplay({emoji,url,size=28}:{emoji:string;url?:string;size?:number}){
  if(url){return <img src={url} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"1.5px solid rgba(168,85,247,0.5)",flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>;}
  return <span style={{fontSize:Math.round(size*0.65),lineHeight:1,flexShrink:0}}>{emoji||"🐸"}</span>;
}

function maskWallet(addr:string){ if(!addr) return "Not linked"; return addr.length>12?`${addr.slice(0,4)}...${addr.slice(-4)}`:addr; }
function totalUpgradeLevels(upgrades:Record<string,number>){ return Object.values(upgrades||{}).reduce((sum,v)=>sum+(Number(v)||0),0); }
function loadMpProfileStats(playerId:string){
  const defaults={wins:0,losses:0,draws:0,streak:0,lossStreak:0,bestStreak:0,ladder:0,mmr:1000,seasonWins:0,seasonPoints:0,totalSpent:0};
  if(typeof window==="undefined"||!playerId)return defaults;
  try{ const raw=localStorage.getItem(`degen_mp_stats_${playerId}`); if(!raw)return defaults; return {...defaults,...JSON.parse(raw)}; }catch{return defaults;}
}

function TopBar({username,avatar,avatarUrl,onSettings,onProfile,onMenu,onLogout}:{username:string;avatar:string;avatarUrl?:string;onSettings:()=>void;onProfile:()=>void;onMenu:()=>void;onLogout:()=>void}){
  return(
    <div style={{
      position:"fixed",top:0,left:0,right:0,zIndex:200,
      background:"linear-gradient(to bottom, rgba(4,0,12,0.97), rgba(8,2,20,0.88))",
      backdropFilter:G.blur,
      borderBottom:"1px solid rgba(168,85,247,0.16)",
      padding:"0 14px",height:54,
      display:"flex",alignItems:"center",gap:9,
      boxShadow:"0 4px 24px rgba(0,0,0,0.4)",
    }}>
      <img src="/logo.png" alt="" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
        style={{width:30,height:30,objectFit:"contain",filter:"drop-shadow(0 0 10px rgba(168,85,247,0.8))"}}/>
      <span className="neon-flicker" style={{fontWeight:900,fontSize:14,letterSpacing:"0.02em",flex:1,background:"linear-gradient(90deg,#fff,#c084fc 60%,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
        DEGEN CLICKER
      </span>
      <a href="/whitepaper" target="_blank" rel="noopener noreferrer" style={{
        background:G.purpleDim,border:`1px solid rgba(168,85,247,0.3)`,
        borderRadius:20,color:"#c084fc",fontSize:10,fontWeight:800,
        padding:"5px 11px",cursor:"pointer",textDecoration:"none",whiteSpace:"nowrap",
      }}>📄 Docs</a>
      <div style={{
        display:"flex",alignItems:"center",gap:6,
        background:"rgba(168,85,247,0.07)",border:"1px solid rgba(168,85,247,0.2)",
        borderRadius:20,padding:"4px 11px 4px 5px",
      }}>
        <AvatarDisplay emoji={avatar} url={avatarUrl} size={28}/>
        <span style={{color:"#ddd",fontSize:12,fontWeight:800,maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username||"Degen"}</span>
      </div>
      <SoundControls compact={true}/>
      <button onClick={onSettings} className="press-fx" style={{
        background:G.glass,border:`1px solid ${G.glassBorder}`,
        borderRadius:11,color:"#999",fontSize:13,padding:"6px 10px",cursor:"pointer",
      }}>⚙️</button>
      <button onClick={onLogout} className="press-fx" style={{
        background:"rgba(239,68,68,0.09)",border:"1px solid rgba(239,68,68,0.25)",
        borderRadius:11,color:"#f87171",fontSize:11,fontWeight:800,padding:"6px 11px",cursor:"pointer",
      }}>Exit</button>
    </div>
  );
}

// ─── NAV + SIDEBAR ────────────────────────────────────────────────────────────
const CORE_TABS=[{id:"home",label:"Home",emoji:"🏠"},{id:"play",label:"Play",emoji:"🎮"},{id:"multi",label:"PvP",emoji:"⚔️"},{id:"games",label:"Games",emoji:"🎰"},{id:"shop",label:"Shop",emoji:"⚡"}];
const MENU_TABS=[
  {id:"profile",label:"Profile",emoji:"👤",desc:"Identity, stats, fighter setup"},
  {id:"quests",label:"Missions",emoji:"🧭",desc:"Progress tasks and rewards"},
  {id:"achievements",label:"Achievements",emoji:"🏅",desc:"Unlocked milestones and flex"},
  {id:"ranks",label:"Leaderboard",emoji:"🏆",desc:"Live global climb"},
  {id:"compete",label:"Tournaments & Clans",emoji:"🏟️",desc:"Weekly tournament + clan wars"},
  {id:"settings",label:"Settings",emoji:"⚙️",desc:"Wallet, avatar, account"},
];

function BottomBar({active,onTab,onMenu}:{active:string;onTab:(t:string)=>void;onMenu:()=>void}){
  const accentFor=(id:string)=>id==="play"?"#a855f7":id==="ranks"?"#f5c842":id==="games"?"#f5c842":id==="shop"?"#22d67a":id==="multi"?"#f87171":id==="profile"?"#60a5fa":"#c084fc";
  return(
    <div style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:100,
      background:"linear-gradient(to top, rgba(4,0,12,0.98), rgba(8,2,20,0.92))",
      borderTop:"1px solid rgba(168,85,247,0.18)",
      backdropFilter:G.blur,display:"grid",gridTemplateColumns:"repeat(6,1fr)",alignItems:"end",
      paddingBottom:"env(safe-area-inset-bottom,0px)",boxShadow:"0 -8px 32px rgba(0,0,0,0.5)",
    }}>
      {CORE_TABS.map((tab)=>{
        const ac=accentFor(tab.id);
        const isActive=active===tab.id;
        const isPlay=tab.id==="play";
        return(
          <button key={tab.id} onClick={()=>onTab(tab.id)} style={{
            background:"none",border:"none",padding:isPlay?"0 0 6px":"11px 0 9px",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:3,cursor:"pointer",position:"relative",minHeight:74,
          }}>
            {isPlay?(
              <div style={{position:"relative",top:-12,width:60,height:60,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isActive?"linear-gradient(135deg,#7c3aed,#a855f7,#c084fc)":"linear-gradient(135deg,#4c1d95,#6d28d9,#8b5cf6)",border:"2.5px solid rgba(192,132,252,0.6)",boxShadow:isActive?"0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.3), 0 8px 20px rgba(0,0,0,0.5)":"0 0 18px rgba(168,85,247,0.4), 0 8px 20px rgba(0,0,0,0.5)"}}>
                <span style={{fontSize:26,filter:"drop-shadow(0 0 8px rgba(255,255,255,0.5))",lineHeight:1}}>🎮</span>
                {isActive&&<span style={{position:"absolute",inset:-7,borderRadius:"50%",border:"1.5px solid rgba(192,132,252,0.4)",animation:"glowPulse 2s ease-in-out infinite"}}/>}
              </div>
            ):(
              <>
                {isActive&&<div style={{position:"absolute",top:0,left:"22%",right:"22%",height:2.5,background:`linear-gradient(90deg,transparent,${ac},transparent)`,borderRadius:"0 0 3px 3px",boxShadow:`0 0 10px ${ac}, 0 2px 14px ${ac}66`}}/>}
                <span style={{fontSize:21,lineHeight:1,filter:isActive?`drop-shadow(0 0 7px ${ac})`:"grayscale(0.35) opacity(0.68)",transform:isActive?"translateY(-1px)":"none",transition:"filter 0.25s, transform 0.25s",animation:isActive?"tabPop 0.35s ease":"none"}}>{tab.emoji}</span>
              </>
            )}
            <span style={{fontSize:8.5,fontWeight:isActive?900:600,color:isActive?ac:"#4b4762",textTransform:"uppercase",letterSpacing:"0.08em",transition:"color 0.25s",textShadow:isActive?`0 0 12px ${ac}88`:"none"}}>{tab.label}</span>
          </button>
        );
      })}
      <button onClick={onMenu} style={{background:"none",border:"none",padding:"11px 0 9px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:3,cursor:"pointer",position:"relative",minHeight:74}}>
        <span style={{fontSize:21,lineHeight:1,filter:"opacity(0.75)",transition:"filter 0.25s"}}>🧩</span>
        <span style={{fontSize:8.5,fontWeight:700,color:"#8b79a9",textTransform:"uppercase",letterSpacing:"0.08em"}}>Menu</span>
      </button>
    </div>
  );
}

function SideDrawer({open,active,onClose,onOpenTab}:{open:boolean;active:string;onClose:()=>void;onOpenTab:(tab:string)=>void}){
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.56)",backdropFilter:"blur(10px)",zIndex:230}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"min(88vw,380px)",zIndex:231,transform:open?"translateX(0)":"translateX(104%)",transition:"transform 0.28s ease",background:"linear-gradient(180deg,rgba(12,6,24,0.98),rgba(6,2,16,0.98))",borderLeft:"1px solid rgba(168,85,247,0.18)",boxShadow:"-20px 0 60px rgba(0,0,0,0.45)",padding:"22px 18px 26px",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div>
            <div style={{color:"#c084fc",fontSize:11,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase"}}>Game Hub</div>
            <div style={{color:"#fff",fontSize:24,fontWeight:900,letterSpacing:"-0.03em"}}>Control Center</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#ddd",width:38,height:38,cursor:"pointer",fontSize:18}}>×</button>
        </div>
        <div style={{display:"grid",gap:10,marginBottom:18}}>
          {MENU_TABS.map(tab=>{
            const activeNow=active===tab.id;
            return <button key={tab.id} onClick={()=>{onOpenTab(tab.id);onClose();}} style={{textAlign:"left",background:activeNow?"linear-gradient(135deg,rgba(168,85,247,0.18),rgba(96,165,250,0.08))":"rgba(255,255,255,0.03)",border:activeNow?"1px solid rgba(168,85,247,0.35)":"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:"14px 14px",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><span style={{fontSize:20}}>{tab.emoji}</span><span style={{color:"#fff",fontWeight:900,fontSize:14}}>{tab.label}</span></div>
              <div style={{color:"#7f6c97",fontSize:11.5,lineHeight:1.45}}>{tab.desc}</div>
            </button>;
          })}
        </div>
        <div style={{background:"rgba(245,200,66,0.06)",border:"1px solid rgba(245,200,66,0.16)",borderRadius:20,padding:14,marginBottom:14}}>
          <div style={{color:"#f5c842",fontWeight:900,marginBottom:8}}>Platform expansion queued</div>
          <div style={{color:"#b6a2cf",fontSize:11.5,lineHeight:1.6}}>Quests, clans, tournaments, cosmetics, raids, prestige, rival systems, and deeper PvP abilities are being organized behind this new nav so the app can scale without feeling messy.</div>
        </div>
        <a href="/whitepaper" target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",textDecoration:"none",background:"linear-gradient(135deg,rgba(96,165,250,0.18),rgba(168,85,247,0.12))",border:"1px solid rgba(96,165,250,0.22)",borderRadius:16,padding:"12px 14px",color:"#dbeafe",fontWeight:800}}>Open docs</a>
      </div>
    </>
  );
}
// ─── USERNAME MODAL (glass) ───────────────────────────────────────────────────
function UsernameModal({onConfirm}:{onConfirm:(name:string,wallet:string)=>void}){
  const [name,setName]=useState("");
  const [wallet,setWallet]=useState("");
  const [walletErr,setWalletErr]=useState("");
  const adj=["Degen","Sigma","Giga","Based","Ape","Moon","Chad","Ngmi","Rekt","Diamond","Gold","Paper","Bull","Bear"];
  const noun=["Tapper","Clicker","Frog","Whale","Pepe","Lord","King","God","Pump","Hands","Degen","Grinder"];
  const [sug]=useState(()=>adj[Math.floor(Math.random()*adj.length)]+noun[Math.floor(Math.random()*noun.length)]+Math.floor(Math.random()*999));

  function validate(){
    if(wallet.trim()&&!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.trim())){
      setWalletErr("Doesn't look like a valid Solana address");return;
    }
    setWalletErr("");
    onConfirm(name.trim()||sug, wallet.trim());
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(20px)"}}>
      <div style={{
        background:"rgba(14,4,28,0.95)",
        border:`1px solid rgba(168,85,247,0.35)`,
        borderRadius:28,padding:"32px 24px",width:"100%",maxWidth:360,
        textAlign:"center",
        boxShadow:"0 0 80px rgba(168,85,247,0.2), 0 40px 80px rgba(0,0,0,0.6)",
        backdropFilter:"blur(24px)",
      }}>
        <div style={{fontSize:52,marginBottom:12,filter:"drop-shadow(0 0 20px rgba(168,85,247,0.6))"}}>🎮</div>
        <h2 style={{color:"#fff",fontWeight:900,fontSize:22,marginBottom:6,letterSpacing:"-0.02em"}}>Set Up Your Profile</h2>
        <p style={{color:"#9b8ab8",fontSize:13,marginBottom:24,lineHeight:1.6}}>Choose a name for the leaderboard.<br/>Add your Solana wallet to receive prize payouts.</p>

        <div style={{marginBottom:14,textAlign:"left"}}>
          <label style={{color:"#7844bb",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:6}}>Display Name</label>
          <input value={name} onChange={e=>setName(e.target.value.slice(0,18))} onKeyDown={e=>e.key==="Enter"&&validate()} placeholder={sug} autoFocus
            style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid rgba(168,85,247,0.3)`,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,padding:"12px 14px",outline:"none",boxSizing:"border-box",transition:"border 0.2s"}}/>
          <div style={{color:"#6b5a8a",fontSize:10,marginTop:4}}>Suggestion: {sug}</div>
        </div>

        <div style={{marginBottom:24,textAlign:"left"}}>
          <label style={{color:"#7844bb",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:6}}>
            Solana Wallet <span style={{color:"#6b5a8a",fontWeight:500,textTransform:"none"}}>— optional</span>
          </label>
          <input value={wallet} onChange={e=>{setWallet(e.target.value);setWalletErr("");}} placeholder="e.g. 7xKXt…qF2P" onKeyDown={e=>e.key==="Enter"&&validate()}
            style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${walletErr?"rgba(255,60,60,0.5)":"rgba(168,85,247,0.2)"}`,borderRadius:12,color:"#22d67a",fontSize:12,fontWeight:600,padding:"12px 14px",outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
          {walletErr
            ?<div style={{color:"#ff6060",fontSize:10,marginTop:4}}>⚠ {walletErr}</div>
            :<div style={{color:"#6b5a8a",fontSize:10,marginTop:4}}>Required to receive USDC prize payouts 🏆</div>
          }
        </div>

        <button onClick={validate} style={{
          width:"100%",background:"linear-gradient(135deg,#6d28d9,#a855f7)",
          border:"none",borderRadius:14,color:"#fff",fontWeight:900,fontSize:16,
          padding:"15px",cursor:"pointer",
          boxShadow:"0 0 40px rgba(168,85,247,0.4), 0 8px 24px rgba(0,0,0,0.4)",
          letterSpacing:"-0.01em",
        }}>
          Let&apos;s Go! 🚀
        </button>
      </div>
    </div>
  );
}

// ─── Character Stage ──────────────────────────────────────────────────────────
function ModelStage({ char, specialActive, charPulse, onTap, firstPlay }:{
  char:typeof CHARACTERS[0]; specialActive:boolean; charPulse:boolean;
  onTap:(e:React.MouseEvent|React.TouchEvent)=>void; firstPlay:boolean;
}){
  const SIZE=300;
  // deterministic spark positions per character
  const sparks=[
    {left:"8%",bottom:"20%",size:5,delay:"0s",dur:"2.4s"},
    {left:"85%",bottom:"30%",size:4,delay:"0.7s",dur:"2.8s"},
    {left:"20%",bottom:"10%",size:3,delay:"1.3s",dur:"2.2s"},
    {left:"70%",bottom:"12%",size:5,delay:"0.4s",dur:"3s"},
    {left:"45%",bottom:"6%",size:3,delay:"1.8s",dur:"2.6s"},
    {left:"92%",bottom:"50%",size:3,delay:"1s",dur:"2.4s"},
  ];
  return(
    <div style={{position:"relative",width:SIZE,height:SIZE,margin:"0 auto",flexShrink:0}}>
      {/* Ambient glow base */}
      <div style={{position:"absolute",inset:-30,borderRadius:"50%",background:`radial-gradient(ellipse at 50% 60%,rgba(${char.glow},${specialActive?0.55:0.22}) 0%,transparent 70%)`,pointerEvents:"none",transition:"background 0.6s",animation:"glowPulse 3s ease-in-out infinite"}}/>
      {/* Floor reflection ellipse */}
      <div style={{position:"absolute",bottom:-18,left:"12%",right:"12%",height:26,borderRadius:"50%",background:`radial-gradient(ellipse,rgba(${char.glow},0.3),transparent 70%)`,filter:"blur(6px)",pointerEvents:"none"}}/>
      {/* Rising spark particles */}
      {sparks.map((s,i)=>(
        <span key={i} className="spark" style={{
          left:s.left,bottom:s.bottom,width:s.size,height:s.size,
          background:`rgb(${char.glow})`,boxShadow:`0 0 ${s.size*2}px rgb(${char.glow})`,
          animationDelay:s.delay,animationDuration:s.dur,
        }}/>
      ))}
      {/* Spinning orbit rings — always on, intensify during special */}
      <div style={{position:"absolute",inset:-8,borderRadius:"50%",border:`1px solid rgba(${char.glow},${specialActive?0.7:0.18})`,borderTopColor:`rgba(${char.glow},${specialActive?1:0.5})`,animation:"ringSpin 4s linear infinite",pointerEvents:"none",transition:"border-color 0.4s"}}/>
      <div style={{position:"absolute",inset:-18,borderRadius:"50%",border:`1px dashed rgba(${char.glow},${specialActive?0.45:0.1})`,animation:"ringSpinRev 9s linear infinite",pointerEvents:"none"}}/>
      {specialActive&&<div style={{position:"absolute",inset:-28,borderRadius:"50%",border:`1.5px solid rgba(${char.glow},0.5)`,animation:"ringSpin 2s linear infinite",pointerEvents:"none",boxShadow:`0 0 24px rgba(${char.glow},0.4)`}}/>}
      {/* Main tap circle with idle float + breathe */}
      <div className={specialActive?"":"char-idle"} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <div
          onMouseDown={onTap} onTouchStart={onTap}
          className="char-breathe"
          style={{
            position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",
            cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",pointerEvents:"auto",
            border:specialActive?`2.5px solid rgba(${char.glow},1)`:`2px solid rgba(${char.glow},0.45)`,
            boxShadow:specialActive
              ?`0 0 70px rgba(${char.glow},0.9),0 0 140px rgba(${char.glow},0.45),inset 0 0 50px rgba(${char.glow},0.2)`
              :`0 0 34px rgba(${char.glow},0.35),inset 0 0 24px rgba(${char.glow},0.07)`,
            transition:"box-shadow 0.4s,border 0.4s,transform 0.07s",
            transform:charPulse?"scale(0.93)":"scale(1)",
            background:`radial-gradient(ellipse at 50% 30%,rgba(${char.glow},0.14) 0%,rgba(6,0,15,0.85) 100%)`,
          }}
        >
          <img src="/characters/troll.png" alt={char.name} draggable={false}
            style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block",pointerEvents:"none",
              filter:specialActive?`brightness(1.25) saturate(1.5) drop-shadow(0 0 18px rgba(${char.glow},0.7))`:"none",transition:"filter 0.4s"}}
            onError={e=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:115px;filter:drop-shadow(0 0 24px rgba(${char.glow},0.6))">${char.emoji}</div>`;}}
          />
          {/* Inner shine sweep */}
          <div style={{position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",pointerEvents:"none"}}>
            <div style={{position:"absolute",top:0,bottom:0,width:"35%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)",animation:"shineSweep 5s ease-in-out infinite"}}/>
          </div>
        </div>
      </div>
      {firstPlay&&(
        <div style={{position:"absolute",bottom:-40,left:"50%",transform:"translateX(-50%)",fontSize:12,color:`rgb(${char.glow})`,fontWeight:800,whiteSpace:"nowrap",animation:"floatHint 1.5s ease-in-out infinite",textShadow:`0 0 14px rgba(${char.glow},0.7)`,letterSpacing:"0.1em"}}>
          TAP TO EARN 👆
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS TAB (glass) ────────────────────────────────────────────────────
const AVATARS=["🐸","💪","🎩","🧌","🐕","💀","🦊","🐉","🤖","👾","🦁","🐺","🦂","🎭","🔥","💎"];

function SettingsTab({username,solWallet,currentAvatarUrl,onSave}:{username:string;solWallet:string;currentAvatarUrl?:string;onSave:(u:string,w:string,av:string,url?:string)=>void}){
  const {user,signOut}=useAuth();
  const [name,setName]=useState(username);
  const [wallet,setWallet]=useState(solWallet);
  const [avatar,setAvatar]=useState(()=>getAvatar(user?.email||user?.id||"")||"🐸");
  const [avatarUrl,setAvatarUrl]=useState(currentAvatarUrl||"");
  const [uploading,setUploading]=useState(false);
  const [uploadErr,setUploadErr]=useState("");
  const [pwMode,setPwMode]=useState(false);
  const [pwMsg,setPwMsg]=useState("");
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [delConfirm,setDelConfirm]=useState(false);
  const [delText,setDelText]=useState("");

  async function handleAvatarUpload(file:File){
    if(!user?.id)return;
    // Note: avatar upload uses user.id for storage path (UUID required by Supabase storage)
    if(file.size>2*1024*1024){setUploadErr("Image must be under 2MB");return;}
    setUploading(true);setUploadErr("");
    try{
      const{supabase}=await import("@/lib/supabase");
      const ext=file.name.split(".").pop()||"jpg";
      const path=`${user.id}/avatar.${ext}`;
      const{error}=await supabase.storage.from("avatars").upload(path,file,{upsert:true,contentType:file.type});
      if(error)throw error;
      const{data}=supabase.storage.from("avatars").getPublicUrl(path);
      const url=data.publicUrl+"?t="+Date.now(); // cache-bust
      setAvatarUrl(url);
      setUploadErr("✅ Photo uploaded!");
      setTimeout(()=>setUploadErr(""),2500);
    }catch(e:unknown){setUploadErr("Upload failed — try again");}
    setUploading(false);
  }

  async function handleSave(){
    setSaving(true);
    setAvatarStore(avatar, user?.email||user?.id||"");
    onSave(name.trim()||username, wallet.trim(), avatar, avatarUrl||undefined);
    setTimeout(()=>{setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2200);},600);
  }
  async function handleResetPw(){
    if(!user?.email){setPwMsg("No email linked.");return;}
    try{
      const{supabase}=await import("@/lib/supabase");
      await supabase.auth.resetPasswordForEmail(user.email,{redirectTo:window.location.origin+"/login"});
      setPwMsg("✅ Reset email sent to "+user.email);
    }catch{setPwMsg("Failed to send reset email.");}
  }
  async function handleDeleteAccount(){
    if(delText.toLowerCase()!=="delete")return;
    try{
      const{supabase}=await import("@/lib/supabase");
      await supabase.from("dt_players").delete().eq("wallet_address",user?.email||user?.id||"");
      await signOut();
    }catch{await signOut();}
  }

  const card = {background:G.glass,border:`1px solid ${G.border}`,borderRadius:18,padding:"18px 16px",marginBottom:12} as const;
  const label = {color:"#9b8ab8",fontSize:10,fontWeight:700 as const,textTransform:"uppercase" as const,letterSpacing:"0.08em",display:"block" as const,marginBottom:8};
  const input = {width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid rgba(255,255,255,0.1)`,borderRadius:12,color:"#fff",fontSize:14,fontWeight:700 as const,padding:"11px 14px",outline:"none",boxSizing:"border-box" as const,transition:"border 0.2s"};

  return(
    <div style={{minHeight:"100vh",background:G.bg,color:"#e8e8f0",paddingTop:52,paddingBottom:100,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(100,30,180,0.15) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:440,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{textAlign:"center",padding:"28px 0 24px"}}>
          <div style={{
            width:88,height:88,borderRadius:"50%",margin:"0 auto 12px",
            background:`linear-gradient(135deg,rgba(168,85,247,0.15),rgba(168,85,247,0.05))`,
            border:"2px solid rgba(168,85,247,0.3)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:52,lineHeight:1,overflow:"hidden",
            boxShadow:"0 0 30px rgba(168,85,247,0.2)",
          }}>
            {avatarUrl
              ?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setAvatarUrl("")}/>
              :<span>{avatar}</span>
            }
          </div>
          <div style={{color:"#fff",fontWeight:900,fontSize:20,marginBottom:4}}>{name||"Degen"}</div>
          {user?.email&&<div style={{color:"#6b5a8a",fontSize:11}}>{user.email}</div>}
        </div>

        {/* Profile picture upload */}
        <div style={card}>
          <label style={label}>Profile Picture</label>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <label style={{
              display:"inline-flex",alignItems:"center",gap:8,
              background:"linear-gradient(135deg,rgba(168,85,247,0.15),rgba(168,85,247,0.05))",
              border:"1.5px dashed rgba(168,85,247,0.4)",borderRadius:14,
              padding:"10px 16px",cursor:"pointer",color:"#c084fc",fontSize:13,fontWeight:700,
              transition:"all 0.2s",
            }}>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{display:"none"}}
                onChange={e=>{const f=e.target.files?.[0];if(f)handleAvatarUpload(f);e.target.value="";}}/>
              {uploading?"⏳ Uploading…":"📷 Upload Photo"}
            </label>
            {avatarUrl&&<button onClick={()=>setAvatarUrl("")} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,color:"#ef4444",fontSize:11,fontWeight:700,padding:"8px 12px",cursor:"pointer"}}>✕ Remove</button>}
          </div>
          {uploadErr&&<div style={{color:uploadErr.startsWith("✅")?"#22d67a":"#ef4444",fontSize:12,marginTop:8}}>{uploadErr}</div>}
          <div style={{color:"#6b5a8a",fontSize:10,marginTop:6}}>Max 2MB · JPG, PNG, GIF, WEBP</div>
        </div>

        {/* Avatar picker */}
        <div style={card}>
          <label style={label}>{avatarUrl?"Emoji (used when no photo)":"Choose Emoji Avatar"}</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:7}}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setAvatar(a)} style={{
                fontSize:26,background:avatar===a?"rgba(168,85,247,0.2)":"rgba(255,255,255,0.03)",
                border:avatar===a?"2px solid rgba(168,85,247,0.6)":"2px solid transparent",
                borderRadius:10,padding:5,cursor:"pointer",lineHeight:1,
                transition:"all 0.15s",boxShadow:avatar===a?"0 0 10px rgba(168,85,247,0.3)":"none",
              }}>{a}</button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div style={card}>
          <label style={label}>Username</label>
          <input value={name} onChange={e=>setName(e.target.value)} maxLength={24} placeholder="Your display name" style={input}/>
        </div>

        {/* Wallet */}
        <div style={card}>
          <label style={label}>Solana Wallet Address</label>
          <div style={{color:"#6b5a8a",fontSize:10,marginBottom:8}}>Required for prize payouts</div>
          <input value={wallet} onChange={e=>setWallet(e.target.value)} placeholder="Your Solana wallet address"
            style={{...input,color:"#22d67a",fontSize:12,fontFamily:"monospace"}}/>
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving} style={{
          width:"100%",
          background:saved?"linear-gradient(135deg,#166534,#22d67a)":"linear-gradient(135deg,#6d28d9,#a855f7)",
          color:"#fff",fontWeight:900,fontSize:15,border:"none",borderRadius:16,
          padding:"15px",cursor:"pointer",marginBottom:14,
          boxShadow:saved?"0 0 30px rgba(34,214,122,0.3)":"0 0 30px rgba(168,85,247,0.3)",
          transition:"background 0.3s,box-shadow 0.3s",
        }}>{saving?"Saving…":saved?"✅ Saved!":"Save Changes"}</button>

        <div style={{borderTop:`1px solid ${G.border}`,margin:"4px 0 14px"}}/>

        {/* Password */}
        <div style={card}>
          <label style={label}>Password</label>
          {!pwMode
            ?<button onClick={()=>setPwMode(true)} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${G.border}`,borderRadius:12,color:"#ccc",fontSize:13,fontWeight:700,padding:"11px",cursor:"pointer"}}>Change Password</button>
            :<div>
              <p style={{color:"#4a2d68",fontSize:12,marginBottom:12,lineHeight:1.5}}>We'll send a reset link to:<br/><strong style={{color:"#7c4ab0"}}>{user?.email||"—"}</strong></p>
              <button onClick={handleResetPw} style={{width:"100%",background:G.purpleDim,border:`1px solid rgba(168,85,247,0.3)`,borderRadius:12,color:"#c084fc",fontSize:13,fontWeight:700,padding:"11px",cursor:"pointer"}}>Send Reset Email</button>
              {pwMsg&&<div style={{color:pwMsg.startsWith("✅")?"#22d67a":"#ef4444",fontSize:12,marginTop:8,textAlign:"center"}}>{pwMsg}</div>}
            </div>
          }
        </div>

        {/* Log out */}
        <button onClick={signOut} style={{width:"100%",background:G.glass,border:`1px solid ${G.border}`,color:"#888",fontWeight:700,fontSize:14,borderRadius:16,padding:"14px",cursor:"pointer",marginBottom:12}}>Log Out</button>

        {/* Danger zone */}
        <div style={{background:"rgba(239,68,68,0.03)",border:"1px solid rgba(239,68,68,0.12)",borderRadius:18,padding:"18px 16px",marginBottom:16}}>
          <div style={{color:"#ef4444",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>⚠️ Danger Zone</div>
          {!delConfirm
            ?<button onClick={()=>setDelConfirm(true)} style={{width:"100%",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,color:"#ef4444",fontSize:13,fontWeight:700,padding:"11px",cursor:"pointer"}}>Delete Account</button>
            :<div>
              <p style={{color:"#7a3333",fontSize:12,marginBottom:10,lineHeight:1.5}}>This permanently deletes your account and all data. Type <strong>delete</strong> to confirm.</p>
              <input value={delText} onChange={e=>setDelText(e.target.value)} placeholder="Type delete to confirm"
                style={{...input,color:"#ef4444",border:"1px solid rgba(239,68,68,0.25)",marginBottom:10}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setDelConfirm(false);setDelText("");}} style={{flex:1,background:G.glass,border:`1px solid ${G.border}`,borderRadius:12,color:"#888",fontSize:13,fontWeight:700,padding:"10px",cursor:"pointer"}}>Cancel</button>
                <button onClick={handleDeleteAccount} disabled={delText.toLowerCase()!=="delete"} style={{flex:1,background:delText.toLowerCase()==="delete"?"rgba(239,68,68,0.8)":"rgba(239,68,68,0.12)",border:"none",borderRadius:12,color:"#fff",fontSize:13,fontWeight:700,padding:"10px",cursor:delText.toLowerCase()==="delete"?"pointer":"not-allowed",transition:"background 0.2s"}}>Delete Forever</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── ONLINE STRIP ─────────────────────────────────────────────────────────────
function OnlineStrip(){
  const CE:Record<string,string>={pepe:"🐸",gigachad:"💪",trump:"🎩",troll:"🧌",bonk:"🐕"};
  const [online,setOnline]=useState<LBEntry[]>([]);
  const [ts,setTs]=useState(0);

  useEffect(()=>{
    async function fetch(){
      try{
        const{supabase}=await import("@/lib/supabase");
        const cutoff=new Date(Date.now()-3*60*1000).toISOString();
        const{data}=await supabase.from("dt_players").select("id,wallet_address,username,character,avatar_url,last_seen,games_played").gte("last_seen",cutoff).order("last_seen",{ascending:false}).limit(50);
        setOnline((data||[]) as LBEntry[]);
        setTs(Date.now());
      }catch{}
    }
    fetch();
    const id=setInterval(fetch,15000);
    return()=>clearInterval(id);
  },[]);

  if(online.length===0)return null;

  return(
    <div style={{margin:"0 -16px",padding:"0 16px 4px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:"#22d67a",display:"inline-block",boxShadow:"0 0 6px #22d67a"}}/>
        <span style={{color:"#22d67a",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>Online Now</span>
        <span style={{color:"#3a3a4a",fontSize:11,fontWeight:700,marginLeft:2}}>{online.length}</span>
      </div>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none",WebkitOverflowScrolling:"touch"} as React.CSSProperties}>
        {online.map(p=>{
          const ago=p.last_seen?Math.floor((Date.now()-new Date(p.last_seen).getTime())/1000):999;
          const online_now=ago<90;
          return(
            <div key={p.id} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:60}}>
              <div style={{position:"relative",width:44,height:44}}>
                <div style={{width:44,height:44,borderRadius:"50%",border:`2px solid ${online_now?"rgba(34,214,122,0.5)":"rgba(255,255,255,0.08)"}`,overflow:"hidden",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                  {p.avatar_url
                    ?<img src={p.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>{}}/>
                    :<span>{CE[p.character]||"🎮"}</span>
                  }
                </div>
                <span style={{position:"absolute",bottom:1,right:1,width:11,height:11,borderRadius:"50%",background:online_now?"#22d67a":"#555",border:"2px solid #0d0d1a",boxShadow:online_now?"0 0 6px #22d67a":""}}/>
              </div>
              <span style={{color:"#aaa",fontSize:9,fontWeight:600,maxWidth:58,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center"}}>{p.username||"Degen"}</span>
              <span style={{color:online_now?"#22d67a":"#555",fontSize:8,fontWeight:700}}>{online_now?"online":ago<3600?`${Math.floor(ago/60)}m ago`:"offline"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REFERRAL CARD ───────────────────────────────────────────────────────────
const REF_REWARD=100000;
function ReferralCard({playerId,onClaim}:{playerId:string;onClaim:(reward:number,count:number)=>void;}){
  const [invites,setInvites]=useState(0);
  const [claimedCount,setClaimedCount]=useState(0);
  const [copied,setCopied]=useState(false);
  const link=typeof window!=="undefined"?`${window.location.origin}/game?ref=${encodeURIComponent(playerId)}`:"";
  useEffect(()=>{
    if(!playerId)return;
    try{setClaimedCount(parseInt(localStorage.getItem(`degen_ref_claimed_${playerId}`)||"0",10)||0);}catch{}
    (async()=>{
      try{
        const {supabase}=await import("@/lib/supabase");
        const {count}=await supabase.from("dt_security_events").select("id",{count:"exact",head:true})
          .eq("event_type","referral").eq("player_id",playerId);
        setInvites(count||0);
      }catch{}
    })();
  },[playerId]);
  const unclaimed=Math.max(0,invites-claimedCount);
  const copy=()=>{ try{navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),1500);}catch{} };
  const claim=()=>{
    if(unclaimed<=0)return;
    const nc=claimedCount+unclaimed;
    setClaimedCount(nc);
    try{localStorage.setItem(`degen_ref_claimed_${playerId}`,String(nc));}catch{}
    onClaim(unclaimed*REF_REWARD,unclaimed);
  };
  return(
    <div style={{background:"linear-gradient(135deg,rgba(34,214,122,0.08),rgba(96,165,250,0.04))",border:"1px solid rgba(34,214,122,0.2)",borderRadius:20,padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:20}}>🤝</span>
        <div style={{color:"#fff",fontWeight:900,flex:1}}>Invite friends</div>
        <span style={{background:"rgba(34,214,122,0.12)",border:"1px solid rgba(34,214,122,0.25)",borderRadius:999,color:"#7ef2b1",fontSize:10.5,fontWeight:900,padding:"4px 10px"}}>{invites} joined</span>
      </div>
      <div style={{color:"#a794c3",fontSize:11.5,lineHeight:1.55,marginBottom:10}}>Earn <b style={{color:"#f5c842"}}>+{fmt(REF_REWARD)}</b> coins for every friend who joins with your link. They get a <b style={{color:"#7ef2b1"}}>+50K</b> welcome bonus.</div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1,minWidth:0,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 12px",color:"#93c5fd",fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link}</div>
        <button onClick={copy} className="press-fx" style={{background:copied?"rgba(34,214,122,0.18)":"linear-gradient(135deg,#60a5fa,#3b82f6)",border:"none",borderRadius:12,color:"#fff",fontWeight:900,fontSize:12,padding:"10px 14px",cursor:"pointer",whiteSpace:"nowrap"}}>{copied?"✓ Copied":"Copy"}</button>
      </div>
      {unclaimed>0&&(
        <button onClick={claim} className="press-fx" style={{width:"100%",marginTop:10,background:"linear-gradient(135deg,#f5c842,#f59e0b)",border:"none",borderRadius:12,color:"#1a0f00",fontWeight:900,fontSize:13,padding:"11px 0",cursor:"pointer",boxShadow:"0 4px 18px rgba(245,200,66,0.3)"}}>
          🎁 Claim {fmt(unclaimed*REF_REWARD)} coins ({unclaimed} new invite{unclaimed>1?"s":""})
        </button>
      )}
    </div>
  );
}

function ProfileTab({playerId,username,avatar,avatarUrl,solWallet,charId,totalEarned,totalTaps,coins,level,rank,nextRank,upgrades,achievCount,onOpenSettings,onClaimRef,onAscend}:{playerId:string;username:string;avatar:string;avatarUrl?:string;solWallet:string;charId:string|null;totalEarned:number;totalTaps:number;coins:number;level:number;rank:ReturnType<typeof getRankFromLevel>;nextRank:ReturnType<typeof getNextRank>;upgrades:Record<string,number>;achievCount:number;onOpenSettings:()=>void;onClaimRef:(reward:number,count:number)=>void;onAscend:()=>void;}){
  const mp=useMemo(()=>loadMpProfileStats(playerId),[playerId]);
  const stars=upgrades["prestige_stars"]||0;
  const isChamp=(upgrades["badge_tour_champ"]||0)>0;
  const canAscend=totalEarned>=100_000_000;
  const ascendGain=Math.max(1,Math.floor(Math.sqrt(totalEarned/100_000_000)));
  const [confirmAscend,setConfirmAscend]=useState(false);
  const fighter=CHARACTERS.find(c=>c.id===charId);
  const stats=[
    {label:"Coins",value:fmt(coins),color:G.gold},
    {label:"Lifetime Earned",value:fmt(totalEarned),color:"#22d67a"},
    {label:"Total Taps",value:fmt(totalTaps),color:"#c084fc"},
    {label:"Upgrade Levels",value:fmt(totalUpgradeLevels(upgrades)),color:"#60a5fa"},
    {label:"PvP Wins",value:fmt(mp.wins),color:"#f87171"},
    {label:"Ladder",value:fmt(mp.ladder),color:"#f5c842"},
  ];
  return <div style={{minHeight:"100vh",padding:"76px 16px 110px",background:G.bg,position:"relative"}}><div className="arcade-grid"/><div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}><div style={{background:isChamp?"linear-gradient(160deg,rgba(245,200,66,0.22),rgba(245,158,11,0.08) 60%,rgba(255,255,255,0.02))":"linear-gradient(160deg,rgba(168,85,247,0.18),rgba(96,165,250,0.08) 60%,rgba(255,255,255,0.02))",border:isChamp?"1.5px solid rgba(245,200,66,0.5)":"1px solid rgba(168,85,247,0.22)",borderRadius:28,padding:"18px 18px 20px",boxShadow:isChamp?"0 20px 50px rgba(0,0,0,0.32), 0 0 40px rgba(245,200,66,0.18)":"0 20px 50px rgba(0,0,0,0.32)"}}><div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}><div style={{width:78,height:78,borderRadius:"50%",overflow:"hidden",background:"radial-gradient(circle at 50% 30%,rgba(168,85,247,0.25),rgba(6,0,15,0.95))",border:"2px solid rgba(192,132,252,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,boxShadow:"0 0 30px rgba(168,85,247,0.25)"}}>{avatarUrl?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{avatar||"🐸"}</span>}</div><div style={{flex:1,minWidth:0}}><div style={{color:"#c084fc",fontSize:10,fontWeight:900,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>Player Profile</div><div style={{color:"#fff",fontWeight:900,fontSize:26,letterSpacing:"-0.03em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username||"Degen"}</div><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginTop:8}}><span style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:999,padding:"5px 10px",color:rank.color,fontWeight:900,fontSize:11}}>{rank.emoji} {rank.name}</span><span style={{background:"rgba(34,214,122,0.08)",border:"1px solid rgba(34,214,122,0.18)",borderRadius:999,padding:"5px 10px",color:"#7ef2b1",fontWeight:800,fontSize:11}}>Level {level}</span>{isChamp&&<span style={{background:"rgba(245,200,66,0.12)",border:"1px solid rgba(245,200,66,0.4)",borderRadius:999,padding:"5px 10px",color:"#f5c842",fontWeight:900,fontSize:11,boxShadow:"0 0 14px rgba(245,200,66,0.3)"}}>👑 Champion</span>}<span style={{background:"rgba(96,165,250,0.08)",border:"1px solid rgba(96,165,250,0.18)",borderRadius:999,padding:"5px 10px",color:"#93c5fd",fontWeight:800,fontSize:11}}>{achievCount} achievements</span></div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:12}}><div style={{color:"#7f6c97",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Equipped Fighter</div><div style={{color:"#fff",fontWeight:900,fontSize:15}}>{fighter?`${fighter.emoji} ${fighter.name}`:"No fighter selected"}</div><div style={{color:"#8f7ca7",fontSize:11,marginTop:4}}>{fighter?.ability||"Choose a legend in Play"}</div></div><div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:12}}><div style={{color:"#7f6c97",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Wallet</div><div style={{color:"#22d67a",fontWeight:900,fontSize:14,wordBreak:"break-all"}}>{maskWallet(solWallet)}</div><div style={{color:"#8f7ca7",fontSize:11,marginTop:4}}>Admin shows email + username. App shows username only.</div></div></div><div style={{height:10,background:"rgba(255,255,255,0.05)",borderRadius:999,overflow:"hidden",marginBottom:8,border:"1px solid rgba(255,255,255,0.04)"}}><div style={{height:"100%",width:`${Math.min(100,(level%10)*10)}%`,background:`linear-gradient(90deg,${rank.color}77,${rank.color})`,boxShadow:`0 0 16px ${rank.color}66`}}/></div><div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{color:"#8f7ca7",fontSize:11}}>Current rank: {rank.name}</span><span style={{color:nextRank?.color||"#8f7ca7",fontSize:11}}>Next: {nextRank?`${nextRank.emoji} ${nextRank.name}`:"MAX"}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{stats.map(s=><div key={s.label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"12px 10px"}}><div style={{color:s.color,fontWeight:900,fontSize:17}}>{s.value}</div><div style={{color:"#7f6c97",fontSize:10.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</div></div>)}</div></div><div style={{display:"grid",gap:12,marginTop:14}}>
  {/* Ascension / prestige card */}
  <div style={{background:canAscend?"linear-gradient(135deg,rgba(245,200,66,0.12),rgba(168,85,247,0.08))":"rgba(255,255,255,0.03)",border:`1px solid ${canAscend?"rgba(245,200,66,0.35)":"rgba(255,255,255,0.06)"}`,borderRadius:20,padding:14,boxShadow:canAscend?"0 0 30px rgba(245,200,66,0.12)":"none"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
      <span style={{fontSize:20}}>🌟</span>
      <div style={{color:"#fff",fontWeight:900,flex:1}}>Ascension</div>
      <span style={{background:"rgba(245,200,66,0.12)",border:"1px solid rgba(245,200,66,0.3)",borderRadius:999,color:"#f5c842",fontSize:10.5,fontWeight:900,padding:"4px 10px"}}>{stars} ⭐ (+{stars*50}% income)</span>
    </div>
    <div style={{color:"#a794c3",fontSize:11.5,lineHeight:1.55,marginBottom:10}}>
      Reach <b style={{color:"#f5c842"}}>100M lifetime earned</b> to ascend. Resets coins & upgrades but grants permanent <b style={{color:"#f5c842"}}>⭐ stars: +50% income each, forever</b>.
      {canAscend?<> Ready now: <b style={{color:"#7ef2b1"}}>+{ascendGain} ⭐</b></>:<> Progress: <b style={{color:"#fff"}}>{fmt(totalEarned)}</b> / 100M</>}
    </div>
    {!confirmAscend?(
      <button disabled={!canAscend} onClick={()=>setConfirmAscend(true)} className="press-fx" style={{width:"100%",background:canAscend?"linear-gradient(135deg,#f5c842,#a855f7)":"rgba(255,255,255,0.05)",border:"none",borderRadius:12,color:canAscend?"#fff":"#556",fontWeight:900,fontSize:13,padding:"12px 0",cursor:canAscend?"pointer":"default"}}>
        {canAscend?`🌟 Ascend for +${ascendGain} star${ascendGain>1?"s":""}`:"🔒 Locked — earn 100M first"}
      </button>
    ):(
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{setConfirmAscend(false);onAscend();}} className="press-fx" style={{flex:1,background:"linear-gradient(135deg,#f5c842,#f59e0b)",border:"none",borderRadius:12,color:"#1a0f00",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:"pointer"}}>✅ Confirm — reset & ascend</button>
        <button onClick={()=>setConfirmAscend(false)} className="press-fx" style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#aaa",fontWeight:800,fontSize:12.5,padding:"12px 0",cursor:"pointer"}}>Cancel</button>
      </div>
    )}
  </div>
  {TOUR_BADGES.some(b=>(upgrades[b.key]||0)>0)&&(
    <div style={{background:"linear-gradient(135deg,rgba(245,200,66,0.10),rgba(168,85,247,0.05))",border:"1px solid rgba(245,200,66,0.25)",borderRadius:20,padding:14}}>
      <div style={{color:"#fff",fontWeight:900,marginBottom:10}}>🎖 Tournament badges</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {TOUR_BADGES.filter(b=>(upgrades[b.key]||0)>0).map(b=>(
          <span key={b.key} style={{display:"inline-flex",alignItems:"center",gap:6,background:`${b.color}1a`,border:`1px solid ${b.color}55`,borderRadius:999,color:b.color,fontSize:11.5,fontWeight:900,padding:"6px 12px",boxShadow:`0 0 14px ${b.color}33`}}>
            {b.emoji} {b.label}{(upgrades[b.key]||0)>1&&` ×${upgrades[b.key]}`}
          </span>
        ))}
      </div>
      {(upgrades["badge_tour_champ"]||0)>0&&<div style={{marginTop:10,color:"#f5c842",fontSize:11,fontWeight:800}}>✨ GOLD champion theme active — your profile glows gold</div>}
    </div>
  )}
  <ReferralCard playerId={playerId} onClaim={onClaimRef}/><div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:14}}><div style={{color:"#fff",fontWeight:900,marginBottom:8}}>PvP snapshot</div><div style={{color:"#a794c3",fontSize:11.5,lineHeight:1.65}}>Wins: <b style={{color:'#fff'}}>{mp.wins}</b> · Losses: <b style={{color:'#fff'}}>{mp.losses}</b> · Draws: <b style={{color:'#fff'}}>{mp.draws}</b><br/>Best streak: <b style={{color:'#fff'}}>{mp.bestStreak}</b> · MMR: <b style={{color:'#fff'}}>{mp.mmr}</b> · Season points: <b style={{color:'#fff'}}>{mp.seasonPoints}</b></div></div><button onClick={onOpenSettings} className="press-fx" style={{background:"linear-gradient(135deg,rgba(168,85,247,0.92),rgba(96,165,250,0.75))",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,color:"#fff",fontWeight:900,fontSize:14,padding:"14px 16px",cursor:"pointer",boxShadow:"0 12px 26px rgba(96,165,250,0.18)"}}>Customize profile</button></div></div></div>;
}

function MissionsTab({playerId,totalTaps,totalEarned,upgrades,charId,onClaim}:{playerId:string;totalTaps:number;totalEarned:number;upgrades:Record<string,number>;charId:string|null;onClaim:(id:string,reward:number)=>void;}){
  const [claimed,setClaimed]=useState<Record<string,boolean>>({});
  const mp=useMemo(()=>loadMpProfileStats(playerId),[playerId]);
  const [adminMissions,setAdminMissions]=useState<{id:string;title:string;desc:string;reward:number;category:string}[]>([]);
  useEffect(()=>{ if(typeof window==="undefined"||!playerId)return; try{setClaimed(JSON.parse(localStorage.getItem(`degen_missions_${playerId}`)||"{}"));}catch{} },[playerId]);
  useEffect(()=>{
    (async()=>{
      try{
        const {supabase}=await import("@/lib/supabase");
        const {data}=await supabase.from("dt_security_events").select("id,data")
          .eq("event_type","admin_task").eq("player_id","__admin_task__").order("created_at",{ascending:false}).limit(100);
        type T={id:string;data:{title?:string;description?:string;status?:string;reward?:string;category?:string}};
        const rows=((data||[]) as T[]).filter(t=>t.data?.status==="active"&&t.data?.title);
        setAdminMissions(rows.map(t=>({
          id:`admin_${t.id}`,title:t.data.title||"",desc:t.data.description||"Complete this mission",
          reward:Math.max(0,parseInt((t.data.reward||"").replace(/[^0-9]/g,""),10)||0),category:t.data.category||"event",
        })).filter(m=>m.reward>0));
      }catch{}
    })();
  },[playerId]);
  const missions=[{id:"tap_1k",title:"Finger Warmup",desc:"Reach 1,000 taps",progress:totalTaps,target:1000,reward:15000,color:"#c084fc"},{id:"tap_100k",title:"Tower Maniac",desc:"Reach 100,000 taps",progress:totalTaps,target:100000,reward:500000,color:"#a855f7"},{id:"earn_1m",title:"First Million",desc:"Earn 1M total coins",progress:totalEarned,target:1_000_000,reward:200000,color:"#22d67a"},{id:"upgrade_25",title:"Build the Machine",desc:"Buy 25 upgrade levels",progress:totalUpgradeLevels(upgrades),target:25,reward:300000,color:"#60a5fa"},{id:"pvp_3",title:"Arena Rookie",desc:"Win 3 PvP matches",progress:mp.wins,target:3,reward:750000,color:"#f87171"},{id:"legend_pick",title:"Choose Your Legend",desc:"Equip any fighter",progress:charId?1:0,target:1,reward:25000,color:"#f5c842"}];
  const doClaim=(id:string,reward:number)=>{ const next={...claimed,[id]:true}; setClaimed(next); try{localStorage.setItem(`degen_missions_${playerId}`,JSON.stringify(next));}catch{}; onClaim(id,reward); };
  return <div style={{minHeight:"100vh",padding:"76px 16px 110px",background:G.bg,position:"relative"}}><div className="arcade-grid"/><div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}><div style={{marginBottom:14}}><div style={{color:"#c084fc",fontSize:10,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Mission Control</div><div style={{color:"#fff",fontWeight:900,fontSize:26,letterSpacing:"-0.03em",marginBottom:6}}>Live quests</div><div style={{color:"#8f7ca7",fontSize:12.5,lineHeight:1.6}}>Now the platform has an actual task loop, not just raw tapping. Finish missions and cash rewards instantly.</div></div>{adminMissions.length>0&&<div style={{marginBottom:14}}><div style={{color:"#f5c842",fontSize:10,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>⭐ Event missions</div><div style={{display:"grid",gap:10}}>{adminMissions.map(m=>{ const wasClaimed=!!claimed[m.id]; return <div key={m.id} className={wasClaimed?"":"shine-card"} style={{background:wasClaimed?"rgba(255,255,255,0.03)":"linear-gradient(135deg,rgba(245,200,66,0.10),rgba(168,85,247,0.06))",border:wasClaimed?"1px solid rgba(255,255,255,0.06)":"1.5px solid rgba(245,200,66,0.32)",borderRadius:20,padding:14}}><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}><div style={{flex:1,minWidth:0}}><div style={{color:"#f5c842",fontSize:11,fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>{m.category}</div><div style={{color:"#fff",fontWeight:800,fontSize:13.5,marginBottom:4}}>{m.title}</div><div style={{color:"#8f7ca7",fontSize:11.5,lineHeight:1.5}}>{m.desc}</div></div><div style={{color:wasClaimed?"#22d67a":"#f5c842",fontWeight:900,fontSize:12,whiteSpace:"nowrap"}}>{wasClaimed?"CLAIMED":`💰 ${fmt(m.reward)}`}</div></div>{!wasClaimed&&<button onClick={()=>doClaim(m.id,m.reward)} className="press-fx" style={{width:"100%",background:"linear-gradient(135deg,#f5c842,#f59e0b)",border:"none",borderRadius:12,color:"#1a0f00",fontWeight:900,fontSize:12.5,padding:"11px 0",cursor:"pointer",boxShadow:"0 4px 18px rgba(245,200,66,0.25)"}}>Claim {fmt(m.reward)} coins</button>}</div>; })}</div></div>}<div style={{display:"grid",gap:10}}>{missions.map(m=>{ const pct=Math.max(0,Math.min(100,(m.progress/m.target)*100)); const done=m.progress>=m.target; const wasClaimed=!!claimed[m.id]; return <div key={m.id} style={{background:done&&!wasClaimed?"linear-gradient(135deg,rgba(34,214,122,0.1),rgba(168,85,247,0.08))":"rgba(255,255,255,0.03)",border:done&&!wasClaimed?"1px solid rgba(34,214,122,0.28)":"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:14}}><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}><div><div style={{color:m.color,fontSize:11,fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>{m.title}</div><div style={{color:"#fff",fontWeight:800,fontSize:13.5,marginBottom:4}}>{m.desc}</div><div style={{color:"#8f7ca7",fontSize:11}}>Reward: 💰 {fmt(m.reward)}</div></div><div style={{color:done?"#22d67a":"#b6a2cf",fontWeight:900,fontSize:12}}>{wasClaimed?"CLAIMED":done?"READY":"IN PROGRESS"}</div></div><div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:999,overflow:"hidden",border:"1px solid rgba(255,255,255,0.04)",marginBottom:8}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${m.color}99,${m.color})`,boxShadow:`0 0 12px ${m.color}55`}}/></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:"#8f7ca7",fontSize:11}}>{fmt(m.progress)} / {fmt(m.target)}</div>{done&&!wasClaimed?<button onClick={()=>doClaim(m.id,m.reward)} style={{background:"linear-gradient(135deg,#22d67a,#16a34a)",border:"none",borderRadius:12,color:"#fff",fontWeight:900,padding:"9px 12px",cursor:"pointer"}}>Claim reward</button>:<div style={{color:wasClaimed?"#22d67a":"#6d5a86",fontSize:11.5,fontWeight:700}}>{wasClaimed?"Reward secured":"Keep grinding"}</div>}</div></div>; })}</div><div style={{marginTop:14,background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.14)",borderRadius:18,padding:14,color:"#b6c8e6",fontSize:11.5,lineHeight:1.6}}>More mission categories are now easy to add here later: daily streaks, clan orders, raid tasks, event tickets, ranked objectives, and seasonal ladders.</div></div></div>;
}

function AchievementsTab({achievSet,totalTaps,coins}:{achievSet:Set<string>;totalTaps:number;coins:number;}){
  const items=[{id:"first_tap",title:"First Tap",desc:"Land your first tap"},{id:"taps_100",title:"100 Taps",desc:"Hit 100 taps"},{id:"taps_1000",title:"1,000 Taps",desc:"Hit 1,000 taps"},{id:"taps_10k",title:"10K Grinder",desc:"Hit 10,000 taps"},{id:"coins_100k",title:"Stack Starter",desc:"Earn 100K coins"},{id:"coins_1m",title:"Millionaire",desc:"Earn 1M coins"},{id:"coins_1b_live",title:"Whale Energy",desc:"Hold 1B coins live",live:coins>=1_000_000_000},{id:"taps_1m_live",title:"Tap Monster",desc:"Reach 1M lifetime taps",live:totalTaps>=1_000_000}];
  return <div style={{minHeight:"100vh",padding:"76px 16px 110px",background:G.bg,position:"relative"}}><div className="arcade-grid"/><div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}><div style={{marginBottom:14}}><div style={{color:"#c084fc",fontSize:10,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Achievement Hall</div><div style={{color:"#fff",fontWeight:900,fontSize:26,letterSpacing:"-0.03em",marginBottom:6}}>Your flex board</div><div style={{color:"#8f7ca7",fontSize:12.5,lineHeight:1.6}}>This gives players another reason to grind besides raw score. Unlocked achievements now have their own surface.</div></div><div style={{display:"grid",gap:10}}>{items.map((a)=>{ const unlocked=achievSet.has(a.id) || !!a.live; return <div key={a.id} style={{background:unlocked?"linear-gradient(135deg,rgba(245,200,66,0.11),rgba(168,85,247,0.07))":"rgba(255,255,255,0.03)",border:unlocked?"1px solid rgba(245,200,66,0.24)":"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:14,display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:unlocked?"rgba(245,200,66,0.12)":"rgba(255,255,255,0.04)",fontSize:22}}>{unlocked?"🏅":"🔒"}</div><div style={{flex:1}}><div style={{color:unlocked?"#f5c842":"#fff",fontWeight:900,fontSize:13.5}}>{a.title}</div><div style={{color:"#8f7ca7",fontSize:11.5,lineHeight:1.5}}>{a.desc}</div></div><div style={{color:unlocked?"#22d67a":"#6d5a86",fontSize:10.5,fontWeight:900,letterSpacing:"0.08em"}}>{unlocked?"UNLOCKED":"LOCKED"}</div></div>; })}</div><div style={{marginTop:14,background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.14)",borderRadius:18,padding:14,color:"#b6a2cf",fontSize:11.5,lineHeight:1.6}}>Next easy expansion: rare hidden achievements, seasonal badges, clan achievements, PvP mastery medals, and profile showcase slots.</div></div></div>;
}

// ─── DAILY STREAK CHEST ──────────────────────────────────────────────────────
const STREAK_REWARDS=[10000,25000,50000,100000,200000,400000,1000000]; // day 1..7+, day7 repeats
function dayKey(d:Date){return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function DailyStreakCard({playerId,level,onClaim}:{playerId:string;level:number;onClaim:(reward:number,streak:number)=>void;}){
  const storageKey=`degen_daily_${playerId}`;
  const [state,setState]=useState<{streak:number;last:string}>({streak:0,last:""});
  const [justClaimed,setJustClaimed]=useState(false);
  useEffect(()=>{ try{const raw=localStorage.getItem(storageKey); if(raw)setState(JSON.parse(raw));}catch{} },[storageKey]);
  const today=dayKey(new Date());
  const yesterday=dayKey(new Date(Date.now()-86400000));
  const claimedToday=state.last===today;
  const effectiveStreak=state.last===today?state.streak:(state.last===yesterday?state.streak:0);
  const nextStreak=claimedToday?state.streak:effectiveStreak+1;
  const baseReward=STREAK_REWARDS[Math.min(nextStreak-1,6)];
  const reward=Math.round(baseReward*(1+level*0.1));
  const claim=()=>{
    if(claimedToday)return;
    const ns={streak:nextStreak,last:today};
    setState(ns);
    try{localStorage.setItem(storageKey,JSON.stringify(ns));}catch{}
    setJustClaimed(true);
    onClaim(reward,nextStreak);
  };
  return(
    <div className="anim-slideup shine-card" style={{
      background:claimedToday?"linear-gradient(135deg,rgba(34,214,122,0.06),rgba(34,214,122,0.02))":"linear-gradient(135deg,rgba(245,200,66,0.12),rgba(245,160,30,0.04))",
      border:`1.5px solid ${claimedToday?"rgba(34,214,122,0.25)":"rgba(245,200,66,0.4)"}`,
      borderRadius:20,padding:"14px 16px",marginBottom:12,
      boxShadow:claimedToday?"none":"0 0 30px rgba(245,200,66,0.12)",
      display:"flex",alignItems:"center",gap:14,animationDelay:"0.16s",
    }}>
      <div style={{fontSize:36,filter:claimedToday?"grayscale(0.6)":"drop-shadow(0 0 12px rgba(245,200,66,0.7))",animation:claimedToday?"none":"charFloat 2.4s ease-in-out infinite"}}>{claimedToday?"✅":"🎁"}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"#fff",fontWeight:900,fontSize:14,marginBottom:2}}>Daily Chest {justClaimed&&"— claimed!"}</div>
        <div style={{color:"#8a7aa8",fontSize:11,fontWeight:600}}>
          {claimedToday?`🔥 ${state.streak}-day streak · come back tomorrow`:`🔥 Streak ${effectiveStreak} → ${nextStreak} · +${fmt(reward)} coins`}
        </div>
        <div style={{display:"flex",gap:3,marginTop:6}}>
          {Array.from({length:7}).map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<((claimedToday?state.streak:effectiveStreak)%7||((claimedToday?state.streak:effectiveStreak)>0&&(claimedToday?state.streak:effectiveStreak)%7===0?7:0))?"linear-gradient(90deg,#f5c842,#f59e0b)":"rgba(255,255,255,0.07)"}}/>
          ))}
        </div>
      </div>
      <button onClick={claim} disabled={claimedToday} style={{
        background:claimedToday?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#f5c842,#f59e0b)",
        border:"none",borderRadius:12,color:claimedToday?"#556":"#1a0f00",
        fontWeight:900,fontSize:12,padding:"10px 16px",cursor:claimedToday?"default":"pointer",
        boxShadow:claimedToday?"none":"0 4px 18px rgba(245,200,66,0.35)",whiteSpace:"nowrap",
      }}>{claimedToday?"Done":"Open"}</button>
    </div>
  );
}

// ─── WHEEL OF FORTUNE ────────────────────────────────────────────────────────
// ─── DEGEN CASINO ─────────────────────────────────────────────────────────────
function CasinoCard({coins,onResult}:{coins:number;onResult:(delta:number,msg:string)=>void;}){
  const [game,setGame]=useState<"flip"|"dice"|"moon">("flip");
  const [bet,setBet]=useState(10000);
  const [busy,setBusy]=useState(false);
  const [last,setLast]=useState<{win:boolean;text:string}|null>(null);
  const [anim,setAnim]=useState("");
  const canBet=bet>0&&bet<=coins&&!busy;
  const play=(pick?:string)=>{
    if(!canBet)return;
    setBusy(true);setLast(null);
    setAnim(game==="flip"?"🪙":game==="dice"?"🎲":"🚀");
    setTimeout(()=>{
      let win=false,mult=0,text="";
      if(game==="flip"){
        const side=Math.random()<0.5?"heads":"tails";
        win=side===pick;mult=2;
        text=win?`${side.toUpperCase()}! You called it 🔥`:`${side.toUpperCase()} — wrong call 💀`;
      }else if(game==="dice"){
        const roll=1+Math.floor(Math.random()*6);
        win=pick==="high"?roll>=4:roll<=3;mult=2;
        text=win?`Rolled ${roll} — winner! 🎲`:`Rolled ${roll} — busted 💀`;
      }else{
        const r=Math.random();
        if(r<0.05){win=true;mult=10;text="🌕 FULL MOON! 10× payout!!";}
        else if(r<0.20){win=true;mult=3;text="🚀 Lift-off! 3× payout!";}
        else{text="💥 Rocket exploded on the pad";}
      }
      const delta=win?bet*(mult-1):-bet;
      setLast({win,text});setAnim("");setBusy(false);
      onResult(delta,text);
    },1400);
  };
  const bets=[10000,100000,1000000,10000000];
  return(
    <div className="shine-card" style={{background:"linear-gradient(135deg,rgba(248,113,113,0.10),rgba(245,200,66,0.06))",border:"1.5px solid rgba(248,113,113,0.3)",borderRadius:20,padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:20}}>🎰</span>
        <div style={{flex:1}}>
          <div style={{color:"#fff",fontWeight:900,fontSize:14}}>Degen Casino</div>
          <div style={{color:"#8f7ca7",fontSize:10.5}}>Bet your coins. Win big or go home.</div>
        </div>
        <span style={{background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:999,color:"#fca5a5",fontSize:9.5,fontWeight:900,padding:"4px 10px"}}>18+ DEGEN ONLY</span>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {([["flip","🪙 Coinflip"],["dice","🎲 Dice"],["moon","🚀 Moonshot"]] as const).map(([id,label])=>(
          <button key={id} onClick={()=>{setGame(id);setLast(null);}} className="press-fx" style={{flex:1,background:game===id?"linear-gradient(135deg,#f87171,#f5c842)":"rgba(255,255,255,0.04)",border:game===id?"none":"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:game===id?"#1a0f00":"#8f7ca7",fontWeight:900,fontSize:11,padding:"8px 0",cursor:"pointer"}}>{label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {bets.map(b=>(
          <button key={b} onClick={()=>setBet(b)} disabled={b>coins} className="press-fx" style={{flex:1,background:bet===b?"rgba(245,200,66,0.15)":"rgba(255,255,255,0.03)",border:bet===b?"1px solid rgba(245,200,66,0.5)":"1px solid rgba(255,255,255,0.07)",borderRadius:10,color:b>coins?"#554":"#f5c842",fontWeight:900,fontSize:11,padding:"7px 0",cursor:b>coins?"default":"pointer",opacity:b>coins?0.4:1}}>{fmt(b)}</button>
        ))}
      </div>
      {anim&&<div style={{textAlign:"center",fontSize:44,padding:"10px 0",animation:"goldenFloat 0.5s ease-in-out infinite"}}>{anim}</div>}
      {last&&!anim&&(
        <div style={{textAlign:"center",padding:"8px 0",marginBottom:8,color:last.win?"#22d67a":"#f87171",fontWeight:900,fontSize:13}}>{last.text}</div>
      )}
      {!busy&&(
        game==="flip"?(
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>play("heads")} disabled={!canBet} className="press-fx" style={{flex:1,background:canBet?"linear-gradient(135deg,#f5c842,#f59e0b)":"rgba(255,255,255,0.05)",border:"none",borderRadius:12,color:canBet?"#1a0f00":"#556",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:canBet?"pointer":"default"}}>👑 HEADS</button>
            <button onClick={()=>play("tails")} disabled={!canBet} className="press-fx" style={{flex:1,background:canBet?"linear-gradient(135deg,#60a5fa,#a855f7)":"rgba(255,255,255,0.05)",border:"none",borderRadius:12,color:canBet?"#fff":"#556",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:canBet?"pointer":"default"}}>🦅 TAILS</button>
          </div>
        ):game==="dice"?(
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>play("low")} disabled={!canBet} className="press-fx" style={{flex:1,background:canBet?"linear-gradient(135deg,#60a5fa,#22d67a)":"rgba(255,255,255,0.05)",border:"none",borderRadius:12,color:canBet?"#04210f":"#556",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:canBet?"pointer":"default"}}>⬇️ LOW (1-3)</button>
            <button onClick={()=>play("high")} disabled={!canBet} className="press-fx" style={{flex:1,background:canBet?"linear-gradient(135deg,#f87171,#f5c842)":"rgba(255,255,255,0.05)",border:"none",borderRadius:12,color:canBet?"#1a0f00":"#556",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:canBet?"pointer":"default"}}>⬆️ HIGH (4-6)</button>
          </div>
        ):(
          <button onClick={()=>play()} disabled={!canBet} className="press-fx" style={{width:"100%",background:canBet?"linear-gradient(135deg,#f87171,#a855f7)":"rgba(255,255,255,0.05)",border:"none",borderRadius:12,color:canBet?"#fff":"#556",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:canBet?"pointer":"default"}}>🚀 LAUNCH — 5% chance 10×, 15% chance 3×</button>
        )
      )}
      {busy&&<div style={{textAlign:"center",color:"#8f7ca7",fontSize:11.5,fontWeight:800}}>Rolling…</div>}
    </div>
  );
}

// ─── DAILY QUESTS ROTATION ────────────────────────────────────────────────────
const DAILY_QUEST_POOL=[
  {id:"dq_taps",title:"Tap 500 times today",target:500,metric:"taps",reward:100_000,emoji:"👆"},
  {id:"dq_taps_big",title:"Tap 2,000 times today",target:2000,metric:"taps",reward:400_000,emoji:"🔥"},
  {id:"dq_earn",title:"Earn 1M coins today",target:1_000_000,metric:"earned",reward:250_000,emoji:"💰"},
  {id:"dq_earn_big",title:"Earn 10M coins today",target:10_000_000,metric:"earned",reward:1_000_000,emoji:"🤑"},
  {id:"dq_chest",title:"Open a lucky chest",target:1,metric:"chest",reward:150_000,emoji:"📦"},
  {id:"dq_wheel",title:"Spin the wheel",target:1,metric:"wheel",reward:100_000,emoji:"🎡"},
  {id:"dq_casino",title:"Place a casino bet",target:1,metric:"casino",reward:150_000,emoji:"🎰"},
  {id:"dq_golden",title:"Grab a golden coin",target:1,metric:"golden",reward:300_000,emoji:"🪙"},
];
function questsForDay(day:string){
  let h=0;for(let i=0;i<day.length;i++)h=(h*31+day.charCodeAt(i))>>>0;
  const pool=[...DAILY_QUEST_POOL];const picked:typeof DAILY_QUEST_POOL=[];
  for(let i=0;i<3;i++){const idx=(h+i*7)%pool.length;picked.push(pool.splice(idx,1)[0]);}
  return picked;
}
function DailyQuestsCard({playerId,dayStats,onClaim}:{playerId:string;dayStats:Record<string,number>;onClaim:(reward:number,allDone:boolean)=>void;}){
  const day=new Date().toISOString().slice(0,10);
  const quests=useMemo(()=>questsForDay(day),[day]);
  const key=`degen_dq_${playerId}_${day}`;
  const [claimed,setClaimed]=useState<Record<string,boolean>>({});
  useEffect(()=>{try{setClaimed(JSON.parse(localStorage.getItem(key)||"{}"));}catch{}},[key]);
  const claim=(q:typeof DAILY_QUEST_POOL[number])=>{
    const next={...claimed,[q.id]:true};
    setClaimed(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{}
    const allDone=quests.every(x=>next[x.id]);
    onClaim(q.reward+(allDone?500_000:0),allDone);
  };
  return(
    <div style={{background:"linear-gradient(135deg,rgba(96,165,250,0.08),rgba(34,214,122,0.05))",border:"1px solid rgba(96,165,250,0.24)",borderRadius:20,padding:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:20}}>📋</span>
        <div style={{flex:1}}>
          <div style={{color:"#fff",fontWeight:900,fontSize:14}}>Daily quests</div>
          <div style={{color:"#8f7ca7",fontSize:10.5}}>3 fresh quests every day · clear all 3 for +500K bonus</div>
        </div>
        <span style={{background:"rgba(96,165,250,0.12)",border:"1px solid rgba(96,165,250,0.3)",borderRadius:999,color:"#93c5fd",fontSize:10,fontWeight:900,padding:"4px 10px"}}>{quests.filter(q=>claimed[q.id]).length}/3</span>
      </div>
      <div style={{display:"grid",gap:8}}>
        {quests.map(q=>{
          const prog=dayStats[q.metric]||0;
          const done=prog>=q.target;
          const was=!!claimed[q.id];
          return(
            <div key={q.id} style={{display:"flex",alignItems:"center",gap:10,background:was?"rgba(34,214,122,0.06)":"rgba(0,0,0,0.25)",border:was?"1px solid rgba(34,214,122,0.2)":"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"9px 12px"}}>
              <span style={{fontSize:18}}>{q.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#fff",fontWeight:800,fontSize:12}}>{q.title}</div>
                <div style={{color:"#8f7ca7",fontSize:10}}>{fmt(Math.min(prog,q.target))} / {fmt(q.target)} · 💰 {fmt(q.reward)}</div>
              </div>
              {was?<span style={{color:"#22d67a",fontWeight:900,fontSize:10.5}}>✓ DONE</span>:
                done?<button onClick={()=>claim(q)} className="press-fx" style={{background:"linear-gradient(135deg,#22d67a,#16a34a)",border:"none",borderRadius:10,color:"#04210f",fontWeight:900,fontSize:10.5,padding:"7px 12px",cursor:"pointer"}}>CLAIM</button>:
                <span style={{color:"#6d5a86",fontWeight:800,fontSize:10}}>{Math.min(100,Math.floor(prog/q.target*100))}%</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const WHEEL_SEGS=[
  {label:"10K",emoji:"🪙",coins:10_000},
  {label:"100K",emoji:"💰",coins:100_000},
  {label:"25K",emoji:"🪙",coins:25_000},
  {label:"500K",emoji:"💎",coins:500_000},
  {label:"50K",emoji:"💰",coins:50_000},
  {label:"1M",emoji:"🤑",coins:1_000_000},
  {label:"250K",emoji:"💰",coins:250_000},
  {label:"10M",emoji:"👑",coins:10_000_000},
];
function WheelCard({playerId,coins,onWin}:{playerId:string;coins:number;onWin:(coins:number,paid:number)=>void;}){
  const day=new Date().toISOString().slice(0,10);
  const freeKey=`degen_wheel_${playerId}`;
  const [freeUsed,setFreeUsed]=useState(true);
  const [spinning,setSpinning]=useState(false);
  const [rot,setRot]=useState(0);
  const [result,setResult]=useState<typeof WHEEL_SEGS[number]|null>(null);
  const paidCost=500_000;
  useEffect(()=>{ try{setFreeUsed(localStorage.getItem(freeKey)===day);}catch{} },[freeKey,day]);
  const spin=(paid:boolean)=>{
    if(spinning)return;
    if(!paid&&freeUsed)return;
    if(paid&&coins<paidCost)return;
    setSpinning(true);setResult(null);
    if(!paid){try{localStorage.setItem(freeKey,day);}catch{} setFreeUsed(true);}
    // weighted pick: big prizes rarer
    const r=Math.random();
    const idx=r<0.02?7:r<0.08?5:r<0.20?3:r<0.38?6:r<0.56?1:r<0.72?4:r<0.87?2:0;
    const segAngle=360/WHEEL_SEGS.length;
    const target=360*5+(360-(idx*segAngle+segAngle/2));
    setRot(p=>p+target-(p%360));
    setTimeout(()=>{
      const seg=WHEEL_SEGS[idx];
      setResult(seg);setSpinning(false);
      onWin(seg.coins,paid?paidCost:0);
    },3300);
  };
  return(
    <div style={{background:"linear-gradient(135deg,rgba(96,165,250,0.08),rgba(168,85,247,0.06))",border:"1px solid rgba(96,165,250,0.22)",borderRadius:22,padding:14,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{fontSize:20}}>🎡</span>
        <div style={{color:"#fff",fontWeight:900,flex:1}}>Wheel of Fortune</div>
        {!freeUsed&&<span style={{background:"rgba(34,214,122,0.12)",border:"1px solid rgba(34,214,122,0.35)",borderRadius:999,color:"#7ef2b1",fontSize:10,fontWeight:900,padding:"4px 10px"}}>FREE SPIN READY</span>}
      </div>
      <div style={{color:"#8f7ca7",fontSize:11,marginBottom:12}}>One free spin daily. Prizes from 10K up to <b style={{color:"#f5c842"}}>10M</b>.</div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
        <div style={{position:"relative",width:190,height:190}}>
          <div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)",zIndex:3,fontSize:22,filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.6))"}}>🔻</div>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid rgba(245,200,66,0.5)",boxShadow:"0 0 30px rgba(245,200,66,0.2), inset 0 0 30px rgba(0,0,0,0.5)",background:"conic-gradient(#2a1245 0deg 45deg,#1a0b30 45deg 90deg,#2a1245 90deg 135deg,#1a0b30 135deg 180deg,#2a1245 180deg 225deg,#1a0b30 225deg 270deg,#2a1245 270deg 315deg,#1a0b30 315deg 360deg)",transform:`rotate(${rot}deg)`,transition:spinning?"transform 3.2s cubic-bezier(0.15,0.85,0.25,1)":"none"}}>
            {WHEEL_SEGS.map((s,i)=>{
              const a=i*45+22.5;
              return <div key={i} style={{position:"absolute",left:"50%",top:"50%",transform:`rotate(${a}deg) translateY(-66px) rotate(-${a}deg)`,textAlign:"center",marginLeft:-22,marginTop:-14,width:44}}>
                <div style={{fontSize:15,lineHeight:1}}>{s.emoji}</div>
                <div style={{color:"#cbb8e8",fontSize:8.5,fontWeight:900}}>{s.label}</div>
              </div>;
            })}
          </div>
          <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#f5c842,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,zIndex:2,boxShadow:"0 0 16px rgba(245,200,66,0.5)"}}>🎰</div>
        </div>
      </div>
      {result&&<div className="anim-slideup" style={{textAlign:"center",color:"#fff",fontWeight:900,fontSize:14,marginBottom:10}}>🎉 You won <span style={{color:"#f5c842"}}>+{fmt(result.coins)}</span> coins!</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button onClick={()=>spin(false)} disabled={freeUsed||spinning} className="press-fx" style={{background:!freeUsed&&!spinning?"linear-gradient(135deg,#22d67a,#16a34a)":"rgba(255,255,255,0.04)",border:"none",borderRadius:14,color:!freeUsed&&!spinning?"#04130a":"#62546f",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:!freeUsed&&!spinning?"pointer":"default"}}>{freeUsed?"Free spin used":"🎁 FREE SPIN"}</button>
        <button onClick={()=>spin(true)} disabled={spinning||coins<paidCost} className="press-fx" style={{background:coins>=paidCost&&!spinning?"linear-gradient(135deg,#a855f7,#7c3aed)":"rgba(255,255,255,0.04)",border:"none",borderRadius:14,color:coins>=paidCost&&!spinning?"#fff":"#62546f",fontWeight:900,fontSize:12.5,padding:"12px 0",cursor:coins>=paidCost&&!spinning?"pointer":"default"}}>Spin · {fmt(paidCost)}</button>
      </div>
    </div>
  );
}

// ─── BOSS RAID ───────────────────────────────────────────────────────────────
const RAID_BOSSES=[
  {name:"Rug Dragon",emoji:"🐉",color:"#f87171"},
  {name:"Liquidation Kraken",emoji:"🦑",color:"#60a5fa"},
  {name:"Bear God",emoji:"🐻",color:"#a78bfa"},
  {name:"Jeeter Lord",emoji:"🤡",color:"#fbbf24"},
  {name:"Whale Tyrant",emoji:"🐋",color:"#34d399"},
  {name:"Gas Demon",emoji:"👹",color:"#fb7185"},
];
const RAID_HP=1_000_000_000;
const RAID_REWARD=50_000_000;
function bossForWeek(wk:string){let h=0;for(let i=0;i<wk.length;i++)h=(h*31+wk.charCodeAt(i))>>>0;return RAID_BOSSES[h%RAID_BOSSES.length];}
const medal=(i:number)=>i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
type RaidRow={id:string;player_id:string;data:{week:string;dmg:number;username:string;charId?:string}};

function RaidSection({playerId,username,charId,totalEarned,onReward}:{playerId:string;username:string;charId:string|null;totalEarned:number;onReward:(coins:number,label:string,badgeKey?:string)=>void;}){
  const wk=weekId();
  const boss=bossForWeek(wk);
  const joinKey=`degen_raid_${playerId}_${wk}`;
  const [joined,setJoined]=useState<{start:number;rowId:string}|null>(null);
  const [rows,setRows]=useState<RaidRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [prevPrize,setPrevPrize]=useState<{dmg:number;top3:boolean}|null>(null);
  const earnedRef=useRef(totalEarned);earnedRef.current=totalEarned;

  useEffect(()=>{ try{const raw=localStorage.getItem(joinKey); if(raw)setJoined(JSON.parse(raw));}catch{} },[joinKey]);

  const fetchRows=useCallback(async()=>{
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data}=await supabase.from("dt_security_events").select("id,player_id,data")
        .eq("event_type","raid").eq("data->>week",wk).limit(200);
      setRows(((data||[]) as RaidRow[]).sort((a,b)=>(b.data?.dmg||0)-(a.data?.dmg||0)));
    }catch{}
    setLoading(false);
  },[wk]);

  const syncDmg=useCallback(async(j:{start:number;rowId:string})=>{
    try{
      const {supabase}=await import("@/lib/supabase");
      const dmg=Math.max(0,Math.floor(earnedRef.current-j.start));
      await supabase.from("dt_security_events").update({data:{week:wk,dmg,username,charId:charId||"pepe"}}).eq("id",j.rowId);
    }catch{}
  },[wk,username,charId]);

  useEffect(()=>{
    fetchRows();
    if(!joined)return;
    syncDmg(joined).then(fetchRows);
    const id=setInterval(()=>{syncDmg(joined).then(fetchRows);},20000);
    return()=>clearInterval(id);
  },[joined,fetchRows,syncDmg]);

  // previous week reward
  useEffect(()=>{
    (async()=>{
      const pw=prevWeekId();
      const claimKey=`degen_raid_claim_${playerId}_${pw}`;
      try{
        if(localStorage.getItem(claimKey))return;
        const {supabase}=await import("@/lib/supabase");
        const {data}=await supabase.from("dt_security_events").select("id,player_id,data")
          .eq("event_type","raid").eq("data->>week",pw).limit(200);
        const prows=((data||[]) as RaidRow[]).sort((a,b)=>(b.data?.dmg||0)-(a.data?.dmg||0));
        const total=prows.reduce((s,r)=>s+(r.data?.dmg||0),0);
        const idx=prows.findIndex(r=>r.player_id===playerId);
        if(total>=RAID_HP&&idx>=0&&(prows[idx].data?.dmg||0)>0)setPrevPrize({dmg:prows[idx].data.dmg,top3:idx<3});
      }catch{}
    })();
  },[playerId]);

  const joinRaid=async()=>{
    if(busy||joined)return;setBusy(true);
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data,error}=await supabase.from("dt_security_events").insert({
        player_id:playerId,event_type:"raid",severity:"low",
        data:{week:wk,dmg:0,username,charId:charId||"pepe"},
      }).select("id").single();
      if(!error&&data){
        const j={start:earnedRef.current,rowId:data.id as string};
        setJoined(j);try{localStorage.setItem(joinKey,JSON.stringify(j));}catch{}
        fetchRows();
      }
    }catch{}
    setBusy(false);
  };

  const claimRaid=()=>{
    if(!prevPrize)return;
    try{localStorage.setItem(`degen_raid_claim_${playerId}_${prevWeekId()}`,"1");}catch{}
    onReward(RAID_REWARD,`${boss.emoji} Raid victory reward`,prevPrize.top3?"badge_raid_slayer":undefined);
    setPrevPrize(null);
  };

  const totalDmg=rows.reduce((s,r)=>s+(r.data?.dmg||0),0);
  const hpLeft=Math.max(0,RAID_HP-totalDmg);
  const pct=Math.min(100,(totalDmg/RAID_HP)*100);
  const dead=hpLeft<=0;
  const myDmg=joined?Math.max(0,Math.floor(totalEarned-joined.start)):0;

  return(
    <div style={{display:"grid",gap:12}}>
      {prevPrize&&(
        <div className="shine-card" style={{background:"linear-gradient(135deg,rgba(248,113,113,0.16),rgba(245,200,66,0.08))",border:"1.5px solid rgba(248,113,113,0.45)",borderRadius:20,padding:14}}>
          <div style={{color:"#fff",fontWeight:900,marginBottom:4}}>⚔️ Last week&apos;s boss was SLAIN!</div>
          <div style={{color:"#a794c3",fontSize:11.5,marginBottom:10}}>You dealt <b style={{color:"#f87171"}}>{fmt(prevPrize.dmg)}</b> damage. Reward: <b style={{color:"#f5c842"}}>+{fmt(RAID_REWARD)} coins</b>{prevPrize.top3&&<> + <b style={{color:"#f87171"}}>🗡️ Boss Slayer badge</b></>}</div>
          <button onClick={claimRaid} className="press-fx" style={{width:"100%",background:"linear-gradient(135deg,#f87171,#dc2626)",border:"none",borderRadius:12,color:"#fff",fontWeight:900,fontSize:13,padding:"12px 0",cursor:"pointer"}}>Claim raid reward</button>
        </div>
      )}
      <div style={{background:`linear-gradient(135deg,${boss.color}1a,rgba(0,0,0,0.2))`,border:`1px solid ${boss.color}40`,borderRadius:20,padding:16,textAlign:"center"}}>
        <div style={{fontSize:54,marginBottom:4,animation:"charFloat 3s ease-in-out infinite",filter:dead?"grayscale(1) opacity(0.5)":"none"}}>{boss.emoji}</div>
        <div style={{color:"#fff",fontWeight:900,fontSize:20,letterSpacing:"-0.02em"}}>{boss.name}</div>
        <div style={{color:"#8f7ca7",fontSize:11,marginBottom:12}}>World Boss · week {wk} · the whole server fights together</div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{color:boss.color,fontWeight:900,fontSize:11}}>{dead?"💀 DEFEATED":`HP ${fmt(hpLeft)}`}</span>
          <span style={{color:"#8f7ca7",fontSize:11}}>{fmt(totalDmg)} / {fmt(RAID_HP)} dmg</span>
        </div>
        <div style={{height:14,background:"rgba(0,0,0,0.45)",borderRadius:8,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",marginBottom:12}}>
          <div style={{height:"100%",width:`${100-pct}%`,marginLeft:"auto",background:`linear-gradient(90deg,${boss.color},#dc2626)`,borderRadius:8,transition:"width 0.8s",boxShadow:`0 0 14px ${boss.color}88`}}/>
        </div>
        {!joined?(
          <button onClick={joinRaid} disabled={busy||dead} className="press-fx" style={{width:"100%",background:dead?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#dc2626,#a855f7)",border:"none",borderRadius:14,color:"#fff",fontWeight:900,fontSize:14,padding:"14px 0",cursor:dead?"default":"pointer",boxShadow:dead?"none":"0 0 26px rgba(220,38,38,0.3)"}}>{dead?"Boss already defeated":busy?"Joining…":"⚔️ JOIN THE RAID — FREE"}</button>
        ):(
          <div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"10px 12px"}}>
            <div style={{color:"#fff",fontWeight:900,fontSize:13}}>⚔️ Your damage: <span style={{color:boss.color}}>{fmt(myDmg)}</span></div>
            <div style={{color:"#8f7ca7",fontSize:10.5}}>Every coin you earn anywhere in the game hits the boss. Kill it before Sunday → everyone gets {fmt(RAID_REWARD)}, top 3 damage get the 🗡️ Boss Slayer badge.</div>
          </div>
        )}
      </div>
      <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:14}}>
        <div style={{color:"#fff",fontWeight:900,marginBottom:10}}>🗡️ Damage leaderboard</div>
        {loading?<div style={{color:"#8f7ca7",fontSize:12}}>Loading…</div>:rows.length===0?<div style={{color:"#8f7ca7",fontSize:12}}>No raiders yet — be the first to attack.</div>:(
          <div style={{display:"grid",gap:6}}>
            {rows.slice(0,20).map((r,i)=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,background:r.player_id===playerId?"rgba(168,85,247,0.12)":"rgba(255,255,255,0.02)",border:r.player_id===playerId?"1px solid rgba(168,85,247,0.3)":"1px solid transparent",borderRadius:12,padding:"8px 10px"}}>
                <span style={{width:26,color:i<3?"#f5c842":"#6f5f86",fontWeight:900,fontSize:12}}>{medal(i)}</span>
                <span style={{flex:1,color:"#fff",fontWeight:800,fontSize:12.5}}>{r.data?.username||"anon"}</span>
                <span style={{color:boss.color,fontWeight:900,fontSize:12}}>{fmt(r.data?.dmg||0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FRIENDS ─────────────────────────────────────────────────────────────────
type FriendRow={id:string;player_id:string;data:{friend:string;username:string;friendName:string;ts:number}};
function FriendsCard({playerId,username,totalEarned}:{playerId:string;username:string;totalEarned:number;}){
  const [friends,setFriends]=useState<{id:string;name:string;score:number;taps:number;char?:string}[]>([]);
  const [q,setQ]=useState("");
  const [results,setResults]=useState<{wallet_address:string;username:string;total_score:number}[]>([]);
  const [busy,setBusy]=useState(false);
  const [searched,setSearched]=useState(false);

  const fetchFriends=useCallback(async()=>{
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data}=await supabase.from("dt_security_events").select("id,player_id,data")
        .eq("event_type","friend").eq("player_id",playerId).limit(100);
      const rows=(data||[]) as FriendRow[];
      const ids=Array.from(new Set(rows.map(r=>r.data?.friend).filter(Boolean)));
      if(!ids.length){setFriends([]);return;}
      const {data:pl}=await supabase.from("dt_players").select("wallet_address,username,total_score,total_taps,character").in("wallet_address",ids);
      setFriends((pl||[]).map((p:{wallet_address:string;username:string;total_score:number;total_taps:number;character?:string})=>({id:p.wallet_address,name:p.username||"anon",score:Number(p.total_score)||0,taps:Number(p.total_taps)||0,char:p.character})).sort((a,b)=>b.score-a.score));
    }catch{}
  },[playerId]);
  useEffect(()=>{fetchFriends();},[fetchFriends]);

  const search=async()=>{
    const term=q.trim();
    if(term.length<2||busy)return;setBusy(true);setSearched(true);
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data}=await supabase.from("dt_players").select("wallet_address,username,total_score")
        .ilike("username",`%${term}%`).neq("wallet_address",playerId).limit(8);
      setResults((data||[]) as {wallet_address:string;username:string;total_score:number}[]);
    }catch{}
    setBusy(false);
  };

  const addFriend=async(target:{wallet_address:string;username:string})=>{
    if(busy||friends.some(f=>f.id===target.wallet_address))return;setBusy(true);
    try{
      const {supabase}=await import("@/lib/supabase");
      await supabase.from("dt_security_events").insert({
        player_id:playerId,event_type:"friend",severity:"low",
        data:{friend:target.wallet_address,username,friendName:target.username,ts:Date.now()},
      });
      setResults(r=>r.filter(x=>x.wallet_address!==target.wallet_address));
      await fetchFriends();
    }catch{}
    setBusy(false);
  };

  return(
    <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:14,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{fontSize:18}}>👥</span>
        <div style={{color:"#fff",fontWeight:900,flex:1}}>Friends</div>
        <span style={{color:"#8f7ca7",fontSize:11,fontWeight:800}}>{friends.length}</span>
      </div>
      <div style={{color:"#8f7ca7",fontSize:11,marginBottom:10}}>Add players, flex your grind, see who&apos;s winning.</div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")search();}} placeholder="Search username…"
          style={{flex:1,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",fontSize:13,padding:"10px 12px",outline:"none"}}/>
        <button onClick={search} disabled={busy} className="press-fx" style={{background:"linear-gradient(135deg,#a855f7,#7c3aed)",border:"none",borderRadius:12,color:"#fff",fontWeight:900,fontSize:12,padding:"0 16px",cursor:"pointer"}}>🔍</button>
      </div>
      {searched&&results.length===0&&!busy&&<div style={{color:"#6f5f86",fontSize:11,marginBottom:8}}>No players found.</div>}
      {results.map(r=>(
        <div key={r.wallet_address} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.15)",borderRadius:12,padding:"8px 10px",marginBottom:6}}>
          <span style={{flex:1,color:"#fff",fontWeight:800,fontSize:12.5}}>{r.username||"anon"}</span>
          <span style={{color:"#f5c842",fontSize:11,fontWeight:800}}>💰 {fmt(Number(r.total_score)||0)}</span>
          <button onClick={()=>addFriend(r)} className="press-fx" style={{background:"linear-gradient(135deg,#22d67a,#16a34a)",border:"none",borderRadius:10,color:"#04130a",fontWeight:900,fontSize:11,padding:"6px 12px",cursor:"pointer"}}>+ Add</button>
        </div>
      ))}
      {friends.length>0&&(
        <div style={{display:"grid",gap:6,marginTop:4}}>
          {friends.map((f,i)=>{
            const ahead=f.score>totalEarned;
            return(
              <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.02)",borderRadius:12,padding:"8px 10px"}}>
                <span style={{width:22,color:i<3?"#f5c842":"#6f5f86",fontWeight:900,fontSize:11}}>#{i+1}</span>
                <span style={{flex:1,color:"#fff",fontWeight:800,fontSize:12.5}}>{f.name}</span>
                <span style={{color:"#8f7ca7",fontSize:10.5}}>👆{fmt(f.taps)}</span>
                <span style={{color:"#f5c842",fontWeight:900,fontSize:11.5}}>💰{fmt(f.score)}</span>
                <span style={{fontSize:10,fontWeight:900,color:ahead?"#f87171":"#22d67a"}}>{ahead?"▲":"▼"}</span>
              </div>
            );
          })}
        </div>
      )}
      {friends.length===0&&<div style={{color:"#6f5f86",fontSize:11,textAlign:"center",padding:"6px 0"}}>No friends yet — search a username above.</div>}
    </div>
  );
}

// ─── CLAN CHAT ───────────────────────────────────────────────────────────────
type ChatRow={id:string;player_id:string;data:{clan:string;text:string;username:string;ts:number}};
function ClanChat({playerId,username,clanId}:{playerId:string;username:string;clanId:string;}){
  const [msgs,setMsgs]=useState<ChatRow[]>([]);
  const [text,setText]=useState("");
  const [busy,setBusy]=useState(false);
  const boxRef=useRef<HTMLDivElement>(null);

  const fetchMsgs=useCallback(async()=>{
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data}=await supabase.from("dt_security_events").select("id,player_id,data")
        .eq("event_type","clan_chat").eq("data->>clan",clanId).limit(60);
      const rows=((data||[]) as ChatRow[]).sort((a,b)=>(a.data?.ts||0)-(b.data?.ts||0)).slice(-40);
      setMsgs(rows);
      const last=rows[rows.length-1];
      if(last)try{localStorage.setItem(`degen_seen_chat_${playerId}`,String(last.data?.ts||0));}catch{}
    }catch{}
  },[clanId,playerId]);

  useEffect(()=>{
    fetchMsgs();
    const id=setInterval(fetchMsgs,5000);
    return()=>clearInterval(id);
  },[fetchMsgs]);
  useEffect(()=>{ if(boxRef.current)boxRef.current.scrollTop=boxRef.current.scrollHeight; },[msgs.length]);

  const send=async()=>{
    const t=text.trim().slice(0,200);
    if(!t||busy)return;setBusy(true);setText("");
    try{
      const {supabase}=await import("@/lib/supabase");
      await supabase.from("dt_security_events").insert({
        player_id:playerId,event_type:"clan_chat",severity:"low",
        data:{clan:clanId,text:t,username,ts:Date.now()},
      });
      await fetchMsgs();
    }catch{}
    setBusy(false);
  };

  return(
    <div style={{background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:12,marginTop:10}}>
      <div style={{color:"#fff",fontWeight:900,fontSize:13,marginBottom:8}}>💬 Clan chat</div>
      <div ref={boxRef} style={{maxHeight:220,overflowY:"auto",display:"grid",gap:6,marginBottom:10}}>
        {msgs.length===0&&<div style={{color:"#6f5f86",fontSize:11,textAlign:"center",padding:"10px 0"}}>No messages yet. Say gm.</div>}
        {msgs.map(m=>{
          const mine=m.player_id===playerId;
          return(
            <div key={m.id} style={{justifySelf:mine?"end":"start",maxWidth:"85%",background:mine?"linear-gradient(135deg,rgba(168,85,247,0.25),rgba(124,58,237,0.18))":"rgba(255,255,255,0.04)",border:mine?"1px solid rgba(168,85,247,0.3)":"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"7px 10px"}}>
              {!mine&&<div style={{color:"#c084fc",fontWeight:900,fontSize:10,marginBottom:2}}>{m.data?.username||"anon"}</div>}
              <div style={{color:"#e9e2f5",fontSize:12,lineHeight:1.4,wordBreak:"break-word"}}>{m.data?.text}</div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send();}} placeholder="Message your clan…" maxLength={200}
          style={{flex:1,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",fontSize:13,padding:"10px 12px",outline:"none"}}/>
        <button onClick={send} disabled={busy||!text.trim()} className="press-fx" style={{background:text.trim()?"linear-gradient(135deg,#a855f7,#7c3aed)":"rgba(255,255,255,0.04)",border:"none",borderRadius:12,color:text.trim()?"#fff":"#62546f",fontWeight:900,fontSize:13,padding:"0 16px",cursor:text.trim()?"pointer":"default"}}>➤</button>
      </div>
    </div>
  );
}

// ─── IN-APP NOTIFICATIONS ────────────────────────────────────────────────────
type AppNotif={id:number;emoji:string;title:string;body:string};
function NotifLayer({notifs,onDismiss}:{notifs:AppNotif[];onDismiss:(id:number)=>void;}){
  return(
    <div style={{position:"fixed",top:10,left:"50%",transform:"translateX(-50%)",zIndex:400,width:"min(92vw,400px)",display:"grid",gap:8,pointerEvents:"none"}}>
      {notifs.map(n=>(
        <div key={n.id} onClick={()=>onDismiss(n.id)} style={{pointerEvents:"auto",cursor:"pointer",background:"linear-gradient(135deg,rgba(20,8,40,0.97),rgba(12,4,28,0.97))",border:"1px solid rgba(168,85,247,0.4)",borderRadius:16,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,0.15)",animation:"notifIn 0.3s ease",backdropFilter:"blur(12px)"}}>
          <span style={{fontSize:22,flexShrink:0}}>{n.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"#fff",fontWeight:900,fontSize:12.5}}>{n.title}</div>
            <div style={{color:"#a794c3",fontSize:11,lineHeight:1.35,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.body}</div>
          </div>
          <span style={{color:"#62546f",fontSize:14,flexShrink:0}}>×</span>
        </div>
      ))}
    </div>
  );
}

// ─── LUCKY CHESTS ────────────────────────────────────────────────────────────
type ChestResult={coins:number;boostMult?:number;boostMins?:number;jackpot?:boolean};
const CHESTS=[
  {id:"bronze",name:"Bronze Chest",emoji:"🥉",cost:50_000,color:"#f59e0b",desc:"Cheap gamble. Small stacks, 1% shot at 5M.",
    roll:():ChestResult=>{const r=Math.random();
      if(r<0.01)return{coins:5_000_000,jackpot:true};
      if(r<0.10)return{coins:500_000};
      if(r<0.40)return{coins:100_000+Math.floor(Math.random()*100_000)};
      return{coins:20_000+Math.floor(Math.random()*60_000)};}},
  {id:"gold",name:"Gold Chest",emoji:"🏆",cost:1_000_000,color:"#f5c842",desc:"Mid stakes. Can drop a 2× tap boost or 50M jackpot.",
    roll:():ChestResult=>{const r=Math.random();
      if(r<0.01)return{coins:50_000_000,jackpot:true};
      if(r<0.05)return{coins:10_000_000};
      if(r<0.15)return{coins:0,boostMult:2,boostMins:10};
      if(r<0.45)return{coins:2_000_000+Math.floor(Math.random()*2_000_000)};
      return{coins:400_000+Math.floor(Math.random()*1_200_000)};}},
  {id:"degen",name:"Degen Chest",emoji:"💎",cost:25_000_000,color:"#c084fc",desc:"Full degen. 3× boosts, 250M drops, 1% at 1B.",
    roll:():ChestResult=>{const r=Math.random();
      if(r<0.01)return{coins:1_000_000_000,jackpot:true};
      if(r<0.10)return{coins:250_000_000};
      if(r<0.25)return{coins:0,boostMult:3,boostMins:15};
      if(r<0.50)return{coins:50_000_000+Math.floor(Math.random()*50_000_000)};
      return{coins:10_000_000+Math.floor(Math.random()*30_000_000)};}},
];

function LuckyChests({coins,boostMult,boostLeft,onOpen}:{coins:number;boostMult:number;boostLeft:number;onOpen:(cost:number,res:ChestResult)=>void;}){
  const [opening,setOpening]=useState<string|null>(null);
  const [result,setResult]=useState<{chest:typeof CHESTS[number];res:ChestResult}|null>(null);
  const open=(c:typeof CHESTS[number])=>{
    if(opening||coins<c.cost)return;
    setOpening(c.id);setResult(null);
    const res=c.roll();
    onOpen(c.cost,res);
    setTimeout(()=>{setOpening(null);setResult({chest:c,res});},900);
  };
  return(
    <div style={{background:"linear-gradient(135deg,rgba(245,200,66,0.07),rgba(168,85,247,0.06))",border:"1px solid rgba(245,200,66,0.2)",borderRadius:22,padding:14,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{fontSize:20}}>🎰</span>
        <div style={{color:"#fff",fontWeight:900,flex:1}}>Lucky Chests</div>
        {boostMult>1&&boostLeft>0&&<span style={{background:"rgba(34,214,122,0.12)",border:"1px solid rgba(34,214,122,0.35)",borderRadius:999,color:"#7ef2b1",fontSize:10.5,fontWeight:900,padding:"4px 10px"}}>⚡ {boostMult}× boost · {Math.ceil(boostLeft/60)}m left</span>}
      </div>
      <div style={{color:"#8f7ca7",fontSize:11,marginBottom:12}}>Spend coins, hit jackpots up to <b style={{color:"#f5c842"}}>1B</b> or win temporary tap boosts.</div>
      {result&&(
        <div className="anim-slideup" style={{background:result.res.jackpot?"linear-gradient(135deg,rgba(245,200,66,0.2),rgba(248,113,113,0.1))":"rgba(0,0,0,0.3)",border:result.res.jackpot?"1.5px solid rgba(245,200,66,0.6)":"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 14px",marginBottom:12,textAlign:"center",boxShadow:result.res.jackpot?"0 0 40px rgba(245,200,66,0.3)":"none"}}>
          <div style={{fontSize:26,marginBottom:4}}>{result.res.jackpot?"🎉":result.res.boostMult?"⚡":"💰"}</div>
          <div style={{color:"#fff",fontWeight:900,fontSize:14}}>
            {result.res.jackpot&&"JACKPOT! "}
            {result.res.boostMult?`${result.res.boostMult}× tap boost for ${result.res.boostMins} min!`:`+${fmt(result.res.coins)} coins`}
          </div>
          <div style={{color:"#8f7ca7",fontSize:10.5,marginTop:2}}>{result.chest.emoji} {result.chest.name}</div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {CHESTS.map(c=>{
          const afford=coins>=c.cost;
          return(
            <button key={c.id} onClick={()=>open(c)} disabled={!afford||!!opening} className="press-fx"
              style={{background:afford?`linear-gradient(160deg,${c.color}1f,rgba(0,0,0,0.25))`:"rgba(255,255,255,0.02)",border:`1px solid ${afford?c.color+"4d":"rgba(255,255,255,0.05)"}`,borderRadius:16,padding:"12px 8px",cursor:afford?"pointer":"default",textAlign:"center",opacity:afford?1:0.5}}>
              <div style={{fontSize:26,marginBottom:4,animation:opening===c.id?"chestShake 0.15s linear infinite":"none"}}>{c.emoji}</div>
              <div style={{color:"#fff",fontWeight:900,fontSize:11.5,marginBottom:2}}>{c.name}</div>
              <div style={{color:c.color,fontWeight:900,fontSize:11}}>{fmt(c.cost)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── TOURNAMENTS + CLANS ─────────────────────────────────────────────────────
function weekId(d=new Date()){const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));const dayNum=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-dayNum+3);const firstThu=new Date(Date.UTC(t.getUTCFullYear(),0,4));const wk=1+Math.round(((t.getTime()-firstThu.getTime())/86400000-3+((firstThu.getUTCDay()+6)%7))/7);return `${t.getUTCFullYear()}-W${wk}`;}
function prevWeekId(){return weekId(new Date(Date.now()-7*86400000));}
const TOUR_PRIZES=[100_000_000,25_000_000,10_000_000];
const TOUR_BADGES=[
  {key:"badge_tour_champ",label:"Tournament Champion",emoji:"👑",color:"#f5c842",extra:"Exclusive GOLD theme unlocked"},
  {key:"badge_tour_silver",label:"Tournament Silver",emoji:"🥈",color:"#e2e8f0",extra:""},
  {key:"badge_tour_bronze",label:"Tournament Bronze",emoji:"🥉",color:"#f59e0b",extra:""},
];
type TourRow={id:string;player_id:string;data:{week:string;score:number;username:string;charId?:string}};
type ClanRow={id:string;data:{name:string;tag:string;leader:string;members:string[];created:string;motto?:string}};
const CLAN_TIERS=[
  {min:0,name:"Street Crew",emoji:"🪨",color:"#9ca3af"},
  {min:10_000_000,name:"Block Gang",emoji:"🥉",color:"#f59e0b"},
  {min:100_000_000,name:"Tower Syndicate",emoji:"🥈",color:"#e2e8f0"},
  {min:1_000_000_000,name:"Degen Cartel",emoji:"🥇",color:"#f5c842"},
  {min:10_000_000_000,name:"Whale Dynasty",emoji:"🐋",color:"#60a5fa"},
  {min:100_000_000_000,name:"Moon Empire",emoji:"🌕",color:"#c084fc"},
];
const clanTier=(power:number)=>{let t=CLAN_TIERS[0];for(const c of CLAN_TIERS)if(power>=c.min)t=c;return t;};

function CompeteTab({playerId,username,charId,totalEarned,onReward}:{playerId:string;username:string;charId:string|null;totalEarned:number;onReward:(coins:number,label:string,badgeKey?:string)=>void;}){
  const [sub,setSub]=useState<"tournament"|"clans"|"raid">("tournament");
  const wk=weekId();
  const joinKey=`degen_tour_${playerId}_${wk}`;
  const [joined,setJoined]=useState<{start:number;rowId:string}|null>(null);
  const [standings,setStandings]=useState<TourRow[]>([]);
  const [loadingT,setLoadingT]=useState(true);
  const [prizeState,setPrizeState]=useState<{rank:number;prize:number}|null>(null);
  const [clans,setClans]=useState<ClanRow[]>([]);
  const [clanScores,setClanScores]=useState<Record<string,number>>({});
  const [clanWar,setClanWar]=useState<Record<string,number>>({});
  const [memberScores,setMemberScores]=useState<Record<string,number>>({});
  const [memberNames,setMemberNames]=useState<Record<string,string>>({});
  const [myClan,setMyClan]=useState<ClanRow|null>(null);
  const [loadingC,setLoadingC]=useState(true);
  const [cName,setCName]=useState("");const [cTag,setCTag]=useState("");
  const [busy,setBusy]=useState(false);
  const earnedRef=useRef(totalEarned);earnedRef.current=totalEarned;

  useEffect(()=>{ try{const raw=localStorage.getItem(joinKey); if(raw)setJoined(JSON.parse(raw));}catch{} },[joinKey]);

  const fetchStandings=useCallback(async()=>{
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data}=await supabase.from("dt_security_events").select("id,player_id,data")
        .eq("event_type","tournament").eq("data->>week",wk).limit(100);
      const rows=((data||[]) as TourRow[]).sort((a,b)=>(b.data?.score||0)-(a.data?.score||0));
      setStandings(rows);
    }catch{}
    setLoadingT(false);
  },[wk]);

  // sync my score to DB while tab is open
  const syncScore=useCallback(async(j:{start:number;rowId:string})=>{
    try{
      const {supabase}=await import("@/lib/supabase");
      const score=Math.max(0,Math.floor(earnedRef.current-j.start));
      await supabase.from("dt_security_events").update({data:{week:wk,score,username,charId:charId||"pepe"}}).eq("id",j.rowId);
    }catch{}
  },[wk,username,charId]);

  useEffect(()=>{
    fetchStandings();
    if(!joined)return;
    syncScore(joined).then(fetchStandings);
    const id=setInterval(()=>{syncScore(joined).then(fetchStandings);},20000);
    return()=>clearInterval(id);
  },[joined,fetchStandings,syncScore]);

  // previous week prize claim
  useEffect(()=>{
    (async()=>{
      const pw=prevWeekId();
      const claimKey=`degen_tour_claim_${playerId}_${pw}`;
      try{
        if(localStorage.getItem(claimKey))return;
        const {supabase}=await import("@/lib/supabase");
        const {data}=await supabase.from("dt_security_events").select("id,player_id,data")
          .eq("event_type","tournament").eq("data->>week",pw).limit(100);
        const rows=((data||[]) as TourRow[]).sort((a,b)=>(b.data?.score||0)-(a.data?.score||0));
        const idx=rows.findIndex(r=>r.player_id===playerId);
        if(idx>=0&&idx<3&&(rows[idx].data?.score||0)>0)setPrizeState({rank:idx+1,prize:TOUR_PRIZES[idx]});
      }catch{}
    })();
  },[playerId]);

  const joinTournament=async()=>{
    if(busy||joined)return;setBusy(true);
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data,error}=await supabase.from("dt_security_events").insert({
        player_id:playerId,event_type:"tournament",severity:"low",
        data:{week:wk,score:0,username,charId:charId||"pepe"},
      }).select("id").single();
      if(!error&&data){
        const j={start:earnedRef.current,rowId:data.id as string};
        setJoined(j);try{localStorage.setItem(joinKey,JSON.stringify(j));}catch{}
        fetchStandings();
      }
    }catch{}
    setBusy(false);
  };

  const claimPrize=()=>{
    if(!prizeState)return;
    try{localStorage.setItem(`degen_tour_claim_${playerId}_${prevWeekId()}`,"1");}catch{}
    const badge=TOUR_BADGES[prizeState.rank-1];
    onReward(prizeState.prize,`🏆 Tournament rank #${prizeState.rank} prize`,badge?.key);
    setPrizeState(null);
  };

  // ── clans ──
  const fetchClans=useCallback(async()=>{
    try{
      const {supabase}=await import("@/lib/supabase");
      const {data}=await supabase.from("dt_security_events").select("id,data")
        .eq("event_type","clan").eq("player_id","__clan__").limit(100);
      const rows=(data||[]) as ClanRow[];
      setClans(rows);
      const mine=rows.find(c=>(c.data?.members||[]).includes(playerId))||null;
      setMyClan(mine);
      // clan power = sum of member total_score
      const allMembers=Array.from(new Set(rows.flatMap(c=>c.data?.members||[]))).slice(0,200);
      if(allMembers.length){
        const {data:pl}=await supabase.from("dt_players").select("wallet_address,username,total_score").in("wallet_address",allMembers);
        const scoreOf:Record<string,number>={};const nameOf:Record<string,string>={};
        (pl||[]).forEach((p:{wallet_address:string;username:string;total_score:number})=>{scoreOf[p.wallet_address]=Number(p.total_score)||0;nameOf[p.wallet_address]=p.username||"anon";});
        const cs:Record<string,number>={};rows.forEach(c=>{cs[c.id]=(c.data?.members||[]).reduce((s,m)=>s+(scoreOf[m]||0),0);});
        setClanScores(cs);setMemberScores(scoreOf);setMemberNames(nameOf);
      }
      // clan war: sum of member tournament scores this week
      try{
        const {data:tw}=await supabase.from("dt_security_events").select("player_id,data")
          .eq("event_type","tournament").eq("data->>week",weekId()).limit(200);
        const warOf:Record<string,number>={};
        ((tw||[]) as {player_id:string;data:{score?:number}}[]).forEach(r=>{warOf[r.player_id]=Math.max(warOf[r.player_id]||0,r.data?.score||0);});
        const cw:Record<string,number>={};rows.forEach(c=>{cw[c.id]=(c.data?.members||[]).reduce((s,m)=>s+(warOf[m]||0),0);});
        setClanWar(cw);
      }catch{}
    }catch{}
    setLoadingC(false);
  },[playerId]);
  useEffect(()=>{fetchClans();},[fetchClans]);

  const createClan=async()=>{
    const name=cName.trim(),tag=cTag.trim().toUpperCase().slice(0,5);
    if(!name||name.length<3||!tag||tag.length<2||busy||myClan)return;setBusy(true);
    try{
      const {supabase}=await import("@/lib/supabase");
      await supabase.from("dt_security_events").insert({
        player_id:"__clan__",event_type:"clan",severity:"low",
        data:{name,tag,leader:playerId,members:[playerId],created:new Date().toISOString()},
      });
      setCName("");setCTag("");await fetchClans();
    }catch{}
    setBusy(false);
  };
  const joinClan=async(c:ClanRow)=>{
    if(busy||myClan)return;setBusy(true);
    try{
      const {supabase}=await import("@/lib/supabase");
      const members=Array.from(new Set([...(c.data?.members||[]),playerId]));
      await supabase.from("dt_security_events").update({data:{...c.data,members}}).eq("id",c.id);
      await fetchClans();
    }catch{}
    setBusy(false);
  };
  const leaveClan=async()=>{
    if(busy||!myClan)return;setBusy(true);
    try{
      const {supabase}=await import("@/lib/supabase");
      const members=(myClan.data?.members||[]).filter(m=>m!==playerId);
      const leader=myClan.data.leader===playerId?(members[0]||""):myClan.data.leader;
      await supabase.from("dt_security_events").update({data:{...myClan.data,members,leader}}).eq("id",myClan.id);
      await fetchClans();
    }catch{}
    setBusy(false);
  };

  const myRank=standings.findIndex(r=>r.player_id===playerId)+1;
  const myScore=joined?Math.max(0,Math.floor(totalEarned-joined.start)):0;
  const medal=(i:number)=>i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
  const sortedClans=[...clans].sort((a,b)=>(clanScores[b.id]||0)-(clanScores[a.id]||0));

  return(
    <div style={{minHeight:"100vh",padding:"76px 16px 110px",background:G.bg,position:"relative"}}>
      <div className="arcade-grid"/>
      <div style={{maxWidth:480,margin:"0 auto",position:"relative",zIndex:1}}>
        <div style={{marginBottom:14}}>
          <div style={{color:"#c084fc",fontSize:10,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Compete</div>
          <div style={{color:"#fff",fontWeight:900,fontSize:26,letterSpacing:"-0.03em"}}>Tournaments & Clans</div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {([["tournament","🏟️ Tournament"],["raid","🐉 Boss Raid"],["clans","🛡️ Clans"]] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setSub(id)} className="press-fx" style={{flex:1,background:sub===id?"linear-gradient(135deg,rgba(168,85,247,0.25),rgba(96,165,250,0.12))":"rgba(255,255,255,0.04)",border:sub===id?"1px solid rgba(168,85,247,0.45)":"1px solid rgba(255,255,255,0.07)",borderRadius:14,color:sub===id?"#fff":"#8f7ca7",fontWeight:900,fontSize:13,padding:"12px 0",cursor:"pointer"}}>{label}</button>
          ))}
        </div>

        {sub==="tournament"&&(
          <div style={{display:"grid",gap:12}}>
            {prizeState&&(
              <div className="shine-card" style={{background:"linear-gradient(135deg,rgba(245,200,66,0.16),rgba(168,85,247,0.08))",border:"1.5px solid rgba(245,200,66,0.45)",borderRadius:20,padding:14,boxShadow:"0 0 36px rgba(245,200,66,0.18)"}}>
                <div style={{color:"#fff",fontWeight:900,marginBottom:4}}>🏆 You placed {medal(prizeState.rank-1)} last week!</div>
                <div style={{color:"#a794c3",fontSize:11.5,marginBottom:10}}>Prize: <b style={{color:"#f5c842"}}>+{fmt(prizeState.prize)} coins</b> + {TOUR_BADGES[prizeState.rank-1]?.emoji} <b style={{color:TOUR_BADGES[prizeState.rank-1]?.color}}>{TOUR_BADGES[prizeState.rank-1]?.label} badge</b>{prizeState.rank===1&&<> + <b style={{color:"#f5c842"}}>GOLD theme</b></>}</div>
                <button onClick={claimPrize} className="press-fx" style={{width:"100%",background:"linear-gradient(135deg,#f5c842,#f59e0b)",border:"none",borderRadius:12,color:"#1a0f00",fontWeight:900,fontSize:13,padding:"12px 0",cursor:"pointer"}}>Claim prize</button>
              </div>
            )}
            <div style={{background:"linear-gradient(135deg,rgba(168,85,247,0.10),rgba(96,165,250,0.05))",border:"1px solid rgba(168,85,247,0.25)",borderRadius:20,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:20}}>🏟️</span>
                <div style={{color:"#fff",fontWeight:900,flex:1}}>Weekly Tap Tournament</div>
                <span style={{background:"rgba(168,85,247,0.14)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:999,color:"#c084fc",fontSize:10.5,fontWeight:900,padding:"4px 10px"}}>{wk}</span>
              </div>
              <div style={{color:"#a794c3",fontSize:11.5,lineHeight:1.55,marginBottom:10}}>
                Race everyone on <b style={{color:"#fff"}}>coins earned this week</b>. Resets Monday.
                <span style={{display:"block",marginTop:6}}>🥇 <b style={{color:"#f5c842"}}>{fmt(TOUR_PRIZES[0])} coins + 👑 Champion badge + exclusive GOLD theme</b></span>
                <span style={{display:"block"}}>🥈 <b style={{color:"#e2e8f0"}}>{fmt(TOUR_PRIZES[1])} coins + Silver badge</b></span>
                <span style={{display:"block"}}>🥉 <b style={{color:"#f59e0b"}}>{fmt(TOUR_PRIZES[2])} coins + Bronze badge</b></span>
              </div>
              {!joined?(
                <button onClick={joinTournament} disabled={busy} className="press-fx" style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:12,color:"#fff",fontWeight:900,fontSize:13,padding:"13px 0",cursor:"pointer",boxShadow:"0 4px 20px rgba(168,85,247,0.35)"}}>{busy?"Joining…":"⚔️ Enter tournament — free"}</button>
              ):(
                <div style={{display:"flex",gap:10}}>
                  <div style={{flex:1,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{color:"#8f7ca7",fontSize:9.5,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase"}}>Your score</div>
                    <div style={{color:"#f5c842",fontWeight:900,fontSize:18}}>{fmt(myScore)}</div>
                  </div>
                  <div style={{flex:1,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{color:"#8f7ca7",fontSize:9.5,fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase"}}>Your rank</div>
                    <div style={{color:"#c084fc",fontWeight:900,fontSize:18}}>{myRank>0?`#${myRank}`:"—"}</div>
                  </div>
                </div>
              )}
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:14}}>
              <div style={{color:"#fff",fontWeight:900,marginBottom:10}}>Live standings</div>
              {loadingT?<div style={{color:"#8f7ca7",fontSize:12}}>Loading…</div>:
                standings.length===0?<div style={{color:"#8f7ca7",fontSize:12}}>No entries yet this week — be first 👑</div>:
                <div style={{display:"grid",gap:8}}>
                  {standings.slice(0,20).map((r,i)=>{
                    const me=r.player_id===playerId;
                    return(
                      <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,background:me?"linear-gradient(135deg,rgba(168,85,247,0.14),rgba(96,165,250,0.06))":i<3?"rgba(245,200,66,0.05)":"rgba(255,255,255,0.02)",border:me?"1px solid rgba(168,85,247,0.4)":"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"10px 12px"}}>
                        <span style={{width:30,fontWeight:900,fontSize:i<3?16:12,color:i<3?"#f5c842":"#6d5a86"}}>{medal(i)}</span>
                        <span style={{flex:1,color:me?"#c084fc":"#fff",fontWeight:800,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.data?.username||"anon"}{me&&" (you)"}</span>
                        <span style={{color:"#f5c842",fontWeight:900,fontSize:13}}>{fmt(r.data?.score||0)}</span>
                      </div>
                    );
                  })}
                </div>}
            </div>
          </div>
        )}

        {sub==="raid"&&<RaidSection playerId={playerId} username={username} charId={charId} totalEarned={totalEarned} onReward={onReward}/>}

        {sub==="clans"&&(
          <div style={{display:"grid",gap:12}}>
            {myClan?(()=>{
              const power=clanScores[myClan.id]||0;
              const tier=clanTier(power);
              const next=CLAN_TIERS[CLAN_TIERS.indexOf(tier)+1];
              const warSorted=[...clans].sort((a,b)=>(clanWar[b.id]||0)-(clanWar[a.id]||0));
              const warRank=warSorted.findIndex(c=>c.id===myClan.id)+1;
              const roster=[...(myClan.data.members||[])].sort((a,b)=>(memberScores[b]||0)-(memberScores[a]||0));
              const isLeader=myClan.data.leader===playerId;
              return(
              <div className="shine-card" style={{background:"linear-gradient(135deg,rgba(34,214,122,0.10),rgba(96,165,250,0.05))",border:"1.5px solid rgba(34,214,122,0.3)",borderRadius:20,padding:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:20}}>🛡️</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:"#fff",fontWeight:900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>[{myClan.data.tag}] {myClan.data.name}</div>
                    {myClan.data.motto&&<div style={{color:"#8f7ca7",fontSize:10.5,fontStyle:"italic"}}>&ldquo;{myClan.data.motto}&rdquo;</div>}
                  </div>
                  <span style={{background:`${tier.color}1a`,border:`1px solid ${tier.color}55`,borderRadius:999,color:tier.color,fontSize:10.5,fontWeight:900,padding:"4px 10px",whiteSpace:"nowrap"}}>{tier.emoji} {tier.name}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Power",fmt(power),"#f5c842"],["War score",fmt(clanWar[myClan.id]||0),"#f87171"],["War rank",warRank>0?`#${warRank}`:"—","#c084fc"]].map(([l,v,c])=>(
                    <div key={l as string} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"8px 6px",textAlign:"center"}}>
                      <div style={{color:"#8f7ca7",fontSize:9,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase"}}>{l}</div>
                      <div style={{color:c as string,fontWeight:900,fontSize:14}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(34,214,122,0.08)",border:"1px solid rgba(34,214,122,0.2)",borderRadius:12,padding:"9px 12px",color:"#7ef2b1",fontSize:11.5,fontWeight:800,marginBottom:10}}>⚡ Clan perk active: +10% coins on every tap</div>
                {next&&<div style={{color:"#8f7ca7",fontSize:10.5,marginBottom:10}}>Next tier: {next.emoji} <b style={{color:next.color}}>{next.name}</b> at {fmt(next.min)} power ({Math.min(100,Math.floor(power/next.min*100))}%)</div>}
                <div style={{color:"#fff",fontWeight:900,fontSize:12.5,marginBottom:8}}>Members ({roster.length})</div>
                <div style={{display:"grid",gap:6,marginBottom:10,maxHeight:220,overflowY:"auto"}}>
                  {roster.slice(0,30).map((m,i)=>(
                    <div key={m} style={{display:"flex",alignItems:"center",gap:8,background:m===playerId?"rgba(168,85,247,0.1)":"rgba(255,255,255,0.02)",border:m===playerId?"1px solid rgba(168,85,247,0.3)":"1px solid rgba(255,255,255,0.04)",borderRadius:10,padding:"7px 10px"}}>
                      <span style={{width:22,color:"#6d5a86",fontWeight:900,fontSize:11}}>#{i+1}</span>
                      <span style={{flex:1,color:m===playerId?"#c084fc":"#fff",fontWeight:800,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m===myClan.data.leader&&"👑 "}{memberNames[m]||"anon"}{m===playerId&&" (you)"}</span>
                      <span style={{color:"#f5c842",fontWeight:900,fontSize:11.5}}>{fmt(memberScores[m]||0)}</span>
                    </div>
                  ))}
                </div>
                {isLeader&&(
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    <input value={cName} onChange={e=>setCName(e.target.value)} placeholder="Set clan motto…" maxLength={60} style={{flex:1,minWidth:0,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",fontSize:12,fontWeight:600,padding:"10px 12px",outline:"none"}}/>
                    <button onClick={async()=>{const motto=cName.trim();if(!motto||busy)return;setBusy(true);try{const {supabase}=await import("@/lib/supabase");await supabase.from("dt_security_events").update({data:{...myClan.data,motto}}).eq("id",myClan.id);setCName("");await fetchClans();}catch{};setBusy(false);}} disabled={busy||!cName.trim()} className="press-fx" style={{background:"linear-gradient(135deg,#60a5fa,#a855f7)",border:"none",borderRadius:10,color:"#fff",fontWeight:900,fontSize:11.5,padding:"0 14px",cursor:"pointer"}}>Save</button>
                  </div>
                )}
                <ClanChat playerId={playerId} username={username} clanId={myClan.id}/>
                <button onClick={leaveClan} disabled={busy} className="press-fx" style={{width:"100%",background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:12,color:"#f87171",fontWeight:900,fontSize:12.5,padding:"11px 0",cursor:"pointer",marginTop:10}}>Leave clan</button>
              </div>
              );})():(
              <div style={{background:"linear-gradient(135deg,rgba(96,165,250,0.08),rgba(168,85,247,0.05))",border:"1px solid rgba(96,165,250,0.22)",borderRadius:20,padding:14}}>
                <div style={{color:"#fff",fontWeight:900,marginBottom:8}}>⚒️ Found a clan</div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={cName} onChange={e=>setCName(e.target.value)} placeholder="Clan name" maxLength={24} style={{flex:2,minWidth:0,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",fontSize:13,fontWeight:600,padding:"11px 12px",outline:"none"}}/>
                  <input value={cTag} onChange={e=>setCTag(e.target.value.toUpperCase())} placeholder="TAG" maxLength={5} style={{flex:1,minWidth:0,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#c084fc",fontSize:13,fontWeight:900,padding:"11px 12px",outline:"none",textTransform:"uppercase"}}/>
                </div>
                <button onClick={createClan} disabled={busy||cName.trim().length<3||cTag.trim().length<2} className="press-fx" style={{width:"100%",background:cName.trim().length>=3&&cTag.trim().length>=2?"linear-gradient(135deg,#60a5fa,#a855f7)":"rgba(255,255,255,0.05)",border:"none",borderRadius:12,color:cName.trim().length>=3&&cTag.trim().length>=2?"#fff":"#556",fontWeight:900,fontSize:13,padding:"12px 0",cursor:"pointer"}}>{busy?"Creating…":"Create clan"}</button>
              </div>
            )}
            <div style={{background:"linear-gradient(135deg,rgba(248,113,113,0.08),rgba(168,85,247,0.05))",border:"1px solid rgba(248,113,113,0.22)",borderRadius:20,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:18}}>⚔️</span>
                <div style={{color:"#fff",fontWeight:900,flex:1}}>Clan War — this week</div>
                <span style={{background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:999,color:"#fca5a5",fontSize:10,fontWeight:900,padding:"4px 10px"}}>{wk}</span>
              </div>
              <div style={{color:"#a794c3",fontSize:11,lineHeight:1.5,marginBottom:10}}>Every member&apos;s tournament score counts for the clan. Get your whole clan into the tournament and stack war score.</div>
              {(()=>{const ws=[...clans].sort((a,b)=>(clanWar[b.id]||0)-(clanWar[a.id]||0)).filter(c=>(clanWar[c.id]||0)>0).slice(0,10);
                return ws.length===0?<div style={{color:"#8f7ca7",fontSize:12}}>No war scores yet — enter the tournament to put your clan on the board ⚔️</div>:
                <div style={{display:"grid",gap:6}}>
                  {ws.map((c,i)=>{const mine=myClan?.id===c.id;return(
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,background:mine?"rgba(248,113,113,0.1)":"rgba(255,255,255,0.02)",border:mine?"1px solid rgba(248,113,113,0.35)":"1px solid rgba(255,255,255,0.04)",borderRadius:12,padding:"8px 12px"}}>
                      <span style={{width:28,fontWeight:900,fontSize:i<3?15:11,color:i<3?"#f5c842":"#6d5a86"}}>{medal(i)}</span>
                      <span style={{flex:1,color:mine?"#fca5a5":"#fff",fontWeight:800,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>[{c.data?.tag}] {c.data?.name}</span>
                      <span style={{color:"#f87171",fontWeight:900,fontSize:12.5}}>{fmt(clanWar[c.id]||0)}</span>
                    </div>);})}
                </div>;})()}
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:14}}>
              <div style={{color:"#fff",fontWeight:900,marginBottom:4}}>Clan leaderboard</div>
              <div style={{color:"#8f7ca7",fontSize:10.5,marginBottom:10}}>All clan members get a permanent <b style={{color:"#7ef2b1"}}>+10% tap income perk</b></div>
              {loadingC?<div style={{color:"#8f7ca7",fontSize:12}}>Loading…</div>:
                sortedClans.length===0?<div style={{color:"#8f7ca7",fontSize:12}}>No clans yet — found the first one 🛡️</div>:
                <div style={{display:"grid",gap:8}}>
                  {sortedClans.slice(0,25).map((c,i)=>{
                    const mine=myClan?.id===c.id;
                    const tier=clanTier(clanScores[c.id]||0);
                    return(
                      <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,background:mine?"linear-gradient(135deg,rgba(34,214,122,0.1),rgba(96,165,250,0.04))":i<3?"rgba(245,200,66,0.05)":"rgba(255,255,255,0.02)",border:mine?"1px solid rgba(34,214,122,0.35)":"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"10px 12px"}}>
                        <span style={{width:30,fontWeight:900,fontSize:i<3?16:12,color:i<3?"#f5c842":"#6d5a86"}}>{medal(i)}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{color:mine?"#7ef2b1":"#fff",fontWeight:800,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tier.emoji} [{c.data?.tag}] {c.data?.name}</div>
                          <div style={{color:"#6d5a86",fontSize:10.5,fontWeight:600}}><span style={{color:tier.color,fontWeight:800}}>{tier.name}</span> · {(c.data?.members||[]).length} members · Power {fmt(clanScores[c.id]||0)}</div>
                        </div>
                        {!myClan&&<button onClick={()=>joinClan(c)} disabled={busy} className="press-fx" style={{background:"linear-gradient(135deg,#22d67a,#16a34a)",border:"none",borderRadius:10,color:"#04210f",fontWeight:900,fontSize:11.5,padding:"8px 14px",cursor:"pointer",whiteSpace:"nowrap"}}>Join</button>}
                      </div>
                    );
                  })}
                </div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HOME TAB (glass) ────────────────────────────────────────────────────────
// ─── GAMES TAB (minigames hub) ──────────────────────────────────────────────
function GamesTab({playerId,coins,boostMult,boostLeft,onChestOpen,onWheelWin,dayStats,onQuestClaim,onCasino}:{
  playerId:string;coins:number;boostMult:number;boostLeft:number;
  onChestOpen:(cost:number,res:ChestResult)=>void;onWheelWin:(coins:number,paid:number)=>void;
  dayStats:Record<string,number>;onQuestClaim:(reward:number,allDone:boolean)=>void;onCasino:(delta:number,msg:string)=>void;
}){
  return(
    <div style={{minHeight:"100vh",background:G.bg,paddingTop:52,paddingBottom:110,overflowY:"auto",position:"relative"}}>
      <div className="arcade-grid"/>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% -10%,rgba(245,200,66,0.14) 0%,transparent 55%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 16px"}}>
        {/* Header */}
        <div style={{textAlign:"center",padding:"24px 0 6px"}} className="anim-slideup">
          <div className="neon-flicker" style={{color:"rgba(245,200,66,0.8)",fontSize:10.5,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.24em",marginBottom:6,textShadow:"0 0 16px rgba(245,200,66,0.6)"}}>◆ DEGEN ARCADE ◆</div>
          <h2 style={{color:"#fff",fontWeight:900,fontSize:30,margin:"0 0 6px",letterSpacing:"-0.03em"}}>🎰 Game Room</h2>
          <div style={{color:"#8b79a9",fontSize:12.5,fontWeight:600,marginBottom:8}}>Spin, gamble, open chests & clear quests</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"linear-gradient(135deg,rgba(245,200,66,0.12),rgba(245,200,66,0.04))",border:"1px solid rgba(245,200,66,0.3)",borderRadius:16,padding:"8px 18px",boxShadow:"0 0 20px rgba(245,200,66,0.1)",marginBottom:14}}>
            <span style={{fontSize:17}}>💰</span>
            <span style={{fontSize:16,fontWeight:900,color:G.gold,fontVariantNumeric:"tabular-nums",textShadow:"0 0 14px rgba(245,200,66,0.4)"}}>{fmt(coins)}</span>
            <span style={{fontSize:9,color:"#8b79a9",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>$DEGEN</span>
          </div>
        </div>
        <DailyQuestsCard playerId={playerId} dayStats={dayStats} onClaim={onQuestClaim}/>
        <WheelCard playerId={playerId} coins={coins} onWin={onWheelWin}/>
        <CasinoCard coins={coins} onResult={onCasino}/>
        <LuckyChests coins={coins} boostMult={boostMult} boostLeft={boostLeft} onOpen={onChestOpen}/>
      </div>
    </div>
  );
}

function HomeTab({onPlay,onGames,username,avatar,avatarUrl,totalEarned,totalTaps,level,rank,xpProgress,nextRank,charId,playerId,onClaimDaily}:{
  onPlay:()=>void;onGames:()=>void;username:string;avatar:string;avatarUrl?:string;totalEarned:number;totalTaps:number;
  level:number;rank:ReturnType<typeof getRankFromLevel>;xpProgress:{pct:number;current:number;needed:number};
  nextRank:ReturnType<typeof getNextRank>;charId:string|null;playerId:string;onClaimDaily:(reward:number,streak:number)=>void;
}){
  const cd=useCountdown();
  const char=CHARACTERS.find(c=>c.id===charId);
  const glow=char?char.glow:"168,85,247";

  return(
    <div style={{minHeight:"100vh",background:G.bg,paddingTop:52,paddingBottom:110,overflowY:"auto",position:"relative"}}>
      <div className="arcade-grid"/>
      <div style={{position:"fixed",inset:0,background:`radial-gradient(ellipse at 50% -10%,rgba(${glow},0.28) 0%,transparent 55%)`,pointerEvents:"none",zIndex:0,transition:"background 1.5s"}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 16px"}}>

        {/* ── Hero ── */}
        <div style={{textAlign:"center",padding:"26px 0 18px"}} className="anim-slideup">
          <div style={{position:"relative",width:116,height:116,margin:"0 auto 14px"}}>
            {/* Spinning ring */}
            <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`1.5px solid rgba(${glow},0.25)`,borderTopColor:`rgba(${glow},0.9)`,animation:"ringSpin 5s linear infinite"}}/>
            <div style={{position:"absolute",inset:-14,borderRadius:"50%",border:`1px dashed rgba(${glow},0.12)`,animation:"ringSpinRev 11s linear infinite"}}/>
            {/* Avatar with float */}
            <div className="char-idle" style={{position:"absolute",inset:0}}>
              <div style={{
                width:"100%",height:"100%",borderRadius:"50%",
                background:`radial-gradient(ellipse,rgba(${glow},0.25),rgba(6,0,15,0.85) 75%)`,
                border:`2.5px solid rgba(${glow},0.5)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:60,lineHeight:1,overflow:"hidden",
                boxShadow:`0 0 50px rgba(${glow},0.35), inset 0 0 30px rgba(${glow},0.1)`,
              }}>
                {avatarUrl
                  ?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>{}}/>
                  :<span style={{filter:`drop-shadow(0 0 16px rgba(${glow},0.7))`}}>{avatar||"🐸"}</span>
                }
              </div>
            </div>
          </div>
          <div style={{color:`rgba(${glow},0.7)`,fontSize:10.5,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.22em",marginBottom:5,textShadow:`0 0 14px rgba(${glow},0.5)`}} className="neon-flicker">◆ Welcome back ◆</div>
          <h2 style={{color:"#fff",fontWeight:900,fontSize:28,marginBottom:12,letterSpacing:"-0.03em"}}>{username||"Degen"}</h2>

          {/* Rank badge */}
          <div className="shine-card" style={{
            display:"inline-flex",alignItems:"center",gap:9,
            background:`linear-gradient(135deg,rgba(${glow},0.14),rgba(${glow},0.05))`,
            border:`1.5px solid rgba(${glow},0.35)`,
            borderRadius:26,padding:"9px 20px",
            boxShadow:`0 0 26px rgba(${glow},0.15)`,
          }}>
            <span style={{fontSize:19,filter:`drop-shadow(0 0 8px ${rank.color})`}}>{rank.emoji}</span>
            <span style={{color:rank.color,fontWeight:900,fontSize:15,textShadow:`0 0 14px ${rank.color}66`}}>{rank.name}</span>
            <span style={{
              background:"rgba(255,255,255,0.09)",borderRadius:13,
              color:"#bbb",fontSize:11,fontWeight:800,padding:"3px 9px",
              border:"1px solid rgba(255,255,255,0.08)",
            }}>Lv.{level}</span>
          </div>
        </div>

        {/* ── XP bar ── */}
        <div className="anim-slideup" style={{background:G.glass,border:`1px solid ${G.border}`,borderRadius:20,padding:"15px 16px",marginBottom:12,animationDelay:"0.06s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{color:"#8b79a9",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em"}}>XP Progress</span>
            {nextRank&&<span style={{color:nextRank.color,fontSize:10.5,fontWeight:800}}>{nextRank.emoji} Next: {nextRank.name}</span>}
          </div>
          <div style={{height:10,background:"rgba(255,255,255,0.05)",borderRadius:6,overflow:"hidden",marginBottom:7,border:"1px solid rgba(255,255,255,0.04)"}}>
            <div style={{height:"100%",width:`${xpProgress.pct}%`,background:`linear-gradient(90deg,${rank.color}77,${rank.color})`,borderRadius:6,transition:"width 0.8s ease",boxShadow:`0 0 16px ${rank.color}88`,animation:"xpFill 1.2s cubic-bezier(0.16,1,0.3,1)"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{color:"#8b79a9",fontSize:10,fontWeight:600}}>{fmt(xpProgress.current)} XP</span>
            <span style={{color:"#8b79a9",fontSize:10,fontWeight:600}}>{fmt(xpProgress.needed)} XP to level up</span>
          </div>
        </div>

        {/* ── Daily streak chest ── */}
        <DailyStreakCard playerId={playerId} level={level} onClaim={onClaimDaily}/>

        {/* ── Game Room teaser ── */}
        <button onClick={onGames} className="press-fx anim-slideup shine-card" style={{
          width:"100%",textAlign:"left",display:"flex",alignItems:"center",gap:14,
          background:"linear-gradient(135deg,rgba(245,200,66,0.1),rgba(245,158,11,0.04))",
          border:"1.5px solid rgba(245,200,66,0.3)",
          borderRadius:20,padding:"15px 16px",marginBottom:12,cursor:"pointer",
          boxShadow:"0 0 28px rgba(245,200,66,0.08)",animationDelay:"0.08s",
        }}>
          <span style={{fontSize:34,filter:"drop-shadow(0 0 12px rgba(245,200,66,0.5))"}}>🎰</span>
          <span style={{flex:1,minWidth:0}}>
            <span style={{display:"block",color:"#f5c842",fontWeight:900,fontSize:15,letterSpacing:"-0.01em",marginBottom:2}}>Game Room</span>
            <span style={{display:"block",color:"#8b79a9",fontSize:11,lineHeight:1.4}}>Daily quests · Wheel · Casino · Lucky chests</span>
          </span>
          <span style={{color:"#f5c842",fontWeight:900,fontSize:18}}>→</span>
        </button>

        <FriendsCard playerId={playerId} username={username} totalEarned={totalEarned}/>

        {/* ── Stats row ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
          {[
            {emoji:"💰",label:"Earned",value:fmt(totalEarned),color:G.gold,glow:"245,200,66"},
            {emoji:"👆",label:"Total Taps",value:fmt(totalTaps),color:"#c084fc",glow:"168,85,247"},
            {emoji:"⏱",label:"Next Payout",value:cd,color:G.green,glow:"34,214,122"},
          ].map((s,i)=>(
            <div key={s.label} className="anim-slideup shine-card" style={{
              background:`linear-gradient(160deg,rgba(${s.glow},0.07),rgba(${s.glow},0.015))`,
              border:`1px solid rgba(${s.glow},0.18)`,
              borderRadius:18,padding:"15px 8px",textAlign:"center",
              boxShadow:`inset 0 1px 0 rgba(255,255,255,0.05)`,
              animationDelay:`${0.1+i*0.05}s`,
            }}>
              <div style={{fontSize:23,marginBottom:6,filter:`drop-shadow(0 0 10px rgba(${s.glow},0.5))`}}>{s.emoji}</div>
              <div style={{color:s.color,fontWeight:900,fontSize:13.5,fontVariantNumeric:"tabular-nums",marginBottom:3,textShadow:`0 0 14px rgba(${s.glow},0.4)`}}>{s.value}</div>
              <div style={{color:"#8b79a9",fontSize:8.5,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Active character card ── */}
        {char?(
          <div className="anim-slideup shine-card" style={{
            background:`linear-gradient(135deg,rgba(${char.glow},0.1),rgba(${char.glow},0.03))`,
            border:`1.5px solid rgba(${char.glow},0.3)`,
            borderRadius:20,padding:"16px",marginBottom:12,
            boxShadow:`0 0 34px rgba(${char.glow},0.1)`,
            animationDelay:"0.2s",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div className="char-breathe" style={{
                width:64,height:64,borderRadius:"50%",flexShrink:0,overflow:"hidden",
                background:`radial-gradient(ellipse,rgba(${char.glow},0.25),rgba(6,0,15,0.85))`,
                border:`2px solid rgba(${char.glow},0.5)`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,
                boxShadow:`0 0 24px rgba(${char.glow},0.35)`,
              }}>
                <img src={char.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}} onError={e=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<span style="font-size:36px">${char.emoji}</span>`;}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:`rgba(${char.glow},0.65)`,fontSize:9.5,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:3}}>Active Legend</div>
                <div style={{color:"#fff",fontWeight:900,fontSize:18,marginBottom:5,letterSpacing:"-0.01em"}}>{char.name}</div>
                <div style={{
                  display:"inline-flex",gap:5,alignItems:"center",
                  background:`rgba(${char.glow},0.12)`,
                  border:`1px solid rgba(${char.glow},0.25)`,
                  borderRadius:9,padding:"3px 9px",
                }}>
                  <span style={{fontSize:10}}>⚡</span>
                  <span style={{color:`rgb(${char.glow})`,fontSize:10.5,fontWeight:800}}>{char.ability}</span>
                </div>
              </div>
              <button onClick={onPlay} className="press-fx" style={{
                background:`linear-gradient(135deg,rgba(${char.glow},0.18),rgba(${char.glow},0.08))`,
                border:`1.5px solid rgba(${char.glow},0.4)`,
                borderRadius:13,color:`rgb(${char.glow})`,
                fontWeight:900,fontSize:11,padding:"10px 14px",cursor:"pointer",flexShrink:0,
                boxShadow:`0 0 14px rgba(${char.glow},0.15)`,
              }}>Switch</button>
            </div>
          </div>
        ):(
          <div className="anim-slideup" style={{background:G.glass,border:`1px solid ${G.border}`,borderRadius:20,padding:"22px",textAlign:"center",marginBottom:12,animationDelay:"0.2s"}}>
            <div style={{fontSize:36,marginBottom:8,animation:"charFloat 3s ease-in-out infinite"}}>🎭</div>
            <div style={{color:"#6b5a8a",fontSize:13,marginBottom:12,fontWeight:600}}>No legend selected yet</div>
            <button onClick={onPlay} className="press-fx" style={{background:"linear-gradient(135deg,#6d28d9,#a855f7)",border:"none",borderRadius:13,color:"#fff",fontWeight:900,fontSize:13,padding:"11px 22px",cursor:"pointer",boxShadow:"0 0 24px rgba(168,85,247,0.35)"}}>Pick Your Legend →</button>
          </div>
        )}

        {/* ── Big play CTA ── */}
        <button onClick={onPlay} className="press-fx anim-slideup" style={{
          width:"100%",
          background:"linear-gradient(135deg,#5b21b6,#7c3aed,#a855f7)",
          color:"#fff",fontWeight:900,fontSize:19,border:"1.5px solid rgba(192,132,252,0.45)",borderRadius:22,
          padding:"21px",cursor:"pointer",letterSpacing:"-0.01em",
          boxShadow:"0 0 60px rgba(168,85,247,0.5), 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          position:"relative",overflow:"hidden",marginBottom:16,
          animationDelay:"0.25s",
        }}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.14),transparent 60%)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:0,bottom:0,width:"40%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",animation:"shineSweep 3.2s ease-in-out infinite",pointerEvents:"none"}}/>
          <span style={{position:"relative",zIndex:1,textShadow:"0 2px 12px rgba(0,0,0,0.4)"}}>🎮 PLAY NOW</span>
        </button>

        {/* ── Who's Online ── */}
        <div className="anim-slideup" style={{background:"rgba(34,214,122,0.045)",border:"1px solid rgba(34,214,122,0.14)",borderRadius:16,padding:"12px 14px",marginBottom:16,animationDelay:"0.3s"}}>
          <OnlineStrip/>
        </div>

        {/* ── Feature grid ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {emoji:"🔥",title:"Combo System",desc:"Tap fast to stack up to 20× coin multiplier",glow:"249,115,22"},
            {emoji:"🤖",title:"Auto-Tappers",desc:"Hire helpers to earn taps while AFK",glow:"59,130,246"},
            {emoji:"⚡",title:"300+ Upgrades",desc:"Massive upgrade catalog across every stat",glow:"245,200,66"},
            {emoji:"🏆",title:"Win USDC",desc:"Top 20 earn USDC every 7 days",glow:"34,214,122"},
          ].map((f,i)=>(
            <div key={f.title} className="anim-slideup" style={{
              background:`linear-gradient(160deg,rgba(${f.glow},0.06),rgba(${f.glow},0.012))`,
              border:`1px solid rgba(${f.glow},0.15)`,
              borderRadius:16,padding:"16px 14px",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)",
              animationDelay:`${0.35+i*0.05}s`,
            }}>
              <div style={{fontSize:27,marginBottom:8,filter:`drop-shadow(0 0 10px rgba(${f.glow},0.45))`}}>{f.emoji}</div>
              <div style={{color:"#eee",fontWeight:900,fontSize:13,marginBottom:4,letterSpacing:"-0.01em"}}>{f.title}</div>
              <div style={{color:"#8b79a9",fontSize:10.5,lineHeight:1.5}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD TAB → SUBMIT SCORE (no player-facing leaderboard) ──────────────────
// Leaderboard is admin-only. Players see the Submit Score screen here.
// Podium avatar — module-level so React keeps identity stable across 1s data refreshes
const PODIUM_MEDAL=["#f5c842","#d8dbe8","#d49058"];
const PODIUM_HEIGHT=[92,64,48];
function PodiumAvatar({p,pos,isMe}:{p:LBEntry;pos:number;isMe:boolean}){
  const mc=PODIUM_MEDAL[pos];
  const sizeBig=pos===0;
  const sz=sizeBig?76:60;
  const charEmoji=({"pepe":"🐸","gigachad":"💪","trump":"🎩","troll":"🧌","bonk":"🐕"} as Record<string,string>)[p.character]||"🐸";
  const glow=(CHARACTERS.find(ch=>ch.id===p.character)||CHARACTERS[0]).glow;
  const fmtTaps=(n:number)=>{if(!n)return"0";if(n>=1e9)return(n/1e9).toFixed(1)+"B";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return Math.floor(n).toString();};
  const barGlow=pos===0?"245,200,66":pos===1?"216,219,232":"212,144,88";
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,minWidth:0}}>
      {pos===0&&<div style={{fontSize:26,marginBottom:-4,animation:"crownBob 2.4s ease-in-out infinite",filter:"drop-shadow(0 0 10px rgba(245,200,66,0.8))",zIndex:2}}>👑</div>}
      <div style={{position:"relative",marginBottom:8}}>
        <div style={{
          width:sz,height:sz,borderRadius:"50%",overflow:"hidden",
          border:`2.5px solid ${mc}`,
          background:`radial-gradient(ellipse,rgba(${glow},0.25),rgba(6,0,15,0.9))`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:sizeBig?38:28,
          boxShadow:`0 0 ${sizeBig?28:16}px ${mc}66`,
          animation:pos===0?"podiumGlow 2.8s ease-in-out infinite":"none",
        }}>
          {p.avatar_url?<img src={p.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:charEmoji}
        </div>
        {isOnline(p.last_seen)&&<span className="live-dot" style={{position:"absolute",bottom:2,right:2,border:"2px solid #06000f",width:11,height:11}}/>}
      </div>
      <div style={{color:isMe?"#c084fc":"#fff",fontWeight:900,fontSize:sizeBig?14:12,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textShadow:isMe?"0 0 12px rgba(192,132,252,0.6)":"none"}}>{p.username||"Degen"}</div>
      <div style={{color:mc,fontWeight:900,fontSize:sizeBig?16:13,fontVariantNumeric:"tabular-nums",textShadow:`0 0 14px ${mc}55`,marginBottom:8}}>{fmtTaps(p.games_played)}</div>
      <div style={{
        width:"82%",height:PODIUM_HEIGHT[pos],borderRadius:"10px 10px 0 0",
        background:`linear-gradient(to top, rgba(${barGlow},0.04), rgba(${barGlow},0.16))`,
        border:`1px solid ${mc}33`,borderBottom:"none",
        display:"flex",alignItems:"center",justifyContent:"center",
        color:mc,fontSize:sizeBig?26:20,fontWeight:900,
        textShadow:`0 0 16px ${mc}`,
      }}>{pos+1}</div>
    </div>
  );
}

function LeaderboardTab({myPlayerId,liveTaps,liveEarned,liveUsername,liveAvatarUrl,liveCharId}:{myPlayerId:string;liveTaps:number;liveEarned:number;liveUsername:string;liveAvatarUrl?:string;liveCharId:string}){
  const [leaders,setLeaders]=useState<LBEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const cd=useCountdown();
  const lastJsonRef=useRef("");
  useEffect(()=>{
    let active=true;
    const fetchLeaders=async()=>{
      try{
        const resp=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players?select=id,wallet_address,username,character,total_score,games_played,avatar_url,last_seen&order=games_played.desc&limit=50`,{
          headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${SUPA_KEY_CONST}`,"Cache-Control":"no-cache, no-store"},
          cache:"no-store",
        });
        if(resp.ok&&active){
          const text=await resp.text();
          // Only re-render when data actually changed — avoids restarting CSS animations every second
          if(text!==lastJsonRef.current){lastJsonRef.current=text;setLeaders(JSON.parse(text));}
          setLoading(false);
        }
      }catch{if(active)setLoading(false);}
    };
    fetchLeaders();
    const iv=setInterval(fetchLeaders,1000);
    return()=>{active=false;clearInterval(iv);};
  },[]);
  const fmtTaps=(n:number)=>{if(!n)return"0";if(n>=1e9)return(n/1e9).toFixed(1)+"B";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return Math.floor(n).toString();};
  const charEmoji=(c:string)=>({"pepe":"🐸","gigachad":"💪","trump":"🎩","troll":"🧌","bonk":"🐕"}[c]||"🐸");
  const charGlow=(c:string)=>(CHARACTERS.find(ch=>ch.id===c)||CHARACTERS[0]).glow;
  const displayLeaders=leaders.map(l=>l.wallet_address===myPlayerId?{...l,games_played:Math.max(l.games_played,liveTaps),total_score:Math.max(l.total_score,liveEarned),username:liveUsername||l.username}:l).sort((a,b)=>b.games_played-a.games_played);
  const top3=displayLeaders.slice(0,3);
  const rest=displayLeaders.slice(3);
  const podiumOrder=[1,0,2]; // silver left, gold center, bronze right

  return(
    <div style={{flex:1,overflowY:"auto",paddingTop:60,paddingBottom:110,minHeight:"100vh",background:G.bg,position:"relative"}}>
      <div className="arcade-grid"/>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% -10%,rgba(245,200,66,0.12) 0%,transparent 55%)",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 16px"}}>
        {/* Header */}
        <div style={{textAlign:"center",padding:"14px 0 4px"}}>
          <div style={{
            display:"inline-block",fontSize:11,fontWeight:800,letterSpacing:"0.22em",
            color:"#f5c842",textTransform:"uppercase",
            textShadow:"0 0 18px rgba(245,200,66,0.7)",marginBottom:6,
          }} className="neon-flicker">★ HALL OF LEGENDS ★</div>
          <h2 style={{color:"#fff",fontWeight:900,fontSize:26,margin:"0 0 6px",letterSpacing:"-0.03em"}}>Leaderboard</h2>
          <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(34,214,122,0.07)",border:"1px solid rgba(34,214,122,0.18)",borderRadius:20,padding:"5px 14px"}}>
            <span className="live-dot"/>
            <span style={{color:"#22d67a",fontSize:11,fontWeight:700}}>LIVE — updates every second</span>
          </div>
        </div>

        {/* Prize banner */}
        <div className="shine-card" style={{
          margin:"14px 0",background:"linear-gradient(135deg,rgba(245,200,66,0.08),rgba(168,85,247,0.06))",
          border:"1px solid rgba(245,200,66,0.22)",borderRadius:16,padding:"11px 16px",
          display:"flex",alignItems:"center",gap:10,
        }}>
          <span style={{fontSize:22,animation:"coinSpin 3s ease-in-out infinite",display:"inline-block"}}>🏆</span>
          <div style={{flex:1}}>
            <div style={{color:"#f5c842",fontWeight:900,fontSize:12.5}}>Top 20 win USDC every week</div>
            <div style={{color:"#6b5a8a",fontSize:10.5,marginTop:1}}>Next payout in <span style={{color:"#22d67a",fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{cd}</span></div>
          </div>
        </div>

        {loading&&<div style={{textAlign:"center",color:"#6b5a8a",padding:50,fontSize:13}}>Summoning legends…</div>}
        {!loading&&displayLeaders.length===0&&<div style={{textAlign:"center",color:"#6b5a8a",padding:50}}>No players yet — be the first!</div>}

        {/* Podium */}
        {!loading&&top3.length>0&&(
          <div style={{display:"flex",alignItems:"flex-end",gap:6,padding:"10px 4px 0",marginBottom:4}}>
            {podiumOrder.map(pos=>top3[pos]?<PodiumAvatar key={top3[pos].id} p={top3[pos]} pos={pos} isMe={top3[pos].wallet_address===myPlayerId}/>:<div key={pos} style={{flex:1}}/>)}
          </div>
        )}
        {/* Podium base line */}
        {!loading&&top3.length>0&&<div style={{height:2,background:"linear-gradient(90deg,transparent,rgba(245,200,66,0.4),transparent)",marginBottom:16,boxShadow:"0 0 14px rgba(245,200,66,0.3)"}}/>}

        {/* Rest of the list */}
        {!loading&&rest.map((p,i)=>{
          const isMe=p.wallet_address===myPlayerId;
          const rank=i+4;
          return(
            <div key={p.id} style={{
              margin:"7px 0",
              background:isMe?"linear-gradient(135deg,rgba(168,85,247,0.16),rgba(168,85,247,0.07))":"rgba(255,255,255,0.025)",
              border:isMe?"1px solid rgba(168,85,247,0.45)":"1px solid rgba(255,255,255,0.05)",
              borderRadius:16,padding:"11px 14px",display:"flex",alignItems:"center",gap:12,
              boxShadow:isMe?"0 0 24px rgba(168,85,247,0.15)":"none",
            }}>
              <div style={{width:30,textAlign:"center",fontSize:13,fontWeight:900,color:isMe?"#c084fc":"#4d4d6b",fontVariantNumeric:"tabular-nums"}}>#{rank}</div>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:38,height:38,borderRadius:"50%",overflow:"hidden",background:`radial-gradient(ellipse,rgba(${charGlow(p.character)},0.22),rgba(6,0,15,0.9))`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:isMe?"2px solid #a855f7":`1.5px solid rgba(${charGlow(p.character)},0.3)`}}>
                  {p.avatar_url?<img src={p.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:charEmoji(p.character)}
                </div>
                {isOnline(p.last_seen)&&<span className="live-dot" style={{position:"absolute",bottom:0,right:0,border:"2px solid #06000f",width:10,height:10}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:isMe?"#c084fc":"#e0d4f0",fontWeight:800,fontSize:13.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.username||"Degen"}{isMe&&" (you)"}</div>
                <div style={{color:"#4d4d6b",fontSize:10.5}}>{charEmoji(p.character)} {(CHARACTERS.find(c=>c.id===p.character)||CHARACTERS[0]).name}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{color:"#f5c842",fontWeight:900,fontSize:14.5,fontVariantNumeric:"tabular-nums"}}>{fmtTaps(p.games_played)}</div>
                <div style={{color:"#4d4d6b",fontSize:9.5,textTransform:"uppercase",letterSpacing:"0.06em"}}>taps</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ─── SUBMIT SCORE SECTION ─────────────────────────────────────────────────────
function SubmitScoreSection({myPlayerId,liveTaps,liveEarned,liveUsername,liveCharId}:{myPlayerId:string;liveTaps:number;liveEarned:number;liveUsername:string;liveCharId:string}){
  const SUPA_URL=SUPA_URL_CONST;
  const SUPA_KEY=SUPA_KEY_CONST;
  const [state,setState]=useState<"idle"|"uploading"|"done"|"error">("idle");
  const [msg,setMsg]=useState("");
  const fileRef=useRef<HTMLInputElement>(null);

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(!file||!myPlayerId){setMsg("Please log in first.");setState("error");return;}
    setState("uploading");setMsg("Uploading screenshot…");
    try{
      const ext=file.name.split(".").pop()||"png";
      const fname=`${myPlayerId}_${Date.now()}.${ext}`;
      // Upload to Supabase storage
      let authToken=SUPA_KEY;
      try{const{supabase}=await import("@/lib/supabase");const{data:{session}}=await supabase.auth.getSession();if(session?.access_token)authToken=session.access_token;}catch{}
      const upResp=await fetch(`${SUPA_URL}/storage/v1/object/score-screenshots/${fname}`,{
        method:"POST",
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${authToken}`,"Content-Type":file.type,"Cache-Control":"3600","x-upsert":"true"},
        body:file,
      });
      if(!upResp.ok){const t=await upResp.text();throw new Error(t);}
      const screenshotUrl=`${SUPA_URL}/storage/v1/object/public/score-screenshots/${fname}`;
      // Insert submission record
      const subResp=await fetch(`${SUPA_URL}/rest/v1/dt_submissions`,{
        method:"POST",
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({player_id:myPlayerId,username:liveUsername,screenshot_url:screenshotUrl,taps_claimed:Math.floor(liveTaps)||0,earned_claimed:String(Math.round(liveEarned)||0),level_claimed:getLevelFromXP(liveEarned)}),
      });
      if(!subResp.ok){const t=await subResp.text();throw new Error(t);}
      setState("done");setMsg("Score submitted! ✅");
    }catch(err){setState("error");setMsg("Upload failed: "+(err instanceof Error?err.message:"Unknown error"));console.error(err);}
  }

  return(
    <div style={{margin:"20px 16px 100px",background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.25)",borderRadius:20,padding:24,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>📸</div>
      <div style={{color:"#c084fc",fontWeight:900,fontSize:16,marginBottom:6}}>Submit Your Score</div>
      <div style={{color:"#888",fontSize:12,marginBottom:16,lineHeight:1.5}}>
        Go to your <span style={{color:"#f5c842"}}>Home tab</span> and screenshot your stats,<br/>
        then upload it here as proof of your score.
      </div>
      {state==="idle"&&(
        <button onClick={()=>fileRef.current?.click()} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:14,padding:"12px 28px",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 20px rgba(168,85,247,0.4)"}}>
          📤 Upload Screenshot
        </button>
      )}
      {state==="uploading"&&<div style={{color:"#a855f7",fontWeight:700,fontSize:14}}>⏳ {msg}</div>}
      {state==="done"&&<div style={{color:"#22d67a",fontWeight:800,fontSize:15}}>{msg}</div>}
      {state==="error"&&(
        <div>
          <div style={{color:"#f87171",fontSize:12,marginBottom:10}}>{msg}</div>
          <button onClick={()=>{setState("idle");setMsg("");}} style={{background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.4)",borderRadius:10,padding:"8px 20px",color:"#c084fc",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            Try Again
          </button>
        </div>
      )}
      {state==="done"&&(
        <button onClick={()=>{setState("idle");setMsg("");}} style={{background:"rgba(34,214,122,0.1)",border:"1px solid rgba(34,214,122,0.3)",borderRadius:10,padding:"8px 20px",color:"#22d67a",fontWeight:700,fontSize:13,cursor:"pointer",marginTop:10}}>
          Submit Another
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

// ─── SHOP TAB (glass) ────────────────────────────────────────────────────────
const SHOP_CATEGORIES=[
  {id:"auto",     label:"🤖",short:"Auto",      desc:"Earn taps automatically — counts on leaderboard"},
  {id:"tap",      label:"⚡",short:"Tap Power",  desc:"More coins per manual tap"},
  {id:"crit",     label:"💥",short:"Crit Hit",   desc:"Chance to massively multiply earnings"},
  {id:"energy",   label:"🔋",short:"Energy",     desc:"Bigger energy pool and faster regen"},
  {id:"combo",    label:"🔥",short:"Combo",      desc:"Build and maintain combo multiplier"},
  {id:"special",  label:"💫",short:"Special",    desc:"Charge your special ability faster"},
  {id:"bonus",    label:"🎰",short:"Bonus",      desc:"Global multipliers and lucky effects"},
  {id:"prestige", label:"🏆",short:"Prestige",   desc:"Elite multipliers that scale everything"},
  {id:"degen",    label:"🦍",short:"Degen",      desc:"Degen-culture power ups and buffs"},
  {id:"passive",  label:"🏦",short:"Passive",    desc:"Earn coins even while away"},
  {id:"tower",    label:"🏙️",short:"Tower",     desc:"Build your Degen Tower for massive bonuses"},
  {id:"meme",     label:"📱",short:"Meme",       desc:"Meme-powered upgrades and viral boosts"},
  {id:"galaxy",   label:"🌌",short:"Galaxy",     desc:"End-game galaxy-tier multipliers"},
];
const RANK_NAMES:Record<number,string>={5:"Normie",8:"Bronze Ape",11:"Silver Degen",15:"Gold Degen",20:"Diamond Hands",25:"Sigma",30:"Tower Lord"};

function ShopTab({coins,charId,upgrades,onBuyUpgrade,playerLevel}:{
  coins:number;charId:string|null;upgrades:Record<string,number>;
  onBuyUpgrade:(id:string)=>void;playerLevel:number;
}){
  const [cat,setCat]=useState<string>("auto");
  const [justBought,setJustBought]=useState<string|null>(null);
  const catItems=UPGRADES.filter(u=>u.category===cat);
  const catInfo=SHOP_CATEGORIES.find(c=>c.id===cat);

  // Rarity tier from cost: common < 5K, rare < 100K, epic < 5M, legendary >= 5M
  const rarity=(cost:number)=>cost>=5e6?{name:"LEGENDARY",color:"245,200,66",text:"#f5c842"}:cost>=1e5?{name:"EPIC",color:"168,85,247",text:"#c084fc"}:cost>=5e3?{name:"RARE",color:"59,130,246",text:"#60a5fa"}:{name:"COMMON",color:"148,163,184",text:"#94a3b8"};

  const buy=(id:string)=>{onBuyUpgrade(id);setJustBought(id);setTimeout(()=>setJustBought(null),500);};

  return(
    <div style={{minHeight:"100vh",background:G.bg,color:"#fff",paddingBottom:110,position:"relative"}}>
      <div className="arcade-grid"/>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% -10%,rgba(34,214,122,0.08) 0%,transparent 50%)",pointerEvents:"none"}}/>

      {/* ── Marquee header — arcade storefront ── */}
      <div style={{background:"rgba(4,0,12,0.94)",borderBottom:"1px solid rgba(34,214,122,0.15)",padding:"60px 0 0",position:"sticky",top:0,zIndex:10,backdropFilter:G.blur}}>
        <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div>
              <div className="neon-flicker" style={{fontSize:9.5,fontWeight:800,letterSpacing:"0.24em",color:"#22d67a",textTransform:"uppercase",textShadow:"0 0 16px rgba(34,214,122,0.8)"}}>◆ DEGEN ARCADE ◆</div>
              <h2 style={{fontWeight:900,fontSize:22,margin:"2px 0 0",letterSpacing:"-0.03em"}}>Upgrade Store</h2>
            </div>
            <div className="shine-card" style={{marginLeft:"auto",
              background:"linear-gradient(135deg,rgba(245,200,66,0.12),rgba(245,200,66,0.04))",
              border:"1px solid rgba(245,200,66,0.3)",
              borderRadius:14,padding:"8px 16px",
              display:"flex",alignItems:"center",gap:7,
              boxShadow:"0 0 20px rgba(245,200,66,0.1)",
            }}>
              <span style={{fontSize:18,animation:"coinSpin 3s ease-in-out infinite",display:"inline-block"}}>💰</span>
              <div>
                <div style={{fontSize:15,fontWeight:900,color:G.gold,fontVariantNumeric:"tabular-nums",lineHeight:1.1,textShadow:"0 0 14px rgba(245,200,66,0.4)"}}>{fmt(coins)}</div>
                <div style={{fontSize:7.5,color:"#6b5a3a",textTransform:"uppercase",letterSpacing:"0.1em"}}>$DEGEN</div>
              </div>
            </div>
          </div>
          {/* Category pills */}
          <div style={{display:"flex",gap:7,overflowX:"auto",padding:"10px 0 12px",WebkitOverflowScrolling:"touch" as any}}>
            {SHOP_CATEGORIES.map(c=>{
              const active=cat===c.id;
              const count=UPGRADES.filter(u=>u.category===c.id&&(upgrades[u.id]||0)>0).length;
              return(
                <button key={c.id} onClick={()=>setCat(c.id)} className="press-fx" style={{
                  flex:"0 0 auto",
                  background:active?"linear-gradient(135deg,rgba(168,85,247,0.25),rgba(168,85,247,0.12))":"rgba(255,255,255,0.03)",
                  border:`1.5px solid ${active?"rgba(192,132,252,0.65)":"rgba(255,255,255,0.07)"}`,
                  color:active?"#d8b4fe":"#4d4d6b",
                  borderRadius:22,padding:"8px 15px",fontSize:12,fontWeight:800,cursor:"pointer",
                  whiteSpace:"nowrap",
                  boxShadow:active?"0 0 18px rgba(168,85,247,0.3)":"none",
                  transition:"all 0.2s",
                  position:"relative",
                  textShadow:active?"0 0 10px rgba(192,132,252,0.5)":"none",
                }}>
                  {c.label} {c.short}
                  {count>0&&<span style={{
                    position:"absolute",top:-5,right:-5,
                    background:"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#fff",
                    minWidth:15,height:15,borderRadius:8,padding:"0 3px",
                    fontSize:8.5,fontWeight:900,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow:"0 0 8px rgba(168,85,247,0.6)",
                    border:"1px solid rgba(255,255,255,0.2)",
                  }}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!charId?(
        <div style={{padding:70,textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{fontSize:56,marginBottom:14,filter:"grayscale(0.5)",animation:"charFloat 3s ease-in-out infinite"}}>🛒</div>
          <div style={{color:"#6b5a8a",fontSize:15,fontWeight:800}}>Start a game first</div>
          <div style={{color:"#7a7a9a",fontSize:12,marginTop:5}}>Head to the Play tab to pick your character</div>
        </div>
      ):(
        <div style={{maxWidth:480,margin:"0 auto",padding:"12px 14px",position:"relative",zIndex:1}}>
          {catInfo&&<div style={{color:"#8b79a9",fontSize:11.5,padding:"2px 4px 12px",fontWeight:600}}>{catInfo.desc}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
            {catItems.map((u,idx)=>{
              const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv);
              const locked=(u.minLevel||0)>playerLevel;
              const can=!locked&&coins>=cost;
              const reqRank=u.minLevel?RANK_NAMES[u.minLevel]:"";
              const r=rarity(u.baseCost);
              const bought=justBought===u.id;
              return(
                <button key={u.id} onClick={()=>!locked&&can&&buy(u.id)} disabled={locked||!can}
                  className={`anim-slideup ${can&&!locked?"press-fx":""} ${r.name==="LEGENDARY"&&can?"legendary-border":""}`}
                  style={{
                    background:locked?"rgba(255,255,255,0.012)":can
                      ?`linear-gradient(150deg,rgba(${r.color},0.1),rgba(${r.color},0.025) 60%)`
                      :"rgba(255,255,255,0.025)",
                    border:`1.5px solid ${locked?"rgba(255,255,255,0.04)":can?`rgba(${r.color},0.4)`:"rgba(255,255,255,0.06)"}`,
                    borderRadius:20,padding:"15px 13px",
                    cursor:can?"pointer":"not-allowed",
                    textAlign:"left",
                    opacity:locked?0.45:can?1:0.6,
                    transition:"all 0.18s",position:"relative",
                    boxShadow:bought?`0 0 40px rgba(${r.color},0.6)`:can?`0 0 22px rgba(${r.color},0.08), inset 0 1px 0 rgba(255,255,255,0.05)`:"none",
                    transform:bought?"scale(1.04)":"none",
                    animationDelay:`${Math.min(idx*0.04,0.4)}s`,
                  }}>
                  {/* Rarity ribbon */}
                  <div style={{position:"absolute",top:10,left:13,fontSize:7.5,fontWeight:900,letterSpacing:"0.16em",color:r.text,opacity:locked?0.4:0.85,textShadow:`0 0 8px rgba(${r.color},0.5)`}}>{r.name}</div>
                  {/* Level badge */}
                  {lv>0&&(
                    <div style={{position:"absolute",top:8,right:8,background:"linear-gradient(135deg,rgba(168,85,247,0.3),rgba(124,58,237,0.2))",border:"1px solid rgba(192,132,252,0.4)",borderRadius:9,padding:"2.5px 8px",fontSize:9,color:"#d8b4fe",fontWeight:900,boxShadow:"0 0 10px rgba(168,85,247,0.25)"}}>
                      Lv{lv}
                    </div>
                  )}
                  <div style={{fontSize:32,margin:"14px 0 9px",filter:locked?"grayscale(1)":`drop-shadow(0 0 10px rgba(${r.color},0.4))`,lineHeight:1}}>{locked?"🔒":u.emoji}</div>
                  <div style={{fontWeight:900,fontSize:12.5,color:"#fff",marginBottom:3,lineHeight:1.3,letterSpacing:"-0.01em"}}>{u.name}</div>
                  {u.tapsPerSec&&<div style={{fontSize:9.5,color:"#22d67a",fontWeight:800,marginBottom:4,textShadow:"0 0 8px rgba(34,214,122,0.4)"}}>⚡ +{u.tapsPerSec}/sec auto</div>}
                  <div style={{color:"#8b79a9",fontSize:10,marginBottom:10,lineHeight:1.45,minHeight:28}}>{u.desc}</div>
                  {locked?(
                    <div style={{
                      background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",
                      borderRadius:10,padding:"6px 9px",
                      color:"#f87171",fontSize:9.5,fontWeight:800,
                    }}>🔒 {reqRank} (Lv.{u.minLevel})</div>
                  ):(
                    <div style={{
                      background:can?`linear-gradient(135deg,rgba(${r.color},0.16),rgba(${r.color},0.07))`:"rgba(255,255,255,0.03)",
                      border:`1px solid ${can?`rgba(${r.color},0.35)`:"rgba(255,255,255,0.06)"}`,
                      borderRadius:10,padding:"6px 10px",display:"flex",gap:5,alignItems:"center",justifyContent:"center",
                      boxShadow:can?`0 0 14px rgba(${r.color},0.12)`:"none",
                    }}>
                      <span style={{fontSize:12}}>💰</span>
                      <span style={{color:can?r.text:"#7a7a9a",fontWeight:900,fontSize:12.5,fontVariantNumeric:"tabular-nums"}}>{fmt(cost)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QUICK UPGRADE STRIP ──────────────────────────────────────────────────────
function QuickStrip({coins,upgrades,onBuyUpgrade}:{
  coins:number;upgrades:Record<string,number>;
  onBuyUpgrade:(id:string)=>void;
}){
  return(
    <div style={{width:"100%"}}>
      <div style={{color:"#9b8ab8",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",padding:"4px 16px 5px"}}>⚡ Quick Upgrades</div>
      <div style={{overflowX:"auto",display:"flex",gap:8,padding:"4px 16px 10px",WebkitOverflowScrolling:"touch" as any}}>
        {[...UPGRADES].sort((a,b)=>{
          const ca=getUpgCost(a,upgrades[a.id]||0),cb=getUpgCost(b,upgrades[b.id]||0);
          const aa=coins>=ca?0:1,ab=coins>=cb?0:1;
          return aa!==ab?aa-ab:ca-cb;
        }).map(u=>{
          const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv),can=coins>=cost;
          return(
            <button key={u.id} onClick={()=>can&&onBuyUpgrade(u.id)} className={can?"press-fx":""} style={{
              flex:"0 0 86px",height:96,
              background:can?"linear-gradient(160deg,rgba(245,200,66,0.1),rgba(245,200,66,0.03))":G.glass,
              border:`1.5px solid ${can?"rgba(245,200,66,0.35)":G.border}`,
              borderRadius:16,padding:"9px 6px",
              cursor:can?"pointer":"not-allowed",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",
              opacity:can?1:0.4,position:"relative",
              transition:"all 0.1s",
              boxShadow:can?"0 0 14px rgba(245,200,66,0.1)":"none",
            }}>
              {lv>0&&<div style={{position:"absolute",top:4,right:5,background:"rgba(168,85,247,0.75)",borderRadius:5,fontSize:7.5,fontWeight:900,color:"#fff",padding:"1.5px 5px"}}>Lv{lv}</div>}
              <div style={{fontSize:25,filter:can?"drop-shadow(0 0 8px rgba(245,200,66,0.35))":"grayscale(0.6)"}}>{u.emoji}</div>
              <div style={{color:can?"#e8e0f5":"#8b79a9",fontSize:9.5,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{u.name}</div>
              <div style={{color:can?G.gold:"#8b79a9",fontSize:10.5,fontWeight:900,fontVariantNumeric:"tabular-nums"}}>💰{fmt(cost)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN GAME ────────────────────────────────────────────────────────────────
export default function TapGame() {
  const {user,signOut}=useAuth();
  const [activeTab,setActiveTab]=useState<"home"|"play"|"multi"|"games"|"shop"|"profile"|"quests"|"achievements"|"ranks"|"settings"|"compete">("home");
  const [menuOpen,setMenuOpen]=useState(false);
  const [screen,setScreen]=useState<"select"|"game">("select");
  const [charId,setCharId]=useState<string|null>(null);
  // DB-loaded values — source of truth for taps/coins (never overwrite with local zeros)
  const dbValuesRef=useRef<{totalEarned:number;totalTaps:number;coins:number;upgrades:Record<string,number>}|null>(null);
  const [showModal,setShowModal]=useState(false);
  const [pendingChar,setPendingChar]=useState<string|null>(null);
  const [playerId,setPlayerId]=useState("");
  const inClanRef=useRef(false);
  // ── in-app notifications ──
  const [notifs,setNotifs]=useState<AppNotif[]>([]);
  const notifIdRef=useRef(1);
  const pushNotif=useCallback((emoji:string,title:string,body:string)=>{
    const id=notifIdRef.current++;
    setNotifs(n=>[...n.slice(-2),{id,emoji,title,body}]);
    setTimeout(()=>setNotifs(n=>n.filter(x=>x.id!==id)),6000);
  },[]);
  // poll for social events: new friend adds + clan chat messages
  useEffect(()=>{
    if(!playerId)return;
    let stop=false;
    const poll=async()=>{
      try{
        const {supabase}=await import("@/lib/supabase");
        // who added me as friend
        const seenF=Number(localStorage.getItem(`degen_seen_friend_${playerId}`)||0);
        const {data:fr}=await supabase.from("dt_security_events").select("data")
          .eq("event_type","friend").eq("data->>friend",playerId).limit(50);
        if(stop)return;
        const newAdds=((fr||[]) as {data:{username?:string;ts?:number}}[]).filter(r=>(r.data?.ts||0)>seenF);
        if(newAdds.length){
          const maxTs=Math.max(...newAdds.map(r=>r.data?.ts||0));
          try{localStorage.setItem(`degen_seen_friend_${playerId}`,String(maxTs));}catch{}
          if(seenF>0)newAdds.slice(0,3).forEach(r=>pushNotif("👥","New friend",`${r.data?.username||"Someone"} added you as a friend!`));
          else if(newAdds.length)try{localStorage.setItem(`degen_seen_friend_${playerId}`,String(maxTs));}catch{}
        }
        // new clan chat messages in my clan
        const {data:cl}=await supabase.from("dt_security_events").select("id,data")
          .eq("event_type","clan").eq("player_id","__clan__").limit(100);
        if(stop)return;
        const mine=((cl||[]) as {id:string;data:{members?:string[]}}[]).find(c=>(c.data?.members||[]).includes(playerId));
        if(mine){
          const seenC=Number(localStorage.getItem(`degen_seen_chat_${playerId}`)||0);
          const {data:ch}=await supabase.from("dt_security_events").select("player_id,data")
            .eq("event_type","clan_chat").eq("data->>clan",mine.id).limit(60);
          if(stop)return;
          const newMsgs=((ch||[]) as {player_id:string;data:{username?:string;text?:string;ts?:number}}[])
            .filter(r=>(r.data?.ts||0)>seenC&&r.player_id!==playerId)
            .sort((a,b)=>(a.data?.ts||0)-(b.data?.ts||0));
          if(newMsgs.length){
            const maxTs=Math.max(...newMsgs.map(r=>r.data?.ts||0));
            try{localStorage.setItem(`degen_seen_chat_${playerId}`,String(maxTs));}catch{}
            if(seenC>0)newMsgs.slice(-2).forEach(r=>pushNotif("💬",`${r.data?.username||"Clanmate"} · clan chat`,r.data?.text||""));
          }
        }
      }catch{}
    };
    poll();
    const id=setInterval(poll,15000);
    return()=>{stop=true;clearInterval(id);};
  },[playerId,pushNotif]);
  // chest boost: {mult, until(ms epoch)} persisted in localStorage
  const [boost,setBoost]=useState<{mult:number;until:number}>({mult:1,until:0});
  const [boostLeft,setBoostLeft]=useState(0);
  const boostRef=useRef(boost);boostRef.current=boost;
  useEffect(()=>{ if(!playerId)return; try{const b=JSON.parse(localStorage.getItem(`degen_boost_${playerId}`)||"null"); if(b&&b.until>Date.now())setBoost(b);}catch{} },[playerId]);
  useEffect(()=>{
    const id=setInterval(()=>{
      const b=boostRef.current;
      setBoostLeft(b.until>Date.now()?Math.ceil((b.until-Date.now())/1000):0);
    },1000);
    return()=>clearInterval(id);
  },[]);
  // ── offline earnings ──
  const [offlineReward,setOfflineReward]=useState<{coins:number;hours:number}|null>(null);
  const offlineCheckedRef=useRef(false);
  // ── frenzy power-up (from golden coin) ──
  const [frenzy,setFrenzy]=useState<{mult:number;until:number}>({mult:1,until:0});
  const frenzyRef=useRef(frenzy);frenzyRef.current=frenzy;
  const [frenzyLeft,setFrenzyLeft]=useState(0);
  useEffect(()=>{
    const id=setInterval(()=>{
      const f=frenzyRef.current;
      setFrenzyLeft(f.until>Date.now()?Math.ceil((f.until-Date.now())/1000):0);
    },500);
    return()=>clearInterval(id);
  },[]);
  // ── golden coin random event ──
  const [goldCoin,setGoldCoin]=useState<{x:number;y:number}|null>(null);
  // ── daily quest tracking ──
  const [dayEvents,setDayEvents]=useState<Record<string,number>>({});
  const dayBaseRef=useRef<{day:string;taps:number;earned:number}|null>(null);
  const bumpDayEvent=useCallback((metric:string)=>{
    if(!playerId)return;
    setDayEvents(prev=>{
      const next={...prev,[metric]:(prev[metric]||0)+1};
      try{localStorage.setItem(`degen_dayev_${playerId}`,JSON.stringify(next));}catch{}
      return next;
    });
  },[playerId]);
  useEffect(()=>{ // clan tap bonus check (+10% income while in a clan)
    if(!playerId)return;
    (async()=>{
      try{
        const {supabase}=await import("@/lib/supabase");
        const {data}=await supabase.from("dt_security_events").select("data").eq("event_type","clan").eq("player_id","__clan__").limit(100);
        inClanRef.current=((data||[]) as {data:{members?:string[]}}[]).some(c=>(c.data?.members||[]).includes(playerId));
      }catch{}
    })();
  },[playerId]);
  const [username,setUsername]=useState("");
  const [solWallet,setSolWallet]=useState("");
  const [avatar,setAvatar]=useState("🐸");
  const [avatarUrl,setAvatarUrl]=useState(""); // custom profile picture URL
  const [dbLoaded,setDbLoaded]=useState(false);

  const [coins,setCoins]=useState(0);
  const [energy,setEnergy]=useState(1000);
  const [maxEnergy,setMaxEnergy]=useState(1000);
  const [combo,setCombo]=useState(1);
  const [comboTimer,setComboTimer]=useState(0);
  const [tapCount,setTapCount]=useState(0);
  const [totalTaps,setTotalTaps]=useState(0);
  const [totalEarned,setTotalEarned]=useState(0);
  const [specialCharge,setSpecialCharge]=useState(0);
  const [specialActive,setSpecialActive]=useState(false);
  const [specialTimer,setSpecialTimer]=useState(0);
  const [particles,setParticles]=useState<Particle[]>([]);
  const [charPulse,setCharPulse]=useState(false);
  const [shaking,setShaking]=useState(false);
  const [upgrades,setUpgrades]=useState<Record<string,number>>({});
  const [critFlash,setCritFlash]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [newAchiev,setNewAchiev]=useState<string|null>(null);
  const [achievSet,setAchievSet]=useState<Set<string>>(new Set());
  const [bestCombo,setBestCombo]=useState(1);
  const [comboMilestoneMsg,setComboMilestoneMsg]=useState<string|null>(null);
  const { playTap, playComboMilestone, playLevelUp, playSpecial, playPurchase } = useSound();

  const pidRef=useRef(0);
  const saveRef=useRef<SaveData|null>(null);
  // liveRef keeps current values in sync for use by stable doSave callback
  const liveRef=useRef({charId:"",coins:0,totalEarned:0,totalTaps:0,upgrades:{} as Record<string,number>,uid:"",username:"",solWallet:"",avatarUrl:""});
  // Debounce timer ref — fires DB write 800ms after last tap
  const dbDebounceRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  // Heartbeat — update last_seen every 30s so online presence is accurate
  useEffect(()=>{
    const uid=playerId||user?.email||user?.id;
    if(!uid)return;
    async function ping(){
      try{
        const{supabase}=await import("@/lib/supabase");
        await supabase.from("dt_players").update({last_seen:new Date().toISOString()}).eq("wallet_address",uid);
      }catch{}
    }
    ping();// immediate ping on mount
    const id=setInterval(ping,30000);
    return()=>clearInterval(id);
  },[playerId,user?.id,user?.email]);

  // ── REAL-TIME DB SYNC ───────────────────────────────────────────────────────
  // Runs every 1s. Fires immediately on mount (no initial delay).
  // 1. Reads best taps from localStorage + liveRef (local source of truth)
  // 2. Pushes to dedicated sync_taps_only RPC (never touches earned/currency)
  // 3. DB returns the authoritative value; if DB > local, local is updated
  // 4. Drains any queued retries from previous failures
  // 5. Full syncDB (earned/coins/upgrades) runs in parallel — won't block tap sync
  useEffect(()=>{
    const uid=playerId||user?.email||user?.id;
    if(!uid)return;
    const safeUid:string=uid;

    let _fullSyncCounter=0;
    async function runSync(){
      const gl=getGlobalTaps(safeUid);
      let bestTaps=gl.totalTaps||0;
      let bestEarned=gl.totalEarned||0;
      try{
        const saves=Object.keys(localStorage).filter(k=>k.startsWith(`degen_save_${uid}_`));
        for(const sk of saves){
          try{const sv=JSON.parse(localStorage.getItem(sk)||"{}");
            if((sv.totalTaps||0)>bestTaps)bestTaps=sv.totalTaps;
            if((sv.totalEarned||0)>bestEarned)bestEarned=sv.totalEarned;
          }catch{}
        }
      }catch{}
      if(liveRef.current.charId&&liveRef.current.uid===safeUid){
        bestTaps=Math.max(bestTaps,liveRef.current.totalTaps);
        bestEarned=Math.max(bestEarned,liveRef.current.totalEarned);
      }
      if(bestTaps<=0){drainRetryQueue();return;}
      const name=getPlayerName(safeUid)||username;
      const cid=liveRef.current.charId||charId||"pepe";

      // 1. Push taps every second (lightweight — games_played only).
      const dbTaps=await syncTaps(safeUid,name,cid,bestTaps);

      // 2. If DB has MORE taps than we do locally, adopt the DB value
      if(dbTaps!==null&&dbTaps>bestTaps){
        bestTaps=dbTaps;
        setGlobalTaps(safeUid,bestTaps,bestEarned);
        if(liveRef.current.uid===safeUid&&dbTaps>liveRef.current.totalTaps){
          liveRef.current.totalTaps=dbTaps;
        }
        console.log("[sync] DB had higher taps:",dbTaps,"— local updated");
      }else{
        setGlobalTaps(safeUid,bestTaps,bestEarned);
      }

      // 3. Full sync (earned, coins, upgrades) — only every 10s to reduce write load
      _fullSyncCounter++;
      if(_fullSyncCounter>=10){
        _fullSyncCounter=0;
        const coins=liveRef.current.coins||0;
        const upgrades=liveRef.current.upgrades||{};
        const wallet=liveRef.current.solWallet||getPlayerWallet(safeUid)||undefined;
        const av=liveRef.current.avatarUrl||avatarUrl||undefined;
        syncDB(safeUid,name,cid,bestEarned,bestTaps,coins,upgrades,wallet,av);
      }

      // 4. Drain any queued retries
      drainRetryQueue();
    }

    // Fire immediately on mount (handles unsynced data from previous session)
    runSync();
    const interval=setInterval(runSync,1000);
    const handleBeforeUnload=()=>{
      const d=liveRef.current;
      if(d.charId&&d.uid){
        const gl=getGlobalTaps(d.uid);
        const st=Math.max(d.totalTaps,gl.totalTaps);
        const se=Math.max(d.totalEarned,gl.totalEarned);
        syncDB(d.uid,d.username||getPlayerName(d.uid),d.charId,se,st,d.coins,d.upgrades,d.solWallet||getPlayerWallet(d.uid)||undefined,d.avatarUrl||undefined);
      }
    };
    window.addEventListener("beforeunload",handleBeforeUnload);
    return()=>{
      clearInterval(interval);
      window.removeEventListener("beforeunload",handleBeforeUnload);
    };
  },[playerId,user?.id,user?.email]);// eslint-disable-line react-hooks/exhaustive-deps

  const char=CHARACTERS.find(c=>c.id===charId);
  const level=getLevelFromXP(totalEarned);
  const xpProgress=getLevelProgress(totalEarned);
  const rank=getRankFromLevel(level);
  const nextRank=getNextRank(level);
  const autoBoostMult=1+(upgrades["auto_boost"]||0)*0.10+(upgrades["auto_boost2"]||0)*0.25+(upgrades["auto_boost3"]||0)*0.50+(upgrades["auto_boost4"]||0)*1.50+(upgrades["auto_mult"]?1:0)+(upgrades["auto_mult2"]?2:0)+(upgrades["auto_mult3"]?4:0)+(upgrades["prestige_auto"]||0)*0.20+(upgrades["prestige_auto2"]||0)*0.60+(upgrades["prestige_auto3"]||0)*1.50+upgradeEffectTotal(upgrades,"passiveMult");
  const autoRate=UPGRADES.reduce((sum,u)=>{
    const lvl=upgrades[u.id]||0;
    const rate=(u.tapsPerSec||u.effect?.tapsPerSec||0);
    return sum+lvl*rate*autoBoostMult;
  },0);
  // Keep liveRef in sync so stable doSave always reads fresh values
  liveRef.current={charId:charId||"",coins,totalEarned,totalTaps,upgrades,uid:playerId||user?.email||user?.id||"",username,solWallet,avatarUrl};

  // ── offline earnings: auto-tappers grind at 50% while away (cap 8h) ──
  useEffect(()=>{
    if(!dbLoaded||!playerId||offlineCheckedRef.current)return;
    offlineCheckedRef.current=true;
    try{
      const key=`degen_lastseen_${playerId}`;
      const last=Number(localStorage.getItem(key)||0);
      if(last>0&&autoRate>0){
        const elapsed=Math.min(8*3600,Math.floor((Date.now()-last)/1000));
        if(elapsed>120){
          const earned=Math.floor(autoRate*elapsed*0.5);
          if(earned>0)setOfflineReward({coins:earned,hours:elapsed/3600});
        }
      }
    }catch{}
  },[dbLoaded,playerId,autoRate]);

  // daily quest baseline: snapshot taps/earned at start of each day
  useEffect(()=>{
    if(!dbLoaded||!playerId)return;
    const day=new Date().toISOString().slice(0,10);
    const bKey=`degen_daybase_${playerId}`;
    try{
      const raw=localStorage.getItem(bKey);
      let base=raw?JSON.parse(raw):null;
      if(!base||base.day!==day){
        base={day,taps:totalTaps,earned:totalEarned};
        localStorage.setItem(bKey,JSON.stringify(base));
        localStorage.setItem(`degen_dayev_${playerId}`,"{}");
        setDayEvents({});
      }else{
        try{setDayEvents(JSON.parse(localStorage.getItem(`degen_dayev_${playerId}`)||"{}"));}catch{}
      }
      dayBaseRef.current=base;
    }catch{}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[dbLoaded,playerId]);
  const dayStats=useMemo(()=>{
    const b=dayBaseRef.current;
    return{
      taps:b?Math.max(0,totalTaps-b.taps):0,
      earned:b?Math.max(0,totalEarned-b.earned):0,
      ...dayEvents,
    };
  },[totalTaps,totalEarned,dayEvents]);

  useEffect(()=>{
    if(!playerId)return;
    const key=`degen_lastseen_${playerId}`;
    const beat=()=>{try{localStorage.setItem(key,String(Date.now()));}catch{}};
    beat();
    const id=setInterval(beat,30000);
    window.addEventListener("beforeunload",beat);
    return()=>{clearInterval(id);window.removeEventListener("beforeunload",beat);};
  },[playerId]);

  // golden coin spawns randomly while playing (every 25-60s, stays 6s)
  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game")return;
    let alive=true;let hideT:ReturnType<typeof setTimeout>;
    const schedule=()=>{
      const delay=25000+Math.random()*35000;
      return setTimeout(()=>{
        if(!alive)return;
        setGoldCoin({x:12+Math.random()*70,y:18+Math.random()*45});
        hideT=setTimeout(()=>{if(alive)setGoldCoin(null);},6000);
        t=schedule();
      },delay);
    };
    let t=schedule();
    return()=>{alive=false;clearTimeout(t);clearTimeout(hideT);setGoldCoin(null);};
  },[activeTab,screen]);

  const grabGoldCoin=useCallback(()=>{
    if(!goldCoin)return;
    setGoldCoin(null);
    bumpDayEvent("golden");
    const r=Math.random();
    if(r<0.45){
      const f={mult:5,until:Date.now()+10000};
      setFrenzy(f);showToast("🔥 FRENZY! 5× taps for 10s!");
    }else if(r<0.75){
      const f={mult:3,until:Date.now()+20000};
      setFrenzy(f);showToast("⚡ POWER SURGE! 3× taps for 20s!");
    }else{
      const bonus=Math.max(5000,Math.floor(totalEarned*0.02));
      setCoins(c=>c+bonus);setTotalEarned(t=>t+bonus);
      showToast(`🪙 Golden coin! +${fmt(bonus)}`);
    }
  },[goldCoin,totalEarned]);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    if(!user?.id)return;
    const authCandidates=Array.from(new Set([user.email,user.id].filter(Boolean) as string[]));
    const authId=authCandidates[0]||user.id;
    setPlayerId(authId);
    // Referral capture — ?ref=<inviterId> rewards inviter once per new player
    try{
      const ref=new URLSearchParams(window.location.search).get("ref");
      const refDone=localStorage.getItem(`degen_ref_done_${authId}`);
      if(ref&&ref!==authId&&!authCandidates.includes(ref)&&!refDone){
        localStorage.setItem(`degen_ref_done_${authId}`,"1");
        import("@/lib/supabase").then(({supabase})=>{
          supabase.from("dt_security_events").insert({
            player_id:ref,event_type:"referral",severity:"low",
            data:{invited:authId,at:new Date().toISOString()},
          }).then(()=>{});
        });
        // welcome bonus for the new player
        setCoins(c=>c+50000);
        setTimeout(()=>showToast("🎉 Welcome bonus: +50K coins!"),1200);
      }
    }catch{}
    // Device fingerprinting — runs silently in background
    import("@/lib/security").then(async({getDeviceFingerprint,registerDeviceFingerprint,checkPlayerStatus})=>{
      const fp=await getDeviceFingerprint();
      registerDeviceFingerprint(authId,fp);
      // Check if banned
      const status=await checkPlayerStatus(authId);
      if(status.banned){
        await import("@/lib/auth").then(({useAuth:_})=>{});
        alert(`Your account has been banned. Reason: ${status.reason||"Violation of Terms of Service"}`);
        import("@/lib/auth").then(()=>window.location.href="/");
      }
    }).catch(()=>{});
    // Safety timeout — unblock game if DB takes too long or errors
    const dbTimeout=setTimeout(()=>setDbLoaded(true),15000); // 15s max wait for DB
    // Use no-cache raw fetch for initial DB load to guarantee fresh data
    (async()=>{
      try{
        const SUPA_URL="https://paxtohwiycuhwmlziwrr.supabase.co";
        const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheHRvaHdpeWN1aHdtbHppd3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTEzNjMsImV4cCI6MjA5NjY4NzM2M30.HtHcTkUO35c_4WTjufHRHUhAHPDuATw23bqh39D_qkQ";
        // Try to get auth token from supabase for RLS
        let authToken=SUPA_KEY;
        try{
          const{supabase}=await import("@/lib/supabase");
          const{data:{session}}=await supabase.auth.getSession();
          if(session?.access_token)authToken=session.access_token;
        }catch{}
        const idFilter=authCandidates.map(id=>`wallet_address.eq.${encodeURIComponent(id)}`).join(",");
        const resp=await fetch(`${SUPA_URL}/rest/v1/dt_players?or=(${idFilter})&limit=1`,{
          headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache, no-store","Pragma":"no-cache"},
          cache:"no-store",
        });
        if(resp.ok){
          const arr=await resp.json() as Record<string,unknown>[];
          const existing=arr[0];
          if(existing){
            const resolvedId=(existing.wallet_address as string)||authId;
            setPlayerId(resolvedId);
            if(existing.username){setUsername(existing.username as string);setPlayerName(existing.username as string,resolvedId);}
            if(existing.sol_wallet){setSolWallet(existing.sol_wallet as string);setPlayerWallet(existing.sol_wallet as string,resolvedId);}
            const savedAv=getAvatar(resolvedId);
            if(savedAv){setAvatar(savedAv);}
            if(existing.avatar_url){setAvatarUrl(existing.avatar_url as string);}
            const dbTaps=Number(existing.games_played)||0;
            const dbEarned=Number(existing.total_score)||0;
            const dbCoins=Number(existing.token_balance)||0;
            const dbUpgrades=(existing.upgrades as Record<string,number>)||{};
            dbValuesRef.current={totalEarned:dbEarned,totalTaps:dbTaps,coins:dbCoins,upgrades:dbUpgrades};
            // Always push local state to DB on load — GREATEST RPC makes it safe (DB only goes up).
            // This ensures the leaderboard always reflects the player's real count without manual fixes.
            const globalLocal=getGlobalTaps(resolvedId);
            const localTaps=globalLocal.totalTaps||0;
            const localEarned=globalLocal.totalEarned||0;
            // Also scan all character saves for highest tap count
            const saves=Object.keys(localStorage).filter(k=>k.startsWith(`degen_save_${resolvedId}_`));
            let bestTaps=localTaps;let bestEarned=localEarned;let bestCoins=dbCoins;
            for(const sk of saves){
              try{const sv=JSON.parse(localStorage.getItem(sk)||"{}");
                if((sv.totalTaps||0)>bestTaps)bestTaps=sv.totalTaps;
                if((sv.totalEarned||0)>bestEarned)bestEarned=sv.totalEarned;
                if((sv.coins||0)>bestCoins)bestCoins=sv.coins;
              }catch{}
            }
            {
              const pushedTaps=Math.max(bestTaps,dbTaps);
              const pushedEarned=Math.max(bestEarned,dbEarned);
              const pushedCoins=Math.max(bestCoins,dbCoins);
              const uname=existing.username as string||getPlayerName(resolvedId);
              const charId=existing.character as string||"pepe";
              syncDB(resolvedId,uname,charId,pushedEarned,pushedTaps,pushedCoins,dbUpgrades,existing.sol_wallet as string||undefined,existing.avatar_url as string||undefined);
              dbValuesRef.current={totalEarned:pushedEarned,totalTaps:pushedTaps,coins:pushedCoins,upgrades:dbUpgrades};
              // Auto-start returning players — charId must be set for runSync to sync taps
              startGame(charId,uname,existing.sol_wallet as string||undefined);
            }
          } else {
            // Try to migrate existing UUID-based record to email-based ID
            let migrated=false;
            if(user.email&&user.id!==authId){
              // authId is email, user.id is UUID — check if a record exists under UUID
              const migrResp=await fetch(`${SUPA_URL}/rest/v1/dt_players?wallet_address=eq.${encodeURIComponent(user.id)}&limit=1`,{
                headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache"},
                cache:"no-store",
              });
              if(migrResp.ok){
                const migrArr=await migrResp.json() as Record<string,unknown>[];
                const oldRec=migrArr[0];
                if(oldRec){
                  // Migrate: update wallet_address from UUID to email
                  try{const{supabase:sb}=await import("@/lib/supabase");await sb.from("dt_players").update({wallet_address:authId}).eq("wallet_address",user.id);}catch{}
                  if(oldRec.username){setUsername(oldRec.username as string);setPlayerName(oldRec.username as string,authId);}
                  if(oldRec.sol_wallet){setSolWallet(oldRec.sol_wallet as string);setPlayerWallet(oldRec.sol_wallet as string,authId);}
                  const savedAv=getAvatar(user.id);
                  if(savedAv){setAvatar(savedAv);setAvatarStore(savedAv,authId);}
                  if(oldRec.avatar_url){setAvatarUrl(oldRec.avatar_url as string);}
                  dbValuesRef.current={totalEarned:Number(oldRec.total_score)||0,totalTaps:Number(oldRec.games_played)||0,coins:Number(oldRec.token_balance)||0,upgrades:(oldRec.upgrades as Record<string,number>)||{}};
                  // Migrate localStorage keys from UUID to email
                  try{
                    const oldGlobal=localStorage.getItem(`degen_global_${user.id}`);
                    if(oldGlobal){localStorage.setItem(`degen_global_${authId}`,oldGlobal);localStorage.removeItem(`degen_global_${user.id}`);}
                    const oldSaves=Object.keys(localStorage).filter(k=>k.startsWith(`degen_save_${user.id}_`));
                    for(const sk of oldSaves){const val=localStorage.getItem(sk);if(val){const newKey=sk.replace(`degen_save_${user.id}_`,`degen_save_${authId}_`);localStorage.setItem(newKey,val);localStorage.removeItem(sk);}}
                    const oldName=localStorage.getItem(`degen_name_${user.id}`);
                    if(oldName){localStorage.setItem(`degen_name_${authId}`,oldName);localStorage.removeItem(`degen_name_${user.id}`);}
                    const oldWallet=localStorage.getItem(`degen_wallet_${user.id}`);
                    if(oldWallet){localStorage.setItem(`degen_wallet_${authId}`,oldWallet);localStorage.removeItem(`degen_wallet_${user.id}`);}
                    const oldAvatar=localStorage.getItem(`degen_avatar_${user.id}`);
                    if(oldAvatar){localStorage.setItem(`degen_avatar_${authId}`,oldAvatar);localStorage.removeItem(`degen_avatar_${user.id}`);}
                  }catch{}
                  migrated=true;
                }
              }
            }
            // Also try to migrate old p_xxx localStorage player ID to this auth account
            if(!migrated){
            const oldId=typeof window!=="undefined"?localStorage.getItem("degen_player_id"):"";
            if(oldId&&oldId.startsWith("p_")){
              const resp2=await fetch(`${SUPA_URL}/rest/v1/dt_players?wallet_address=eq.${encodeURIComponent(oldId)}&limit=1`,{
                headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache"},
                cache:"no-store",
              });
              if(resp2.ok){
                const arr2=await resp2.json() as Record<string,unknown>[];
                const oldRec=arr2[0];
                if(oldRec){
                  // Update wallet_address via supabase
                  try{const{supabase:sb}=await import("@/lib/supabase");await sb.from("dt_players").update({wallet_address:authId}).eq("wallet_address",oldId);}catch{}
                  if(oldRec.username){setUsername(oldRec.username as string);setPlayerName(oldRec.username as string,authId);}
                  if(oldRec.sol_wallet){setSolWallet(oldRec.sol_wallet as string);setPlayerWallet(oldRec.sol_wallet as string,authId);}
                  dbValuesRef.current={totalEarned:Number(oldRec.total_score)||0,totalTaps:Number(oldRec.games_played)||0,coins:Number(oldRec.token_balance)||0,upgrades:(oldRec.upgrades as Record<string,number>)||{}};
                  localStorage.removeItem("degen_player_id");
                  migrated=true;
                }
              }
            }
            if(!migrated){
              const defaultName=user.email?.split("@")[0]||"Degen_"+authId.slice(-6);
              setUsername(defaultName);setPlayerName(defaultName,authId);
            }
            } // close if(!migrated) for p_xxx check
          }
        }
      }catch(e){console.error("DB load error",e);}
      finally{clearTimeout(dbTimeout);setDbLoaded(true);}
    })();
    // On page focus, re-fetch DB to catch any cloud updates (e.g. playing on another device)
    const onFocus=()=>{
      if(!user?.id)return;
      const focusId=user.email||user.id;
      const SUPA_URL="https://paxtohwiycuhwmlziwrr.supabase.co";
      const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheHRvaHdpeWN1aHdtbHppd3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTEzNjMsImV4cCI6MjA5NjY4NzM2M30.HtHcTkUO35c_4WTjufHRHUhAHPDuATw23bqh39D_qkQ";
      fetch(`${SUPA_URL}/rest/v1/dt_players?select=games_played,total_score,token_balance,upgrades&wallet_address=eq.${encodeURIComponent(focusId)}&limit=1`,{
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Cache-Control":"no-cache, no-store"},
        cache:"no-store",
      }).then(r=>r.json()).then((arr:Record<string,unknown>[])=>{
        const data=arr[0];
        if(data){
          const prev=dbValuesRef.current;
          dbValuesRef.current={totalTaps:Math.max(prev?.totalTaps||0,Number(data.games_played)||0),totalEarned:Math.max(prev?.totalEarned||0,Number(data.total_score)||0),coins:Math.max(prev?.coins||0,Number(data.token_balance)||0),upgrades:(data.upgrades as Record<string,number>)||(prev?.upgrades||{})};
        }
      }).catch(()=>{});
    };
    window.addEventListener("focus",onFocus);
    return()=>window.removeEventListener("focus",onFocus);
  },[playerId,user?.id,user?.email]);

  function tryStart(id:string){
    const uid=playerId||user?.email||user?.id||"";
    if(!username&&!getPlayerName(uid)){setPendingChar(id);setShowModal(true);}
    else startGame(id,username||getPlayerName(uid),solWallet||getPlayerWallet(uid));
  }
  function onUsername(name:string,wallet:string){
    const uid=playerId||user?.email||user?.id||"";
    setPlayerName(name,uid);setUsername(name);
    setPlayerWallet(wallet,uid);setSolWallet(wallet);
    setShowModal(false);
    if(pendingChar)startGame(pendingChar,name,wallet);
  }
  function startGame(id:string,name:string,wallet?:string){
    const uid=playerId||user?.email||user?.id||"";
    const s=loadSave(uid,id);
    const globalLocal=getGlobalTaps(uid);
    // DB is always the authoritative floor — local can only be HIGHER (new taps since last sync)
    // This prevents a stale localStorage from ever resetting DB progress
    const dbTaps=dbValuesRef.current?.totalTaps||0;
    const dbEarned=dbValuesRef.current?.totalEarned||0;
    const dbCoins=dbValuesRef.current?.coins||0;
    const safeTaps=Math.max(globalLocal.totalTaps, s.totalTaps, dbTaps);
    const safeEarned=Math.max(globalLocal.totalEarned, s.totalEarned, dbEarned);
    setGlobalTaps(uid,safeTaps,safeEarned);
    const safeCoins=Math.max(s.coins, dbCoins);
    // Merge upgrades: always take MAX across localStorage + DB so purchases are never lost
    const dbUpgrades=(dbValuesRef.current?.upgrades||{}) as Record<string,number>;
    const allUpgradeKeys=new Set([...Object.keys(s.upgrades),...Object.keys(dbUpgrades)]);
    const safeUpgrades:Record<string,number>={};
    allUpgradeKeys.forEach(k=>{safeUpgrades[k]=Math.max(s.upgrades[k]||0,dbUpgrades[k]||0);});
    setCharId(id);setCoins(safeCoins);setTotalEarned(safeEarned);setTotalTaps(safeTaps);
    setUpgrades(safeUpgrades);
    const mx=1000+(safeUpgrades["energy_max"]||0)*200+(safeUpgrades["energy_max2"]||0)*500+(safeUpgrades["energy_max3"]||0)*1000+(safeUpgrades["energy_max4"]||0)*2000+(safeUpgrades["energy_max5"]||0)*5000+(safeUpgrades["energy_max6"]||0)*15000;
    setMaxEnergy(mx);setEnergy(mx);
    setScreen("game");setActiveTab("play");
    const mergedSave={...s,coins:safeCoins,totalEarned:safeEarned,totalTaps:safeTaps,upgrades:safeUpgrades};
    saveRef.current=mergedSave;
    persistSave(uid,mergedSave);
    // Only syncDB if we have meaningful data — don't overwrite DB with zeros
    if(safeTaps>0||safeCoins>0||Object.keys(safeUpgrades).length>0){
      syncDB(uid,name||getPlayerName(uid),id,safeEarned,safeTaps,safeCoins,safeUpgrades,wallet||getPlayerWallet(uid)||undefined,avatarUrl||undefined);
    }
  }

  // Stable doSave — reads from liveRef so deps never change, interval never restarts
  const doSave=useCallback(()=>{
    const d=liveRef.current;
    if(!d.charId)return;
    // Always use the MAX of current session taps and localStorage global taps.
    // This ensures previous-session taps (stored in degen_global_${uid}) are never lost
    // even if this session started from a lower DB value.
    const globalLocal=getGlobalTaps(d.uid);
    const safeTaps=Math.max(d.totalTaps,globalLocal.totalTaps);
    const safeEarned=Math.max(d.totalEarned,globalLocal.totalEarned);
    const s:SaveData={charId:d.charId,coins:d.coins,totalEarned:safeEarned,totalTaps:safeTaps,upgrades:d.upgrades,highScore:Math.max(d.coins,saveRef.current?.highScore||0)};
    persistSave(d.uid,s);saveRef.current=s;
    setGlobalTaps(d.uid,safeTaps,safeEarned);
    dbValuesRef.current={totalTaps:safeTaps,totalEarned:safeEarned,coins:d.coins,upgrades:d.upgrades};
    // TAPS FIRST — independent, cannot fail due to earned overflow
    syncTaps(d.uid,d.username||getPlayerName(d.uid),d.charId,safeTaps);
    // Full sync (earned, coins, upgrades) — secondary, taps already safe above
    syncDB(d.uid,d.username||getPlayerName(d.uid),d.charId,safeEarned,safeTaps,d.coins,d.upgrades,d.solWallet||getPlayerWallet(d.uid)||undefined,d.avatarUrl||undefined);
  },[]);// eslint-disable-line react-hooks/exhaustive-deps

  // Save every 5s during play; save immediately on exit (cleanup)
  useEffect(()=>{
    if(screen!=="game"||!charId)return;
    const id=setInterval(doSave,1000);
    return()=>{clearInterval(id);doSave();};// save on screen/char change
  },[screen,charId]);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    if(screen!=="game"||!char)return;
    const rate=autoRate*(specialActive&&char.id==="trump"?5:1);
    if(rate<=0)return;
    const id=setInterval(()=>{const pt=rate/20;setCoins(c=>c+pt);setTotalEarned(t=>t+pt);setTotalTaps(t=>t+pt);
      if(dbDebounceRef.current)clearTimeout(dbDebounceRef.current);
      dbDebounceRef.current=setTimeout(()=>{const d=liveRef.current;if(d.charId&&d.uid){const gl=getGlobalTaps(d.uid);const st=Math.max(d.totalTaps,gl.totalTaps);const se=Math.max(d.totalEarned,gl.totalEarned);syncDB(d.uid,d.username||getPlayerName(d.uid),d.charId,se,st,d.coins,d.upgrades,d.solWallet||getPlayerWallet(d.uid)||undefined,d.avatarUrl||undefined);}},400);
    },50);
    return()=>clearInterval(id);
  },[autoRate,screen,char,specialActive]);

  useEffect(()=>{
    if(screen!=="game")return;
    const passiveRate=(upgradeEffectTotal(upgrades,"passivePerSec"))*(1+upgradeEffectTotal(upgrades,"allIncomeMult"));
    if(passiveRate<=0)return;
    const id=setInterval(()=>{const pt=passiveRate/20;setCoins(c=>c+pt);setTotalEarned(t=>t+pt);},50);
    return()=>clearInterval(id);
  },[screen,upgrades]);

  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const regenBonus=(upgrades["energy_reg"]||0)*0.5+(upgrades["energy_reg2"]||0)*1+(upgrades["energy_reg3"]||0)*2+(upgrades["energy_reg4"]||0)*4+(upgrades["energy_reg5"]||0)*8+upgradeEffectTotal(upgrades,"energyRegen");
    const r=(char.energyRegen+regenBonus)*(specialActive&&char.id==="bonk"?999:1);
    const id=setInterval(()=>setEnergy(e=>Math.min(maxEnergy,e+r*0.05)),50);
    return()=>clearInterval(id);
  },[activeTab,screen,char,maxEnergy,specialActive,upgrades]);

  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game")return;
    const id=setInterval(()=>setComboTimer(t=>{if(t<=0){setCombo(1);return 0;}return t-0.05;}),50);
    return()=>clearInterval(id);
  },[activeTab,screen]);

  useEffect(()=>{
    if(!specialActive)return;
    const id=setInterval(()=>setSpecialTimer(t=>{if(t<=0){setSpecialActive(false);return 0;}return t-0.1;}),100);
    return()=>clearInterval(id);
  },[specialActive]);

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(null),1800);};

  const checkAchievements=useCallback((taps:number,earned:number)=>{
    const checks=[
      {id:"first_tap",text:"First Tap! 👆",cond:taps>=1},
      {id:"taps_100",text:"100 Taps! 💯",cond:taps>=100},
      {id:"taps_1000",text:"1,000 Taps! 🔥",cond:taps>=1000},
      {id:"coins_1k",text:"1K Coins! 💰",cond:earned>=1000},
      {id:"coins_10k",text:"10K Earned! 🤑",cond:earned>=10000},
      {id:"coins_1m",text:"MILLIONAIRE! 💎",cond:earned>=1e6},
    ];
    checks.forEach(c=>{if(c.cond&&!achievSet.has(c.id)){setAchievSet(a=>new Set([...a,c.id]));setNewAchiev(c.text);setTimeout(()=>setNewAchiev(null),3000);}});
  },[achievSet]);

  const spawn=useCallback((x:number,y:number,v:string,color:string,big:boolean)=>{
    const id=pidRef.current++;
    setParticles(p=>[...p.slice(-30),{id,x,y,value:v,color,big}]);
    setTimeout(()=>setParticles(p=>p.filter(pp=>pp.id!==id)),1100);
  },[]);

  const handleTap=useCallback((e:React.MouseEvent|React.TouchEvent)=>{
    if(!char)return;
    e.preventDefault();e.stopPropagation();
    let tx=window.innerWidth/2,ty=window.innerHeight/2;
    if("touches" in e&&e.touches.length>0){tx=e.touches[0].clientX;ty=e.touches[0].clientY;}
    else if("clientX" in e){tx=(e as React.MouseEvent).clientX;ty=(e as React.MouseEvent).clientY;}
    if(energy<=0)return;

    const tapPow=(upgrades["tap_power"]||0)*1+(upgrades["tap_pow2"]||0)*3+(upgrades["tap_pow3"]||0)*8+(upgrades["tap_pow4"]||0)*20+(upgrades["tap_pow5"]||0)*60+(upgrades["tap_pow6"]||0)*200+(upgrades["tap_pow7"]||0)*600+(upgrades["tap_pow8"]||0)*2000+(upgrades["tap_pow9"]||0)*8000+upgradeEffectTotal(upgrades,"tapFlat");
    const chainBonus=1+(upgrades["tap_chain"]||0)*1+(upgrades["tap_chain2"]||0)*2+(upgrades["tap_chain3"]||0)*5+upgradeEffectTotal(upgrades,"chainBonus");
    const multiTap=(1+(upgrades["multi_tap"]||0)*1+(upgrades["multi_tap2"]||0)*0.5+(upgrades["multi_tap3"]||0)*1+(upgrades["multi_tap4"]||0)*2+(upgrades["multi_tap5"]||0)*3+(upgrades["multi_tap6"]||0)*5+(upgrades["multi_tap7"]||0)*10+upgradeEffectTotal(upgrades,"tapMult"))*chainBonus;
    const critChance=Math.min(0.95,((upgrades["crit_chance"]||0)+(upgrades["crit_chan2"]||0)+(upgrades["crit_chan3"]||0)+(upgrades["crit_chan4"]||0)+(upgrades["crit_chan5"]||0))*0.1+upgradeEffectTotal(upgrades,"critChance"));
    const critMult=(upgrades["crit_pow5"]?100:upgrades["crit_pow4"]?50:upgrades["crit_pow3"]?25:upgrades["crit_pow2"]?15:upgrades["crit_pow"]?8:5)*(1+(upgrades["crit_aura"]||0)*0.25+(upgrades["crit_aura2"]||0)*0.75+upgradeEffectTotal(upgrades,"critMultScale"));
    // Coin aura from multiple upgrade categories stacked
    const degenMult=1+(upgrades["degen_lore"]||0)*0.05+(upgrades["degen_lore2"]||0)*0.15+(upgrades["degen_lore3"]||0)*0.35+(upgrades["degen_lore4"]||0)*0.80+(upgrades["degen_lore5"]||0)*2.0+(upgrades["ngmi_tax"]||0)*0.10+(upgrades["wagmi_boost"]||0)*0.20+(upgrades["ape_in"]||0)*0.15+(upgrades["ape_in2"]||0)*0.40+(upgrades["diamond_hands"]||0)*0.25+(upgrades["diamond_hands2"]||0)*0.60+(upgrades["hype_train"]||0)*0.30+(upgrades["degen_grind"]||0)*0.20+(upgrades["degen_grind2"]||0)*0.50+(upgrades["alpha_call"]||0)*0.25+(upgrades["alpha_call2"]||0)*0.75+(upgrades["nft_flex"]||0)*0.20+(upgrades["whitelist"]||0)*0.15;
    const memeMult=1+(upgrades["meme_1"]||0)*0.10+(upgrades["meme_2"]||0)*0.12+(upgrades["meme_3"]||0)*0.15+(upgrades["meme_4"]||0)*0.18+(upgrades["meme_5"]||0)*0.12+(upgrades["meme_6"]||0)*0.20+(upgrades["meme_7"]||0)*0.30+(upgrades["meme_8"]||0)*0.50+(upgrades["meme_combo"]||0)*0.25+(upgrades["meme_legend"]||0)*1.0+(upgrades["viral_tap"]||0)*0.20+(upgrades["viral_tap2"]||0)*0.50+(upgrades["rug_pull"]||0)*0.15+(upgrades["pump_it"]||0)*0.35+(upgrades["to_da_moon"]||0)*0.60;
    const towerMult=1+(upgrades["tower_1"]||0)*0.05+(upgrades["tower_2"]||0)*0.12+(upgrades["tower_3"]||0)*0.25+(upgrades["tower_4"]||0)*0.50+(upgrades["tower_5"]||0)*1.0+(upgrades["tower_6"]||0)*2.0+(upgrades["tower_7"]||0)*5.0+(upgrades["tower_8"]||0)*15.0+(upgrades["tower_guard"]||0)*0.08+(upgrades["tower_lord"]||0)*0.50;
    const prestigeMult=1+(upgrades["prestige_tap"]||0)*0.20+(upgrades["prestige_tap2"]||0)*0.50+(upgrades["prestige_tap3"]||0)*1.0+(upgrades["prestige_all"]||0)*0.25+(upgrades["prestige_all2"]||0)*0.75+(upgrades["prestige_all3"]||0)*2.0+(upgrades["prestige_all4"]||0)*5.0;
    const galaxyMult=(upgrades["galaxy_3"]?5:upgrades["galaxy_2"]?3:upgrades["galaxy_1"]?2:1)*(1+(upgrades["big_bang"]||0)*0.5+(upgrades["dark_energy"]||0)*1.0+(upgrades["galaxy_forge"]?10:0));
    const chestBoost=boostRef.current.until>Date.now()?boostRef.current.mult:1;
    const frenzyBoost=frenzyRef.current.until>Date.now()?frenzyRef.current.mult:1;
    const ascendMult=(1+(upgrades["prestige_stars"]||0)*0.5)*(inClanRef.current?1.1:1)*chestBoost*frenzyBoost;
    const coinAura=(1+((upgrades["coin_aura"]||0)*0.5)+((upgrades["coin_aura2"]||0)*1.0)+((upgrades["coin_aura3"]||0)*2.5)+((upgrades["coin_aura4"]||0)*10.0)+(upgrades["lucky_str2"]||0)*0.10+(upgrades["lucky_str3"]||0)*0.15+(upgrades["lucky_str4"]||0)*0.25+(upgrades["double_coins"]||0)*0.25+(upgrades["triple_coins"]||0)*0.10+(upgrades["rainbow_tap"]||0)*0.20+(upgrades["moon_shot"]||0)*0.10+upgradeEffectTotal(upgrades,"allIncomeMult"))*degenMult*memeMult*towerMult*prestigeMult*galaxyMult*ascendMult;
    const tapBase=(char.baseCoins+tapPow)*multiTap*coinAura;
    const specMult=specialActive?char.specialMultiplier:1;
    const isCrit=Math.random()<critChance;
    let earned=tapBase*combo*specMult*(isCrit?critMult:1);
    earned=char.passive(earned);
    const newTapCount=tapCount+1;setTapCount(newTapCount);
    if(char.id==="trump"&&newTapCount%50===0){earned*=10;spawn(tx,ty,"💼 DEAL! 10×","#f5c842",true);}
    if(specialActive&&char.id==="troll")earned*=(1+Math.random()*14);
    earned=Math.max(0.1,earned);
    if(isCrit){setCritFlash(true);setTimeout(()=>setCritFlash(false),120);spawn(tx,ty,"CRIT! ⚡","#ff3344",true);}
    const coinColors=(a:number)=>a>=100?"#ff3344":a>=50?"#f5c842":a>=10?"#22d67a":a>=3?"#a855f7":"#aaa";
    spawn(tx,ty,`+${fmt(Math.round(earned*10)/10)}`,coinColors(earned),false);
    setCoins(c=>c+earned);
    setTotalEarned(t=>{const nt=t+earned;checkAchievements(newTapCount,nt);return nt;});
    setTotalTaps(t=>t+1);
    // Persist to localStorage immediately on every tap (cheap, keeps progress safe)
    // Use timeout 0 so React has flushed state before we read liveRef
    setTimeout(()=>{
      const d=liveRef.current;
      if(d.charId&&d.uid){
        // Save character-specific data (coins, upgrades)
        const s:SaveData={charId:d.charId,coins:d.coins,totalEarned:d.totalEarned,totalTaps:d.totalTaps,upgrades:d.upgrades,highScore:Math.max(d.coins,saveRef.current?.highScore||0)};
        persistSave(d.uid,s);saveRef.current=s;
        // Always update global tap counter so character switches preserve total
        setGlobalTaps(d.uid,d.totalTaps,d.totalEarned);
      }
      // Fast DB write — debounced 100ms after last tap; leaderboard polls every 500ms
      if(dbDebounceRef.current)clearTimeout(dbDebounceRef.current);
      dbDebounceRef.current=setTimeout(()=>{
        const d=liveRef.current;
        if(d.charId&&d.uid){
          dbValuesRef.current={totalTaps:d.totalTaps,totalEarned:d.totalEarned,coins:d.coins,upgrades:d.upgrades};
          syncDB(d.uid,d.username||getPlayerName(d.uid),d.charId,d.totalEarned,d.totalTaps,d.coins,d.upgrades,d.solWallet||getPlayerWallet(d.uid)||undefined,d.avatarUrl||undefined);
        }
      },100);
    },0);
    const ec=specialActive&&char.id==="bonk"?0:1;
    setEnergy(e=>Math.max(0,e-ec));
    const cspeed=1+(upgrades["combo_speed"]||0)*0.2+(upgrades["combo_spd2"]||0)*0.5+(upgrades["combo_spd3"]||0)*1+(upgrades["combo_spd4"]||0)*2+(upgrades["combo_spd5"]||0)*5+upgradeEffectTotal(upgrades,"comboSpeed");
    const gcBonus=char.id==="gigachad"?2:1;
    const maxCombo=char.comboMax+(upgrades["combo_max"]||0)*5+(upgrades["combo_max2"]||0)*15+(upgrades["combo_max3"]||0)*30+(upgrades["combo_max4"]||0)*60+(upgrades["combo_max5"]||0)*120+(upgrades["combo_max6"]||0)*300+upgradeEffectTotal(upgrades,"comboMax");
    setCombo(c=>Math.min(maxCombo,c+0.3*cspeed*gcBonus));
    setComboTimer(0.8);
    const spCharge=2+(upgrades["special_cd"]||0)*1+(upgrades["special_cd2"]||0)*2+(upgrades["special_cd3"]||0)*4+(upgrades["special_cd4"]||0)*8+(upgrades["special_cd5"]||0)*16+(upgrades["special_cd6"]||0)*40+upgradeEffectTotal(upgrades,"specialCharge");
    setSpecialCharge(s=>Math.min(100,s+spCharge));
    setCharPulse(true);setTimeout(()=>setCharPulse(false),90);
    // Vibration feedback on mobile
    if(typeof navigator!=="undefined"&&navigator.vibrate){
      navigator.vibrate(isCrit?[30,10,30]:[12]);
    }
    // Sound feedback
    playTap(isCrit);
    // Combo milestone notifications (5, 10, 15, 20, 25...)
    setCombo(prev=>{
      const next=Math.min(char.comboMax+(upgrades["combo_max"]||0)*5,prev+0.001);
      const milestone=Math.floor(next/5)*5;
      const prevMilestone=Math.floor(prev/5)*5;
      if(milestone>prevMilestone&&milestone>=5){
        setBestCombo(b=>Math.max(b,milestone));
        playComboMilestone(Math.min(4,Math.floor(milestone/5)));
        setComboMilestoneMsg(`🔥 ${milestone}× COMBO!`);
        setTimeout(()=>setComboMilestoneMsg(null),2000);
      }
      return prev; // actual combo set handled below
    });
    if(earned>tapBase*5){setShaking(true);setTimeout(()=>setShaking(false),180);}
  },[char,energy,combo,tapCount,upgrades,specialActive,checkAchievements,spawn]);

  const launchSpecial=useCallback(()=>{
    if(!char||specialCharge<100||specialActive)return;
    setSpecialActive(true);setSpecialCharge(0);setSpecialTimer(char.specialDuration*(1+upgradeEffectTotal(upgrades,"specialPower")*0.15));
    if(char.id==="gigachad")setCombo(char.comboMax);
    for(let i=0;i<14;i++)setTimeout(()=>spawn(window.innerWidth/2+(Math.random()-0.5)*300,window.innerHeight/2+(Math.random()-0.5)*260,["💥","⚡","🔥","✨","💫","🚀","💎","🌙","🎯","👑","🌟","🎆"][Math.floor(Math.random()*12)],char.color,true),i*50);
  },[char,specialCharge,specialActive,spawn]);

  const buyUpgrade=useCallback((id:string)=>{
    const u=UPGRADES.find(u=>u.id===id)!;
    const lv=upgrades[id]||0,cost=getUpgCost(u,lv);
    if(coins<cost)return;
    setCoins(c=>c-cost);
    setUpgrades(u=>({...u,[id]:(u[id]||0)+1}));
    {
      const nu={...upgrades,[id]:(upgrades[id]||0)+1};
      setMaxEnergy(1000+(nu["energy_max"]||0)*200+(nu["energy_max2"]||0)*500+(nu["energy_max3"]||0)*1000+(nu["energy_max4"]||0)*2000+(nu["energy_max5"]||0)*5000+(nu["energy_max6"]||0)*15000+upgradeEffectTotal(nu,"maxEnergy"));
    }
    showToast(`${u.emoji} ${u.name} Lv.${lv+1}!`);
  },[coins,upgrades]);

  // ── Prestige / Ascension ──
  const ascend=useCallback(()=>{
    const earned=liveRef.current.totalEarned;
    if(earned<100_000_000)return;
    const gained=Math.max(1,Math.floor(Math.sqrt(earned/100_000_000)));
    setUpgrades(u=>{
      const kept:Record<string,number>={};
      for(const[k,v]of Object.entries(u)){ if(k.startsWith("mp_")||k.startsWith("badge_")||k==="prestige_stars")kept[k]=v; }
      kept["prestige_stars"]=(kept["prestige_stars"]||0)+gained;
      return kept;
    });
    setCoins(0);
    setMaxEnergy(1000);
    setEnergy(1000);
    showToast(`🌟 ASCENDED! +${gained} star${gained>1?"s":""} (+${gained*50}% permanent income)`);
  },[]);

  const spendCoinsExact=useCallback(async(amount:number)=>{
    const ids=[playerId,user?.email,user?.id].filter((v):v is string=>!!v);
    const uid=ids[0];
    if(!uid||amount<=0)return false;
    const spend=Math.max(0,Math.floor(amount));
    const authToken=SUPA_KEY_CONST;
    type SpendRow={id:string;wallet_address:string;token_balance:unknown};
    let target:SpendRow|null=null;
    let current=Math.max(dbNum(liveRef.current.coins),dbNum(coins),dbNum(dbValuesRef.current?.coins));

    for(const pid of ids){
      try{
        const resp=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players?select=id,wallet_address,token_balance&wallet_address=eq.${encodeURIComponent(pid)}&limit=1`,{
          headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache, no-store"},
          cache:"no-store",
        });
        if(!resp.ok)continue;
        const rows=await resp.json().catch(()=>[] as SpendRow[]);
        const row=Array.isArray(rows)?rows[0]:null;
        if(!row)continue;
        if(!target)target=row as SpendRow;
        current=Math.max(current,dbNum((row as SpendRow).token_balance));
        if((row as SpendRow).wallet_address===user?.email)target=row as SpendRow;
      }catch{}
    }

    if(!target&&username){
      try{
        const byName=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players?select=id,wallet_address,token_balance,username&username=eq.${encodeURIComponent(username)}&order=last_seen.desc&limit=1`,{
          headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache, no-store"},
          cache:"no-store",
        });
        if(byName.ok){
          const rows=await byName.json().catch(()=>[] as SpendRow[]);
          const row=Array.isArray(rows)?rows[0]:null;
          if(row)target=row as SpendRow;
        }
      }catch{}
    }

    if(!target&&liveRef.current.charId){
      try{
        await syncPlayerDirect({
          pid:uid,
          uname:username||getPlayerName(uid)||(`Degen_${uid.slice(-6)}`),
          charId:liveRef.current.charId,
          totalEarned:liveRef.current.totalEarned,
          totalTaps:liveRef.current.totalTaps,
          coins:current,
          upgrades:liveRef.current.upgrades,
          solWallet:solWallet||undefined,
          avatarUrl:avatarUrl||undefined,
        },authToken);
        const created=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players?select=id,wallet_address,token_balance&wallet_address=eq.${encodeURIComponent(uid)}&limit=1`,{
          headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache, no-store"},
          cache:"no-store",
        });
        if(created.ok){
          const rows=await created.json().catch(()=>[] as SpendRow[]);
          const row=Array.isArray(rows)?rows[0]:null;
          if(row)target=row as SpendRow;
        }
      }catch{}
    }

    if(current<spend)return false;
    if(!target)return false;

    const nextBalance=Math.max(0,current-spend);
    const prevBalance=current;
    setCoins(nextBalance);
    liveRef.current.coins=nextBalance;
    dbValuesRef.current={
      totalTaps:liveRef.current.totalTaps,
      totalEarned:liveRef.current.totalEarned,
      coins:nextBalance,
      upgrades:liveRef.current.upgrades,
    };
    if(liveRef.current.charId){
      const s:SaveData={
        charId:liveRef.current.charId,
        coins:nextBalance,
        totalEarned:liveRef.current.totalEarned,
        totalTaps:liveRef.current.totalTaps,
        upgrades:liveRef.current.upgrades,
        highScore:Math.max(nextBalance,saveRef.current?.highScore||0),
      };
      persistSave(uid,s);
      saveRef.current=s;
      setGlobalTaps(uid,liveRef.current.totalTaps,liveRef.current.totalEarned);
    }

    try{
      const payload:Record<string,unknown>={token_balance:nextBalance,last_seen:new Date().toISOString()};
      if(liveRef.current.charId)payload.character=liveRef.current.charId;
      const patch=await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players?id=eq.${encodeURIComponent(target.id)}`,{
        method:"PATCH",
        headers:{"apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${authToken}`,"Content-Type":"application/json","Prefer":"return=representation","Cache-Control":"no-cache, no-store"},
        body:JSON.stringify(payload),
        cache:"no-store",
      });
      if(!patch.ok)throw new Error(`coin spend patch failed ${patch.status}`);
      const rows=await patch.json().catch(()=>[] as Array<Record<string,unknown>>);
      const saved=Array.isArray(rows)?rows[0]:null;
      if(!saved)throw new Error("coin spend patch returned no row");
      const verified=dbNum(saved.token_balance);
      setCoins(verified);
      liveRef.current.coins=verified;
      dbValuesRef.current={
        totalTaps:liveRef.current.totalTaps,
        totalEarned:liveRef.current.totalEarned,
        coins:verified,
        upgrades:liveRef.current.upgrades,
      };
      return true;
    }catch(e){
      console.error("spendCoinsExact failed",e);
      setCoins(prevBalance);
      liveRef.current.coins=prevBalance;
      dbValuesRef.current={
        totalTaps:liveRef.current.totalTaps,
        totalEarned:liveRef.current.totalEarned,
        coins:prevBalance,
        upgrades:liveRef.current.upgrades,
      };
      if(liveRef.current.charId){
        const rollback:SaveData={
          charId:liveRef.current.charId,
          coins:prevBalance,
          totalEarned:liveRef.current.totalEarned,
          totalTaps:liveRef.current.totalTaps,
          upgrades:liveRef.current.upgrades,
          highScore:Math.max(prevBalance,saveRef.current?.highScore||0),
        };
        persistSave(uid,rollback);
        saveRef.current=rollback;
      }
      return false;
    }
  },[avatarUrl,coins,playerId,solWallet,user?.email,user?.id,username]);

  void comboTimer;

  function handleSettingsSave(u:string,w:string,av:string,url?:string){
    const uid=playerId||user?.email||user?.id||"";
    setUsername(u);setPlayerName(u,uid);
    setSolWallet(w);setPlayerWallet(w,uid);
    setAvatar(av);setAvatarStore(av,uid);
    if(url!==undefined)setAvatarUrl(url);
    syncDB(uid,u,charId||"pepe",totalEarned,totalTaps,coins,upgrades,w||undefined,url||avatarUrl||undefined);
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return(
    <div style={{background:G.bg,minHeight:"100vh",position:"relative"}}>
      <TopBar username={username} avatar={avatar} avatarUrl={avatarUrl} onSettings={()=>setActiveTab("settings")} onProfile={()=>setActiveTab("profile")} onMenu={()=>setMenuOpen(true)} onLogout={signOut}/>
      <SideDrawer open={menuOpen} active={activeTab} onClose={()=>setMenuOpen(false)} onOpenTab={t=>setActiveTab(t as any)}/>
      {showModal&&<UsernameModal onConfirm={onUsername}/>}

      {/* Combo Milestone Notification */}
      {comboMilestoneMsg&&(
        <div style={{position:"fixed",top:120,left:"50%",transform:"translateX(-50%)",zIndex:301,
          background:"linear-gradient(135deg,#b45309,#f59e0b)",borderRadius:20,
          padding:"10px 22px",color:"#fff",fontWeight:900,fontSize:15,
          boxShadow:"0 0 40px rgba(245,158,11,0.7), 0 8px 24px rgba(0,0,0,0.4)",
          whiteSpace:"nowrap",animation:"comboMilestone 0.4s ease-out",
        }}>
          {comboMilestoneMsg}
        </div>
      )}
      {/* Achievement toast */}
      {newAchiev&&(
        <div style={{position:"fixed",top:64,left:"50%",transform:"translateX(-50%)",zIndex:300,
          background:"linear-gradient(135deg,#5b21b6,#a855f7)",borderRadius:20,
          padding:"10px 20px",color:"#fff",fontWeight:900,fontSize:13,
          boxShadow:"0 0 40px rgba(168,85,247,0.6), 0 8px 24px rgba(0,0,0,0.4)",
          whiteSpace:"nowrap",animation:"slideDown 0.3s ease-out",
        }}>
          🏅 {newAchiev}
        </div>
      )}
      {/* Upgrade toast */}
      {toast&&(
        <div style={{position:"fixed",top:64,left:"50%",transform:"translateX(-50%)",zIndex:299,
          background:"rgba(34,214,122,0.12)",border:"1px solid rgba(34,214,122,0.3)",
          backdropFilter:G.blur,borderRadius:16,
          padding:"8px 18px",color:"#22d67a",fontWeight:800,fontSize:12,
          whiteSpace:"nowrap",animation:"slideDown 0.2s ease-out",
        }}>
          {toast}
        </div>
      )}
      {/* Crit screen flash */}
      {critFlash&&<div style={{position:"fixed",inset:0,background:"rgba(255,50,50,0.06)",zIndex:150,pointerEvents:"none"}}/>}

      {/* In-app notifications */}
      <NotifLayer notifs={notifs} onDismiss={id=>setNotifs(n=>n.filter(x=>x.id!==id))}/>

      {/* Offline earnings modal */}
      {offlineReward&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div className="anim-popin" style={{width:"min(92vw,360px)",background:"linear-gradient(160deg,rgba(24,10,46,0.99),rgba(10,4,24,0.99))",border:"1.5px solid rgba(245,200,66,0.4)",borderRadius:24,padding:"26px 22px",textAlign:"center",boxShadow:"0 0 60px rgba(245,200,66,0.15)"}}>
            <div style={{fontSize:48,marginBottom:8,animation:"charFloat 3s ease-in-out infinite"}}>💤</div>
            <div style={{color:"#fff",fontWeight:900,fontSize:20,letterSpacing:"-0.02em",marginBottom:4}}>Welcome back!</div>
            <div style={{color:"#a794c3",fontSize:12.5,lineHeight:1.5,marginBottom:14}}>Your auto-tappers kept grinding for <b style={{color:"#fff"}}>{offlineReward.hours<1?`${Math.round(offlineReward.hours*60)} min`:`${offlineReward.hours.toFixed(1)}h`}</b> while you were away.</div>
            <div style={{background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:16,padding:"14px 0",marginBottom:14}}>
              <div style={{color:"#f5c842",fontWeight:900,fontSize:26}}>+{fmt(offlineReward.coins)}</div>
              <div style={{color:"#8f7ca7",fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>offline earnings</div>
            </div>
            <button onClick={()=>{const r=offlineReward;setOfflineReward(null);setCoins(c=>c+r.coins);setTotalEarned(t=>t+r.coins);showToast(`💤 +${fmt(r.coins)} offline earnings!`);}} className="press-fx"
              style={{width:"100%",background:"linear-gradient(135deg,#f5c842,#f59e0b)",border:"none",borderRadius:14,color:"#1a0f00",fontWeight:900,fontSize:14,padding:"14px 0",cursor:"pointer"}}>COLLECT</button>
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab==="home"&&<HomeTab onPlay={()=>setActiveTab("play")} onGames={()=>setActiveTab("games")} username={username} avatar={avatar} avatarUrl={avatarUrl} totalEarned={totalEarned} totalTaps={totalTaps} level={level} rank={rank} xpProgress={xpProgress} nextRank={nextRank} charId={charId} playerId={playerId} onClaimDaily={(reward,streak)=>{setCoins(c=>c+reward); showToast(`🎁 Day ${streak} chest! +${fmt(reward)} coins`);}}/>}
      {activeTab==="games"&&<GamesTab playerId={playerId} coins={coins} boostMult={boost.until>Date.now()?boost.mult:1} boostLeft={boostLeft} onChestOpen={(cost,res)=>{
        bumpDayEvent("chest");
        setCoins(c=>c-cost+(res.coins||0));
        if(res.boostMult&&res.boostMins){
          const b={mult:res.boostMult,until:Date.now()+res.boostMins*60000};
          setBoost(b);try{localStorage.setItem(`degen_boost_${playerId}`,JSON.stringify(b));}catch{}
          showToast(`⚡ ${res.boostMult}× tap boost for ${res.boostMins} min!`);
        }else if(res.jackpot){showToast(`🎉 JACKPOT! +${fmt(res.coins)} coins!`);}
      }} onWheelWin={(won,paid)=>{setCoins(c=>c-paid+won);setTotalEarned(t=>t+won);showToast(`🎡 Wheel: +${fmt(won)} coins!`);bumpDayEvent("wheel");}}
      dayStats={dayStats}
      onQuestClaim={(reward,allDone)=>{setCoins(c=>c+reward);setTotalEarned(t=>t+reward);showToast(allDone?`📋 ALL QUESTS CLEARED! +${fmt(reward)} (incl. 500K bonus)`:`📋 Quest done! +${fmt(reward)} coins`);}}
      onCasino={(delta,msg)=>{setCoins(c=>c+delta);if(delta>0)setTotalEarned(t=>t+delta);showToast(delta>0?`🎰 ${msg} +${fmt(delta)}`:`🎰 ${msg} -${fmt(-delta)}`);bumpDayEvent("casino");}}/>}
      {activeTab==="profile"&&<ProfileTab playerId={playerId} username={username} avatar={avatar} avatarUrl={avatarUrl} solWallet={solWallet} charId={charId} totalEarned={totalEarned} totalTaps={totalTaps} coins={coins} level={level} rank={rank} nextRank={nextRank} upgrades={upgrades} achievCount={achievSet.size} onOpenSettings={()=>setActiveTab("settings")} onClaimRef={(reward,count)=>{setCoins(c=>c+reward); showToast(`🤝 +${fmt(reward)} coins from ${count} invite${count>1?"s":""}!`);}} onAscend={ascend}/>}
      {activeTab==="quests"&&<MissionsTab playerId={playerId} totalTaps={totalTaps} totalEarned={totalEarned} upgrades={upgrades} charId={charId} onClaim={(id,reward)=>{setCoins(c=>c+reward); showToast(`Mission cleared! +${fmt(reward)} coins`);}}/>}
      {activeTab==="achievements"&&<AchievementsTab achievSet={achievSet} totalTaps={totalTaps} coins={coins}/>}
      {activeTab==="compete"&&<CompeteTab playerId={playerId} username={username} charId={charId} totalEarned={totalEarned} onReward={(coins,label,badgeKey)=>{setCoins(c=>c+coins); if(badgeKey)setUpgrades(u=>({...u,[badgeKey]:(u[badgeKey]||0)+1})); showToast(`${label}: +${fmt(coins)} coins!${badgeKey?" 🎖 Badge unlocked!":""}`);}}/>}
      {activeTab==="ranks"&&<LeaderboardTab myPlayerId={playerId} liveTaps={totalTaps} liveEarned={totalEarned} liveUsername={username} liveAvatarUrl={avatarUrl} liveCharId={charId||"pepe"} key="lb"/>}
      {activeTab==="multi"&&<MultiplayerArena playerId={playerId} username={username} avatar={avatar} avatarUrl={avatarUrl} charId={charId} coins={coins} onSpendCoins={spendCoinsExact}/>}
      {activeTab==="shop"&&<ShopTab coins={coins} charId={charId} upgrades={upgrades} onBuyUpgrade={buyUpgrade} playerLevel={level}/>}
      {activeTab==="settings"&&<SettingsTab username={username} solWallet={solWallet} currentAvatarUrl={avatarUrl} onSave={handleSettingsSave}/>}

      {activeTab==="play"&&(
        <>
          {/* ── CHARACTER SELECT ── */}
          {screen==="select"&&(
            <div style={{minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column",alignItems:"center",padding:"52px 16px 110px",position:"relative",overflowY:"auto"}}>
              <div className="arcade-grid"/>
              <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 25%,rgba(100,30,180,0.25) 0%,transparent 65%)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"24px 0 22px"}} className="anim-slideup">
                <img src="/logo.png" alt="Degen Clicker" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
                  style={{width:96,height:96,objectFit:"contain",marginBottom:6,filter:"drop-shadow(0 0 34px rgba(168,85,247,0.8))",animation:"charFloat 3.6s ease-in-out infinite"}}/>
                <div className="neon-flicker" style={{color:"rgba(192,132,252,0.75)",fontSize:10,fontWeight:800,letterSpacing:"0.26em",textTransform:"uppercase",marginBottom:5,textShadow:"0 0 16px rgba(168,85,247,0.7)"}}>◆ SELECT YOUR FIGHTER ◆</div>
                <h2 style={{color:"#fff",fontWeight:900,fontSize:24,margin:"0 0 5px",letterSpacing:"-0.03em"}}>Choose Your Legend</h2>
                <p style={{color:"#8b79a9",fontSize:12,margin:0,fontWeight:600}}>Each legend has unique abilities and passives</p>
              </div>
              {!dbLoaded&&<div style={{color:"#f5c842",fontSize:13,fontWeight:800,marginBottom:10,letterSpacing:"0.06em",textShadow:"0 0 14px rgba(245,200,66,0.5)",position:"relative",zIndex:1}}>⏳ Loading your account…</div>}
              <div style={{display:"flex",gap:13,flexWrap:"wrap",justifyContent:"center",maxWidth:480,position:"relative",zIndex:1}}>
                {CHARACTERS.map((c,ci)=>{
                  const s=loadSave(user?.email||user?.id||playerId,c.id);
                  return(
                    <button key={c.id} onClick={()=>dbLoaded&&tryStart(c.id)} disabled={!dbLoaded}
                      className="anim-popin press-fx"
                      style={{
                        width:138,
                        background:`linear-gradient(160deg,rgba(${c.glow},0.09),rgba(${c.glow},0.02) 70%)`,
                        border:`1.5px solid rgba(${c.glow},0.25)`,
                        borderRadius:24,cursor:"pointer",padding:"0 10px 16px",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                        transition:"border 0.25s, box-shadow 0.25s, transform 0.25s",
                        boxShadow:`0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)`,
                        position:"relative",overflow:"hidden",
                        animationDelay:`${ci*0.08}s`,
                      }}
                      onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor=`rgba(${c.glow},0.85)`;el.style.transform="translateY(-7px) scale(1.02)";el.style.boxShadow=`0 18px 44px rgba(${c.glow},0.35), inset 0 1px 0 rgba(255,255,255,0.08)`;}}
                      onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor=`rgba(${c.glow},0.25)`;el.style.transform="";el.style.boxShadow="0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)";}}>
                      {/* Top glow strip */}
                      <div style={{position:"absolute",top:0,left:"15%",right:"15%",height:2,background:`linear-gradient(90deg,transparent,rgba(${c.glow},0.8),transparent)`,boxShadow:`0 0 12px rgba(${c.glow},0.6)`}}/>
                      {/* Character portrait — animated */}
                      <div className="char-idle" style={{marginTop:16,animationDelay:`${ci*0.4}s`}}>
                        <div style={{
                          width:84,height:84,borderRadius:"50%",overflow:"hidden",
                          border:`2px solid rgba(${c.glow},0.45)`,
                          background:`radial-gradient(ellipse at 50% 30%,rgba(${c.glow},0.18),rgba(6,0,15,0.85))`,
                          boxShadow:`0 0 26px rgba(${c.glow},0.3)`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                        }}>
                          <img src={c.image} alt={c.name} draggable={false}
                            style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}
                            onError={e=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<span style="font-size:46px;filter:drop-shadow(0 0 14px rgba(${c.glow},0.6))">${c.emoji}</span>`;}}/>
                        </div>
                      </div>
                      <div style={{color:"#fff",fontWeight:900,fontSize:15,letterSpacing:"-0.01em",textShadow:`0 0 16px rgba(${c.glow},0.4)`}}>{c.name}</div>
                      <div style={{
                        background:`rgba(${c.glow},0.13)`,border:`1px solid rgba(${c.glow},0.32)`,
                        borderRadius:9,padding:"4px 10px",fontSize:9.5,color:`rgb(${c.glow})`,
                        fontWeight:800,textAlign:"center",lineHeight:1.3,
                      }}>⚡ {c.ability}</div>
                      <div style={{fontSize:9,color:"#8b79a9",lineHeight:1.45,textAlign:"center",minHeight:26}}>{c.abilityDesc}</div>
                      {s.totalEarned>0&&(
                        <div style={{fontSize:9,color:"#f5c842",background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.18)",borderRadius:7,padding:"3px 8px",fontWeight:700}}>💰 {fmt(s.totalEarned)} saved</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── GAME SCREEN ── */}
          {screen==="game"&&char&&(
            <div style={{
              minHeight:"100vh",height:"100vh",background:G.bg,
              display:"flex",flexDirection:"column",alignItems:"center",
              paddingBottom:88,position:"relative",overflow:"hidden",boxSizing:"border-box",
              userSelect:"none",WebkitUserSelect:"none",
            }} className={shaking?"shake":""}>
              <div style={{position:"fixed",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse at 50% 40%,rgba(${char.glow},${specialActive?0.3:0.12}) 0%,transparent 60%)`,transition:"background 0.6s"}}/>

              {/* Top stats bar */}
              <div style={{width:"100%",maxWidth:480,padding:"58px 16px 6px",zIndex:10,position:"relative"}}>
                {/* Coins + rank row */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <button onClick={()=>setScreen("select")} className="press-fx" style={{background:G.glass,border:`1px solid ${G.border}`,color:"#9b8ab8",borderRadius:12,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700}}>⬅ Back</button>

                  {/* Big coin display */}
                  <div style={{
                    background:"linear-gradient(135deg,rgba(245,200,66,0.1),rgba(245,200,66,0.05))",
                    border:"1px solid rgba(245,200,66,0.25)",
                    borderRadius:16,padding:"6px 16px",
                    textAlign:"center",
                  }}>
                    <div style={{fontSize:24,fontWeight:900,color:G.gold,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.02em",textShadow:"0 0 18px rgba(245,200,66,0.45)"}}>💰 {fmt(coins)}</div>
                    <div style={{fontSize:8.5,color:"#9b8ab8",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700}}>$DEGEN</div>
                  </div>

                  {/* Rank */}
                  <div style={{textAlign:"right"}}>
                    <div style={{color:rank.color,fontWeight:800,fontSize:12,marginBottom:1}}>{rank.emoji} {rank.name}</div>
                    <div style={{color:"#7a6a9a",fontSize:9}}>Level {level}</div>
                  </div>
                </div>

                {/* XP bar */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:8,color:"#7a6a9a",fontWeight:700,flexShrink:0}}>Lv.{level}</span>
                  <div style={{flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${xpProgress.pct}%`,background:`linear-gradient(90deg,${rank.color}55,${rank.color})`,borderRadius:2,transition:"width 0.5s",boxShadow:`0 0 6px ${rank.color}66`}}/>
                  </div>
                  {nextRank&&<span style={{fontSize:8,color:nextRank.color,flexShrink:0}}>{nextRank.emoji}</span>}
                </div>

                {/* Mini stats row */}
                <div style={{display:"flex",gap:6}}>
                  {[
                    {label:"Total",value:`💰${fmt(totalEarned)}`},
                    {label:"Taps",value:`👆${fmt(totalTaps)}`},
                    ...(autoRate>0?[{label:"Auto",value:`🤖${autoRate}/s`}]:[]),
                    ...(combo>1.5?[{label:"Combo",value:`×${(Math.floor(combo*10)/10).toFixed(1)}`}]:[]),
                    ...(boostLeft>0?[{label:"Boost",value:`⚡${boost.mult}× ${Math.ceil(boostLeft/60)}m`}]:[]),
                  ].map(s=>(
                    <div key={s.label} style={{flex:1,background:G.glass,border:`1px solid ${G.border}`,borderRadius:10,padding:"5px 6px",textAlign:"center"}}>
                      <div style={{color:"#8b79a9",fontSize:7.5,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2,fontWeight:700}}>{s.label}</div>
                      <div style={{color:"#e8e0f5",fontWeight:800,fontSize:11.5}}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Golden coin random event */}
              {goldCoin&&(
                <button onClick={grabGoldCoin} style={{position:"fixed",left:`${goldCoin.x}%`,top:`${goldCoin.y}%`,zIndex:60,background:"none",border:"none",cursor:"pointer",fontSize:42,filter:"drop-shadow(0 0 18px rgba(245,200,66,0.9))",animation:"goldenFloat 1.2s ease-in-out infinite",padding:6}}>🪙</button>
              )}

              {/* Frenzy active banner */}
              {frenzyLeft>0&&(
                <div style={{position:"relative",zIndex:10,background:"linear-gradient(135deg,#f5c842,#f59e0b)",borderRadius:20,padding:"5px 20px",marginBottom:6,fontSize:12,fontWeight:900,color:"#1a0f00",animation:"frenzyPulse 0.6s infinite"}}>
                  🔥 {frenzy.mult}× FRENZY · {frenzyLeft}s
                </div>
              )}

              {/* Special active banner */}
              {specialActive&&(
                <div style={{
                  position:"relative",zIndex:10,
                  background:`linear-gradient(135deg,rgba(${char.glow},0.9),rgba(${char.glow},0.6))`,
                  borderRadius:20,padding:"5px 20px",marginBottom:6,
                  fontSize:12,fontWeight:900,color:"#fff",
                  boxShadow:`0 0 30px rgba(${char.glow},0.8)`,
                  animation:"pulseBanner 0.5s infinite",
                }}>
                  ⚡ {char.specialName.toUpperCase()} · {specialTimer.toFixed(1)}s
                </div>
              )}

              {/* Character — whole zone is tappable */}
              <div onMouseDown={handleTap} onTouchStart={handleTap} style={{position:"relative",zIndex:10,width:"100%",flex:1,minHeight:330,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",WebkitTapHighlightColor:"transparent"}}>
                <div style={{position:"relative",width:300,height:310,pointerEvents:"none"}}>
                  <div style={{pointerEvents:"auto"}}>
                    <ModelStage char={char} specialActive={specialActive} charPulse={charPulse} onTap={handleTap} firstPlay={totalTaps<3}/>
                  </div>
                </div>
              </div>

              {/* Energy bar */}
              <div style={{width:"100%",maxWidth:340,padding:"0 16px 7px",position:"relative",zIndex:10,boxSizing:"border-box"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,color:"#9b8ab8",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em"}}>⚡ Energy</span>
                  <span style={{fontSize:10,color:"#9b8ab8",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{Math.floor(energy)}/{maxEnergy}</span>
                </div>
                <div style={{height:9,background:"rgba(255,255,255,0.05)",borderRadius:5,overflow:"hidden",border:`1px solid ${G.border}`}}>
                  <div style={{
                    height:"100%",borderRadius:3,width:`${(energy/maxEnergy)*100}%`,
                    background:(energy/maxEnergy)>0.5
                      ?`linear-gradient(90deg,rgba(${char.glow},0.7),rgb(${char.glow}))`
                      :(energy/maxEnergy)>0.2
                        ?"linear-gradient(90deg,#cc8800,#ffaa00)"
                        :"linear-gradient(90deg,#aa2233,#ff4455)",
                    transition:"width 0.15s",
                    boxShadow:`0 0 10px rgba(${char.glow},0.45)`,
                  }}/>
                </div>
              </div>

              {/* Special charge */}
              <div style={{width:"100%",maxWidth:340,padding:"0 16px 8px",position:"relative",zIndex:10,boxSizing:"border-box"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,color:"#9b8ab8",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em"}}>✨ {char.specialName}</span>
                  <span style={{fontSize:10,fontWeight:700,color:specialCharge>=100?`rgb(${char.glow})`:"#9b8ab8"}}>{Math.floor(specialCharge)}%</span>
                </div>
                <div onClick={launchSpecial} style={{height:10,background:"rgba(255,255,255,0.04)",borderRadius:4,overflow:"hidden",cursor:specialCharge>=100&&!specialActive?"pointer":"default",border:specialCharge>=100&&!specialActive?`1px solid rgba(${char.glow},0.5)`:`1px solid ${G.border}`}}>
                  <div style={{height:"100%",borderRadius:4,width:`${specialCharge}%`,background:`linear-gradient(90deg,rgba(${char.glow},0.5),rgb(${char.glow}))`,transition:"width 0.2s",boxShadow:specialCharge>=100?`0 0 12px rgba(${char.glow},0.6)`:"none"}}/>
                </div>
                {specialCharge>=100&&!specialActive&&(
                  <button onClick={launchSpecial} style={{
                    width:"100%",marginTop:7,padding:"9px",
                    background:`linear-gradient(135deg,rgba(${char.glow},0.8),rgba(${char.glow},0.6))`,
                    border:"none",borderRadius:12,color:"#fff",fontWeight:900,fontSize:13,
                    cursor:"pointer",boxShadow:`0 0 24px rgba(${char.glow},0.7)`,
                    animation:"pulseBanner 0.5s infinite",
                  }}>
                    ✨ ACTIVATE {char.specialName.toUpperCase()}!
                  </button>
                )}
              </div>

              {/* Quick upgrades */}
              <div style={{width:"100%",maxWidth:480,position:"relative",zIndex:10}}>
                <QuickStrip coins={coins} upgrades={upgrades} onBuyUpgrade={buyUpgrade}/>
              </div>

              {/* Particles */}
              <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:50}}>
                {particles.map(p=>(
                  <div key={p.id} style={{position:"absolute",left:p.x,top:p.y,color:p.color,fontWeight:900,fontSize:p.big?18:13,textShadow:`0 0 10px ${p.color}`,pointerEvents:"none",animation:"floatUp 1.1s ease-out forwards",whiteSpace:"nowrap",transform:"translate(-50%,-50%)"}}>
                    {p.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <BottomBar active={activeTab} onTab={t=>setActiveTab(t as any)} onMenu={()=>setMenuOpen(true)}/>

      <style>{`
        @keyframes floatUp { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,calc(-50% - 110px)) scale(0.5)} }
        @keyframes chestShake { 0%,100%{transform:rotate(-8deg) scale(1.1)} 50%{transform:rotate(8deg) scale(1.15)} }
        @keyframes notifIn { 0%{opacity:0;transform:translateY(-16px) scale(0.96)} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes frenzyPulse { 0%,100%{box-shadow:0 0 30px rgba(245,200,66,0.5)} 50%{box-shadow:0 0 60px rgba(245,200,66,0.9)} }
        @keyframes goldenFloat { 0%,100%{transform:translateY(0) rotate(-6deg)} 50%{transform:translateY(-10px) rotate(6deg)} }
        @keyframes slideDown { 0%{opacity:0;transform:translateX(-50%) translateY(-14px)} 100%{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes pulseBanner { 0%,100%{opacity:1} 50%{opacity:0.75} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.8)} }
        @keyframes tabPop { 0%{transform:scale(0.92)} 60%{transform:scale(1.08)} 100%{transform:scale(1)} }
        @keyframes floatHint { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-6px)} }
        @keyframes orbit1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes orbit2 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .shake { animation: shakeFx 0.18s ease-out; }
        @keyframes shakeFx { 0%,100%{transform:translate(0)} 25%{transform:translate(-4px,2px)} 50%{transform:translate(4px,-2px)} 75%{transform:translate(-2px,3px)} }
        * { -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
        ::-webkit-scrollbar { height:3px; width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(168,85,247,0.35); border-radius:2px; }
      `}</style>
    </div>
  );
}
