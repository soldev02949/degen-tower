"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getLevelFromXP, getLevelProgress, getRankFromLevel, getNextRank } from "@/lib/progression";
import { useAuth } from "@/lib/auth";

// ─── Characters ───────────────────────────────────────────────────────────────
export const CHARACTERS = [
  { id:"pepe",     name:"Pepe",      emoji:"🐸", image:"/characters/pepe.png",     color:"#4caf50", glow:"76,175,80",   baseCoins:1, ability:"Lucky Tap",   abilityDesc:"15% chance to triple coins",       specialName:"Comfy Mode",   specialDesc:"2× all earnings for 30s", specialDuration:30, passive:(c:number)=>Math.random()<0.15?c*3:c, specialMultiplier:2, energyRegen:1,   comboMax:10 },
  { id:"gigachad", name:"Gigachad",  emoji:"💪", image:"/characters/gigachad.png", color:"#e0b87a", glow:"224,184,122", baseCoins:1, ability:"Sigma Grind", abilityDesc:"Combo builds 2× faster, 20× max",  specialName:"Max Mode",     specialDesc:"20× combo instantly for 20s", specialDuration:20, passive:(c:number)=>c, specialMultiplier:5, energyRegen:1,   comboMax:20 },
  { id:"trump",    name:"Trump",     emoji:"🎩", image:"/characters/trump.png",    color:"#3b82f6", glow:"59,130,246",  baseCoins:2, ability:"Deal Maker",  abilityDesc:"Every 50 taps = 10× burst",        specialName:"MAGA Mode",    specialDesc:"Helpers 5× + tap 3× for 40s", specialDuration:40, passive:(c:number)=>c, specialMultiplier:3, energyRegen:0.8, comboMax:12 },
  { id:"troll",    name:"Trollface", emoji:"🧌", image:"/characters/troll.png",    color:"#a855f7", glow:"168,85,247",  baseCoins:1, ability:"Chaos Agent", abilityDesc:"Random 0.5–8× per tap",            specialName:"CHAOS MODE",   specialDesc:"10s of 1–15× random", specialDuration:10, passive:(c:number)=>c*(0.5+Math.random()*7.5), specialMultiplier:1, energyRegen:1.2, comboMax:10 },
  { id:"bonk",     name:"Bonk",      emoji:"🐕", image:"/characters/bonk.png",     color:"#e8853a", glow:"232,133,58",  baseCoins:1, ability:"BONK Speed",  abilityDesc:"3× energy regen",                  specialName:"BONK Frenzy",  specialDesc:"Infinite energy + 3× for 15s", specialDuration:15, passive:(c:number)=>c, specialMultiplier:3, energyRegen:3,   comboMax:10 },
];

// ─── Upgrades (40 items) ──────────────────────────────────────────────────────
const UPGRADES: Array<{id:string;name:string;emoji:string;desc:string;baseCost:number;costMult:number;tapsPerSec?:number;minLevel?:number;category:string}> = [
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
];

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

async function syncDB(pid:string,uname:string,charId:string,totalEarned:number,totalTaps:number,coins:number,upgrades?:Record<string,number>,solWallet?:string,avatarUrl?:string){
  if(!pid)return;
  try{
    const payload:Record<string,unknown>={
      wallet_address:pid, username:uname||("Degen_"+pid.slice(-6)), character:charId,
      total_score:Math.floor(totalEarned), games_played:Math.floor(totalTaps),
      token_balance:Math.floor(coins), is_verified:false,
      last_seen:new Date().toISOString(),
    };
    if(upgrades)payload.upgrades=upgrades;
    if(solWallet)payload.sol_wallet=solWallet;
    if(avatarUrl)payload.avatar_url=avatarUrl;
    // Use raw fetch with no-cache to guarantee writes reach Postgres immediately
    await fetch(`${SUPA_URL_CONST}/rest/v1/dt_players`,{
      method:"POST",
      headers:{
        "apikey":SUPA_KEY_CONST,"Authorization":`Bearer ${SUPA_KEY_CONST}`,
        "Content-Type":"application/json","Prefer":"resolution=merge-duplicates",
        "Cache-Control":"no-cache",
      },
      body:JSON.stringify(payload),
    });
  }catch(e){console.error("syncDB error",e);}
}

interface Particle { id:number; x:number; y:number; value:string; color:string; big:boolean; }
interface LBEntry { id:string; wallet_address:string; username:string; character:string; total_score:number; games_played:number; avatar_url?:string; last_seen?:string; }
function isOnline(last_seen?:string){if(!last_seen)return false;return(Date.now()-new Date(last_seen).getTime())<3*60*1000;}

// ─── Countdown ────────────────────────────────────────────────────────────────
function useCountdown(){
  const [t,setT]=useState("");
  useEffect(()=>{
    function c(){ const now=Date.now(),p=48*3600000,next=Math.ceil(now/p)*p,d=next-now; const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000); setT(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`); }
    c(); const id=setInterval(c,1000); return()=>clearInterval(id);
  },[]);
  return t;
}

// ─── TOP BAR (glass) ─────────────────────────────────────────────────────────
function AvatarDisplay({emoji,url,size=28}:{emoji:string;url?:string;size?:number}){
  if(url){return <img src={url} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"1.5px solid rgba(168,85,247,0.5)",flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>;}
  return <span style={{fontSize:Math.round(size*0.65),lineHeight:1,flexShrink:0}}>{emoji||"🐸"}</span>;
}

function TopBar({username,avatar,avatarUrl,onSettings,onLogout}:{username:string;avatar:string;avatarUrl?:string;onSettings:()=>void;onLogout:()=>void}){
  return(
    <div style={{
      position:"fixed",top:0,left:0,right:0,zIndex:200,
      background:"rgba(6,0,15,0.85)",
      backdropFilter:G.blur,
      borderBottom:`1px solid ${G.border}`,
      padding:"0 16px",height:52,
      display:"flex",alignItems:"center",gap:10,
    }}>
      <img src="/logo.png" alt="" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
        style={{width:28,height:28,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(168,85,247,0.7))"}}/>
      <span style={{color:"#fff",fontWeight:900,fontSize:14,letterSpacing:"-0.03em",flex:1,background:"linear-gradient(90deg,#fff,#c084fc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
        DEGEN CLICKER
      </span>
      <a href="/whitepaper" target="_blank" rel="noopener noreferrer" style={{
        background:G.purpleDim,border:`1px solid rgba(168,85,247,0.25)`,
        borderRadius:20,color:"#c084fc",fontSize:10,fontWeight:700,
        padding:"5px 10px",cursor:"pointer",textDecoration:"none",whiteSpace:"nowrap",
      }}>📄 Whitepaper</a>
      <div style={{
        display:"flex",alignItems:"center",gap:6,
        background:G.glass,border:`1px solid ${G.glassBorder}`,
        borderRadius:20,padding:"4px 10px 4px 6px",
      }}>
        <AvatarDisplay emoji={avatar} url={avatarUrl} size={28}/>
        <span style={{color:"#ccc",fontSize:12,fontWeight:700,maxWidth:72,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username||"Degen"}</span>
      </div>
      <button onClick={onSettings} style={{
        background:G.glass,border:`1px solid ${G.glassBorder}`,
        borderRadius:10,color:"#888",fontSize:13,padding:"6px 10px",cursor:"pointer",
      }}>⚙️</button>
      <button onClick={onLogout} style={{
        background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",
        borderRadius:10,color:"#ef4444",fontSize:11,fontWeight:700,padding:"6px 12px",cursor:"pointer",
      }}>Log out</button>
    </div>
  );
}

// ─── BOTTOM BAR (glass) ──────────────────────────────────────────────────────
const TABS=[{id:"home",label:"Home",emoji:"🏠"},{id:"play",label:"Play",emoji:"🎮"},{id:"shop",label:"Shop",emoji:"⚡"},{id:"ranks",label:"Ranks",emoji:"🏆"},{id:"settings",label:"Settings",emoji:"⚙️"}];

function BottomBar({active,onTab}:{active:string;onTab:(t:string)=>void}){
  const accentFor=(id:string)=>id==="play"?"#a855f7":id==="ranks"?"#f5c842":id==="shop"?"#22d67a":id==="settings"?"#888":"#c084fc";
  return(
    <div style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:100,
      background:"rgba(6,0,15,0.92)",
      borderTop:`1px solid ${G.border}`,
      backdropFilter:G.blur,
      display:"flex",
      paddingBottom:"env(safe-area-inset-bottom,0px)",
    }}>
      {TABS.map(tab=>{
        const ac=accentFor(tab.id);
        const isActive=active===tab.id;
        return(
          <button key={tab.id} onClick={()=>onTab(tab.id)} style={{
            flex:1,background:"none",border:"none",padding:"10px 0 8px",
            display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            cursor:"pointer",position:"relative",
          }}>
            {isActive&&(
              <div style={{
                position:"absolute",top:0,left:"25%",right:"25%",height:2,
                background:ac,borderRadius:"0 0 3px 3px",
                boxShadow:`0 0 8px ${ac}`,
              }}/>
            )}
            <span style={{
              fontSize:20,filter:isActive?`drop-shadow(0 0 6px ${ac})`:"none",
              transition:"filter 0.2s",
            }}>{tab.emoji}</span>
            <span style={{
              fontSize:9,fontWeight:isActive?800:500,
              color:isActive?ac:"#444",
              textTransform:"uppercase",letterSpacing:"0.05em",
              transition:"color 0.2s",
            }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
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
        <p style={{color:"#5a3a7a",fontSize:13,marginBottom:24,lineHeight:1.6}}>Choose a name for the leaderboard.<br/>Add your Solana wallet to receive prize payouts.</p>

        <div style={{marginBottom:14,textAlign:"left"}}>
          <label style={{color:"#7844bb",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:6}}>Display Name</label>
          <input value={name} onChange={e=>setName(e.target.value.slice(0,18))} onKeyDown={e=>e.key==="Enter"&&validate()} placeholder={sug} autoFocus
            style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid rgba(168,85,247,0.3)`,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,padding:"12px 14px",outline:"none",boxSizing:"border-box",transition:"border 0.2s"}}/>
          <div style={{color:"#3a2255",fontSize:10,marginTop:4}}>Suggestion: {sug}</div>
        </div>

        <div style={{marginBottom:24,textAlign:"left"}}>
          <label style={{color:"#7844bb",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:6}}>
            Solana Wallet <span style={{color:"#3a2255",fontWeight:500,textTransform:"none"}}>— optional</span>
          </label>
          <input value={wallet} onChange={e=>{setWallet(e.target.value);setWalletErr("");}} placeholder="e.g. 7xKXt…qF2P" onKeyDown={e=>e.key==="Enter"&&validate()}
            style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${walletErr?"rgba(255,60,60,0.5)":"rgba(168,85,247,0.2)"}`,borderRadius:12,color:"#22d67a",fontSize:12,fontWeight:600,padding:"12px 14px",outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
          {walletErr
            ?<div style={{color:"#ff6060",fontSize:10,marginTop:4}}>⚠ {walletErr}</div>
            :<div style={{color:"#3a2255",fontSize:10,marginTop:4}}>Required to receive USDC prize payouts 🏆</div>
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
  const SIZE=250;
  return(
    <div style={{position:"relative",width:SIZE,height:SIZE,margin:"0 auto",flexShrink:0}}>
      {/* Ambient glow ring */}
      <div style={{position:"absolute",inset:-20,borderRadius:"50%",background:`radial-gradient(ellipse at 50% 60%,rgba(${char.glow},${specialActive?0.5:0.2}) 0%,transparent 70%)`,pointerEvents:"none",transition:"background 0.6s"}}/>
      {/* Orbit rings when special active */}
      {specialActive&&<>
        <div style={{position:"absolute",inset:-10,borderRadius:"50%",border:`1px solid rgba(${char.glow},0.6)`,animation:"orbit1 3s linear infinite",pointerEvents:"none",boxShadow:`0 0 12px rgba(${char.glow},0.3)`}}/>
        <div style={{position:"absolute",inset:-20,borderRadius:"50%",border:`1px solid rgba(${char.glow},0.25)`,animation:"orbit2 6s linear infinite reverse",pointerEvents:"none"}}/>
      </>}
      {/* Main tap circle */}
      <div
        onMouseDown={onTap} onTouchStart={onTap}
        style={{
          position:"absolute",inset:0,borderRadius:"50%",overflow:"hidden",
          cursor:"pointer",userSelect:"none",WebkitUserSelect:"none",
          border:specialActive?`2px solid rgba(${char.glow},1)`:`2px solid rgba(${char.glow},0.4)`,
          boxShadow:specialActive
            ?`0 0 60px rgba(${char.glow},0.8),0 0 120px rgba(${char.glow},0.4),inset 0 0 40px rgba(${char.glow},0.15)`
            :`0 0 30px rgba(${char.glow},0.3),inset 0 0 20px rgba(${char.glow},0.05)`,
          transition:"box-shadow 0.4s,border 0.4s,transform 0.08s",
          transform:charPulse?"scale(0.92)":"scale(1)",
          background:`radial-gradient(ellipse at 50% 30%,rgba(${char.glow},0.1) 0%,rgba(6,0,15,0.8) 100%)`,
          backdropFilter:"blur(2px)",
        }}
      >
        <img src={char.image} alt={char.name} draggable={false}
          style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block",pointerEvents:"none",
            filter:specialActive?`brightness(1.2) saturate(1.4) drop-shadow(0 0 16px rgba(${char.glow},0.6))`:"none",transition:"filter 0.4s"}}
          onError={e=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:110px;filter:drop-shadow(0 0 20px rgba(${char.glow},0.5))">${char.emoji}</div>`;}}
        />
      </div>
      {firstPlay&&(
        <div style={{position:"absolute",bottom:-32,left:"50%",transform:"translateX(-50%)",fontSize:11,color:"#7c4ab0",fontWeight:700,whiteSpace:"nowrap",animation:"floatHint 1.5s ease-in-out infinite"}}>
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
  const [avatar,setAvatar]=useState(()=>getAvatar(user?.id||"")||"🐸");
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
    setAvatarStore(avatar, user?.id||"");
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
      await supabase.from("dt_players").delete().eq("wallet_address",user?.id||"");
      await signOut();
    }catch{await signOut();}
  }

  const card = {background:G.glass,border:`1px solid ${G.border}`,borderRadius:18,padding:"18px 16px",marginBottom:12} as const;
  const label = {color:"#5a3a7a",fontSize:10,fontWeight:700 as const,textTransform:"uppercase" as const,letterSpacing:"0.08em",display:"block" as const,marginBottom:8};
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
          {user?.email&&<div style={{color:"#3a2255",fontSize:11}}>{user.email}</div>}
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
          <div style={{color:"#3a2255",fontSize:10,marginTop:6}}>Max 2MB · JPG, PNG, GIF, WEBP</div>
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
          <div style={{color:"#3a2255",fontSize:10,marginBottom:8}}>Required for prize payouts</div>
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

// ─── HOME TAB (glass) ────────────────────────────────────────────────────────
function HomeTab({onPlay,username,avatar,avatarUrl,totalEarned,totalTaps,level,rank,xpProgress,nextRank,charId}:{
  onPlay:()=>void;username:string;avatar:string;avatarUrl?:string;totalEarned:number;totalTaps:number;
  level:number;rank:ReturnType<typeof getRankFromLevel>;xpProgress:{pct:number;current:number;needed:number};
  nextRank:ReturnType<typeof getNextRank>;charId:string|null;
}){
  const cd=useCountdown();
  const char=CHARACTERS.find(c=>c.id===charId);
  const [pulse,setPulse]=useState(false);
  useEffect(()=>{const id=setInterval(()=>{setPulse(p=>!p);},2500);return()=>clearInterval(id);},[]);

  return(
    <div style={{minHeight:"100vh",background:G.bg,paddingTop:52,paddingBottom:96,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,background:`radial-gradient(ellipse at 50% -10%,rgba(${char?char.glow:"100,30,180"},0.25) 0%,transparent 55%)`,pointerEvents:"none",zIndex:0,transition:"background 1.5s"}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 16px"}}>

        {/* Hero greeting */}
        <div style={{textAlign:"center",padding:"28px 0 20px"}}>
          <div style={{
            width:96,height:96,borderRadius:"50%",margin:"0 auto 16px",
            background:`radial-gradient(ellipse,rgba(${char?char.glow:"168,85,247"},0.2),transparent 70%)`,
            border:`2px solid rgba(${char?char.glow:"168,85,247"},0.3)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:56,lineHeight:1,overflow:"hidden",
            filter:`drop-shadow(0 0 20px rgba(${char?char.glow:"168,85,247"},0.5))`,
            transform:pulse?"scale(1.07)":"scale(1)",transition:"transform 0.5s ease",
            boxShadow:`0 0 40px rgba(${char?char.glow:"168,85,247"},0.2)`,
          }}>
            {avatarUrl
              ?<img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>{}}/>
              :<span>{avatar||"🐸"}</span>
            }
          </div>
          <div style={{color:"#4a2d68",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Welcome back</div>
          <h2 style={{color:"#fff",fontWeight:900,fontSize:26,marginBottom:10,letterSpacing:"-0.03em"}}>{username||"Degen"}</h2>

          {/* Rank badge */}
          <div style={{
            display:"inline-flex",alignItems:"center",gap:8,
            background:`linear-gradient(135deg,rgba(${char?char.glow:"168,85,247"},0.12),rgba(${char?char.glow:"168,85,247"},0.06))`,
            border:`1px solid rgba(${char?char.glow:"168,85,247"},0.3)`,
            borderRadius:24,padding:"8px 18px",
            boxShadow:`0 0 20px rgba(${char?char.glow:"168,85,247"},0.1)`,
          }}>
            <span style={{fontSize:18}}>{rank.emoji}</span>
            <span style={{color:rank.color,fontWeight:900,fontSize:14}}>{rank.name}</span>
            <span style={{
              background:"rgba(255,255,255,0.08)",borderRadius:12,
              color:"#888",fontSize:11,fontWeight:700,padding:"2px 8px",
            }}>Lv.{level}</span>
          </div>
        </div>

        {/* XP bar */}
        <div style={{...{background:G.glass,border:`1px solid ${G.border}`,borderRadius:20,padding:"16px"},marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{color:"#4a2d68",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>XP Progress</span>
            {nextRank&&<span style={{color:nextRank.color,fontSize:10,fontWeight:700}}>{nextRank.emoji} Next: {nextRank.name}</span>}
          </div>
          <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden",marginBottom:6}}>
            <div style={{height:"100%",width:`${xpProgress.pct}%`,background:`linear-gradient(90deg,${rank.color}66,${rank.color})`,borderRadius:4,transition:"width 0.8s ease",boxShadow:`0 0 12px ${rank.color}66`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{color:"#2a1540",fontSize:10}}>{fmt(xpProgress.current)} XP</span>
            <span style={{color:"#2a1540",fontSize:10}}>{fmt(xpProgress.needed)} XP needed</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
          {[
            {emoji:"💰",label:"Earned",value:fmt(totalEarned),color:G.gold},
            {emoji:"👆",label:"Total Taps",value:fmt(totalTaps),color:G.purple},
            {emoji:"⏱",label:"Next Reset",value:cd,color:G.green},
          ].map(s=>(
            <div key={s.label} style={{
              background:G.glass,border:`1px solid ${G.border}`,
              borderRadius:18,padding:"16px 10px",textAlign:"center",
              boxShadow:`inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}>
              <div style={{fontSize:24,marginBottom:6,filter:`drop-shadow(0 0 8px ${s.color}66)`}}>{s.emoji}</div>
              <div style={{color:s.color,fontWeight:900,fontSize:14,fontVariantNumeric:"tabular-nums",marginBottom:2}}>{s.value}</div>
              <div style={{color:"#2a1540",fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active character card */}
        {char?(
          <div style={{
            background:`linear-gradient(135deg,rgba(${char.glow},0.08),rgba(${char.glow},0.03))`,
            border:`1px solid rgba(${char.glow},0.25)`,
            borderRadius:20,padding:"16px",marginBottom:12,
            boxShadow:`0 0 30px rgba(${char.glow},0.08)`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{
                width:60,height:60,borderRadius:"50%",flexShrink:0,
                background:`radial-gradient(ellipse,rgba(${char.glow},0.2),rgba(6,0,15,0.8))`,
                border:`1px solid rgba(${char.glow},0.4)`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,
                boxShadow:`0 0 20px rgba(${char.glow},0.3)`,
              }}>{char.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#3a2255",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>Active Legend</div>
                <div style={{color:"#fff",fontWeight:900,fontSize:17,marginBottom:4,letterSpacing:"-0.01em"}}>{char.name}</div>
                <div style={{
                  display:"inline-flex",gap:4,alignItems:"center",
                  background:`rgba(${char.glow},0.1)`,
                  border:`1px solid rgba(${char.glow},0.2)`,
                  borderRadius:8,padding:"2px 8px",
                }}>
                  <span style={{fontSize:10}}>⚡</span>
                  <span style={{color:`rgb(${char.glow})`,fontSize:10,fontWeight:700}}>{char.ability}</span>
                </div>
              </div>
              <button onClick={onPlay} style={{
                background:`rgba(${char.glow},0.12)`,
                border:`1px solid rgba(${char.glow},0.3)`,
                borderRadius:12,color:`rgb(${char.glow})`,
                fontWeight:800,fontSize:11,padding:"9px 13px",cursor:"pointer",flexShrink:0,
              }}>Switch</button>
            </div>
          </div>
        ):(
          <div style={{background:G.glass,border:`1px solid ${G.border}`,borderRadius:20,padding:"20px",textAlign:"center",marginBottom:12}}>
            <div style={{color:"#3a2255",fontSize:13,marginBottom:10}}>No character selected</div>
            <button onClick={onPlay} style={{background:G.purpleDim,border:`1px solid rgba(168,85,247,0.35)`,borderRadius:12,color:"#a855f7",fontWeight:800,fontSize:13,padding:"10px 20px",cursor:"pointer"}}>Pick Your Legend →</button>
          </div>
        )}

        {/* Big play CTA */}
        <button onClick={onPlay} style={{
          width:"100%",
          background:"linear-gradient(135deg,#5b21b6,#7c3aed,#a855f7)",
          color:"#fff",fontWeight:900,fontSize:18,border:"none",borderRadius:20,
          padding:"20px",cursor:"pointer",letterSpacing:"-0.01em",
          boxShadow:"0 0 60px rgba(168,85,247,0.5),0 12px 40px rgba(0,0,0,0.4)",
          position:"relative",overflow:"hidden",marginBottom:16,
        }}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.12),transparent 60%)",pointerEvents:"none"}}/>
          <span style={{position:"relative",zIndex:1}}>🎮 Play Now</span>
        </button>

        {/* Who's Online strip */}
        <div style={{background:"rgba(34,214,122,0.04)",border:"1px solid rgba(34,214,122,0.1)",borderRadius:16,padding:"12px 14px",marginBottom:16}}>
          <OnlineStrip/>
        </div>

        {/* Feature grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {emoji:"🔥",title:"Combo System",desc:"Tap fast to stack up to 20× coin multiplier"},
            {emoji:"🤖",title:"Auto-Tappers",desc:"Hire helpers to earn taps while AFK"},
            {emoji:"⚡",title:"40+ Upgrades",desc:"Power up every stat in the Shop"},
            {emoji:"🏆",title:"Win USDC",desc:"Top 20 earn USDC every 48 hours"},
          ].map(f=>(
            <div key={f.title} style={{
              background:G.glass,border:`1px solid ${G.border}`,
              borderRadius:16,padding:"16px 14px",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{fontSize:26,marginBottom:8,filter:"drop-shadow(0 2px 8px rgba(168,85,247,0.3))"}}>{f.emoji}</div>
              <div style={{color:"#ddd",fontWeight:800,fontSize:13,marginBottom:4}}>{f.title}</div>
              <div style={{color:"#2a1540",fontSize:11,lineHeight:1.5}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD TAB (glass) ─────────────────────────────────────────────────
function LeaderboardTab({myPlayerId}:{myPlayerId:string}){
  const [players,setPlayers]=useState<LBEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const cd=useCountdown();
  const [view,setView]=useState<"top3"|"list">("top3");
  const CE:Record<string,string>={pepe:"🐸",gigachad:"💪",trump:"🎩",troll:"🧌",bonk:"🐕"};

  const loadRef=useRef(0);
  const load=useCallback(async()=>{
    const seq=++loadRef.current;
    try{
      const{supabase}=await import("@/lib/supabase");
      // Bypass any client-side cache by querying with a timestamp condition that's always true
      // Use raw fetch with no-cache to guarantee fresh data from Postgres
      const SUPA_URL="https://paxtohwiycuhwmlziwrr.supabase.co";
      const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheHRvaHdpeWN1aHdtbHppd3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTEzNjMsImV4cCI6MjA5NjY4NzM2M30.HtHcTkUO35c_4WTjufHRHUhAHPDuATw23bqh39D_qkQ";
      const resp=await fetch(`${SUPA_URL}/rest/v1/dt_players?select=id,wallet_address,username,character,total_score,games_played,avatar_url,last_seen&order=games_played.desc&limit=200`,{
        headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${SUPA_KEY}`,"Cache-Control":"no-cache, no-store","Pragma":"no-cache"},
        cache:"no-store",
      });
      if(!resp.ok)throw new Error(`LB fetch ${resp.status}`);
      const data=await resp.json() as LBEntry[];
      const error=null;
      if(error){console.error("LB error",error);return;}
      if(seq!==loadRef.current)return; // stale response, discard
      const seen=new Map<string,LBEntry>();
      for(const p of (data||[]) as LBEntry[]){
        const key=(p.username||"").toLowerCase();
        if(!seen.has(key)||(p.games_played>(seen.get(key)!.games_played))){ seen.set(key,p); }
      }
      setPlayers(Array.from(seen.values()).sort((a,b)=>b.games_played-a.games_played));
    }catch(e){console.error("LB fetch error",e);}
    if(seq===loadRef.current)setLoading(false);
  },[]);
  useEffect(()=>{
    load();
    const id=setInterval(load,3000);
    return()=>clearInterval(id);
  },[load]);

  const getRankForScore=(score:number)=>getRankFromLevel(getLevelFromXP(score));

  return(
    <div style={{minHeight:"100vh",background:G.bg,paddingTop:64,paddingBottom:90,overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(245,200,66,0.08) 0%,transparent 50%)",pointerEvents:"none",zIndex:0}}/>

      {/* Sticky header */}
      <div style={{position:"sticky",top:0,zIndex:10,background:"rgba(6,0,15,0.92)",borderBottom:`1px solid ${G.border}`,padding:"12px 16px",backdropFilter:G.blur}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <h2 style={{color:"#fff",fontWeight:900,fontSize:17,margin:0,letterSpacing:"-0.02em"}}>🏆 Leaderboard</h2>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#22d67a",boxShadow:"0 0 6px #22d67a",animation:"pulseDot 1.2s infinite"}}/>
              <span style={{color:"#22d67a",fontSize:9,fontWeight:700}}>LIVE</span>
              <span style={{color:"#2a1540",fontSize:9,marginLeft:4}}>Resets in</span>
              <span style={{color:"#f5c842",fontWeight:900,fontSize:12,fontVariantNumeric:"tabular-nums"}}>{cd}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{display:"flex",background:G.glass,border:`1px solid ${G.border}`,borderRadius:10,overflow:"hidden"}}>
              {([["top3","🏅 Top 3"],["list","📋 List"]] as const).map(([v,label])=>(
                <button key={v} onClick={()=>setView(v)} style={{background:view===v?G.purpleDim:"transparent",border:"none",color:view===v?"#a855f7":"#444",fontSize:11,fontWeight:700,padding:"6px 12px",cursor:"pointer"}}>{label}</button>
              ))}
            </div>
            <button onClick={load} style={{background:G.glass,border:`1px solid ${G.border}`,color:"#555",borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:12}}>↻</button>
          </div>
        </div>
        {/* Prize info */}
        <div style={{background:"rgba(245,200,66,0.05)",border:"1px solid rgba(245,200,66,0.12)",borderRadius:10,padding:"6px 10px",display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:12}}>💰</span>
          <span style={{color:"#7a6020",fontSize:10,fontWeight:700}}>Top 20 players receive USDC every 48 hours. Must have a Solana wallet set in Settings.</span>
        </div>
      </div>

      {loading?(
        <div style={{padding:64,textAlign:"center",color:"#2a1540"}}>
          <div style={{fontSize:36,marginBottom:12,animation:"pulseDot 1s infinite"}}>⏳</div>
          <div style={{fontWeight:700}}>Loading rankings...</div>
        </div>
      ):players.length===0?(
        <div style={{padding:64,textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12}}>🏆</div>
          <div style={{color:"#3a2255",fontSize:15,fontWeight:800}}>No players yet</div>
          <div style={{color:"#2a1540",fontSize:12,marginTop:4}}>Be the first to claim the top spot!</div>
        </div>
      ):view==="top3"?(
        <div style={{position:"relative",zIndex:1,padding:"20px 16px 0"}}>

          {/* Top 3 podium */}
          {players.length>=1&&(
            <div style={{display:"flex",gap:10,alignItems:"flex-end",justifyContent:"center",marginBottom:20}}>
              {/* 2nd */}
              {players[1]&&(()=>{const p=players[1];const r=getRankForScore(p.total_score||0);const lv=getLevelFromXP(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(
                  <div style={{flex:1,background:me?"rgba(168,85,247,0.08)":G.glass,border:`1px solid ${me?"rgba(168,85,247,0.3)":"rgba(180,180,180,0.1)"}`,borderRadius:20,padding:"14px 10px",textAlign:"center",maxWidth:140}}>
                    <div style={{fontSize:28,marginBottom:6,filter:"drop-shadow(0 0 8px silver)"}}>🥈</div>
                    <div style={{fontSize:28,marginBottom:6,display:"flex",justifyContent:"center"}}><AvatarDisplay emoji={CE[p.character]||"🎮"} url={p.avatar_url} size={36}/></div>
                    <div style={{color:"#ddd",fontWeight:700,fontSize:12,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>{isOnline(p.last_seen)&&<span style={{width:7,height:7,borderRadius:"50%",background:"#22d67a",flexShrink:0,boxShadow:"0 0 5px #22d67a",display:"inline-block"}}/>}{p.username||"Anon"}{me&&" 👈"}</div>
                    <div style={{background:`${r.color}18`,border:`1px solid ${r.color}30`,borderRadius:8,padding:"3px 8px",fontSize:9,color:r.color,fontWeight:700,marginBottom:6,display:"inline-block"}}>{r.emoji} Lv.{lv}</div>
                    <div style={{color:"#aaa",fontWeight:900,fontSize:13}}>👆 {fmt(p.games_played||0)}</div>
                  </div>
                );
              })()}
              {/* 1st — taller */}
              {players[0]&&(()=>{const p=players[0];const r=getRankForScore(p.total_score||0);const lv=getLevelFromXP(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(
                  <div style={{
                    flex:1,
                    background:me?"rgba(168,85,247,0.12)":"linear-gradient(145deg,rgba(245,200,66,0.08),rgba(245,200,66,0.03))",
                    border:`2px solid ${me?"rgba(168,85,247,0.5)":"rgba(245,200,66,0.35)"}`,
                    borderRadius:22,padding:"20px 12px",textAlign:"center",maxWidth:160,
                    boxShadow:`0 0 40px rgba(245,200,66,0.12)`,
                    marginBottom:14,
                  }}>
                    <div style={{fontSize:36,marginBottom:8,filter:"drop-shadow(0 0 12px gold)"}}>👑</div>
                    <div style={{fontSize:36,marginBottom:8,display:"flex",justifyContent:"center"}}><AvatarDisplay emoji={CE[p.character]||"🎮"} url={p.avatar_url} size={44}/></div>
                    <div style={{color:"#fff",fontWeight:900,fontSize:14,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>{isOnline(p.last_seen)&&<span style={{width:8,height:8,borderRadius:"50%",background:"#22d67a",flexShrink:0,boxShadow:"0 0 6px #22d67a",display:"inline-block"}}/>}{p.username||"Anon"}{me&&" 👈"}</div>
                    <div style={{background:`${r.color}20`,border:`1px solid ${r.color}40`,borderRadius:8,padding:"3px 10px",fontSize:9,color:r.color,fontWeight:800,marginBottom:8,display:"inline-block"}}>{r.emoji} Lv.{lv} {r.name}</div>
                    <div style={{color:"#f5c842",fontWeight:900,fontSize:16,filter:"drop-shadow(0 0 6px rgba(245,200,66,0.5))"}}>👆 {fmt(p.games_played||0)}</div>
                  </div>
                );
              })()}
              {/* 3rd */}
              {players[2]&&(()=>{const p=players[2];const r=getRankForScore(p.total_score||0);const lv=getLevelFromXP(p.total_score||0);const me=p.wallet_address===myPlayerId;
                return(
                  <div style={{flex:1,background:me?"rgba(168,85,247,0.08)":G.glass,border:`1px solid ${me?"rgba(168,85,247,0.3)":"rgba(205,127,50,0.15)"}`,borderRadius:20,padding:"14px 10px",textAlign:"center",maxWidth:140}}>
                    <div style={{fontSize:28,marginBottom:6,filter:"drop-shadow(0 0 8px #cd7f32)"}}>🥉</div>
                    <div style={{fontSize:28,marginBottom:6,display:"flex",justifyContent:"center"}}><AvatarDisplay emoji={CE[p.character]||"🎮"} url={p.avatar_url} size={36}/></div>
                    <div style={{color:"#ddd",fontWeight:700,fontSize:12,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>{isOnline(p.last_seen)&&<span style={{width:7,height:7,borderRadius:"50%",background:"#22d67a",flexShrink:0,boxShadow:"0 0 5px #22d67a",display:"inline-block"}}/>}{p.username||"Anon"}{me&&" 👈"}</div>
                    <div style={{background:`${r.color}18`,border:`1px solid ${r.color}30`,borderRadius:8,padding:"3px 8px",fontSize:9,color:r.color,fontWeight:700,marginBottom:6,display:"inline-block"}}>{r.emoji} Lv.{lv}</div>
                    <div style={{color:"#cd7f32",fontWeight:900,fontSize:13}}>👆 {fmt(p.games_played||0)}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Rest of list (4-20+) */}
          <div style={{background:G.glass,border:`1px solid ${G.border}`,borderRadius:20,overflow:"hidden"}}>
            {players.slice(3).map((p,i)=>{
              const r=getRankForScore(p.total_score||0);const lv=getLevelFromXP(p.total_score||0);
              const me=p.wallet_address===myPlayerId;const isPrize=i+3<20;
              return(
                <div key={p.id} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"10px 14px",
                  borderBottom:i+3===19?`1px solid rgba(34,214,122,0.3)`:`1px solid rgba(255,255,255,0.04)`,
                  background:me?"rgba(168,85,247,0.06)":isPrize?"rgba(34,214,122,0.015)":"transparent",
                }}>
                  <div style={{color:isPrize?"#22d67a":"#2a1540",fontWeight:900,fontSize:13,width:26,textAlign:"center",flexShrink:0}}>#{i+4}</div>
                  <div style={{fontSize:22,flexShrink:0,display:"flex",alignItems:"center"}}><AvatarDisplay emoji={CE[p.character]||"🎮"} url={p.avatar_url} size={28}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:me?"#c084fc":"#ddd",fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                      {isOnline(p.last_seen)&&<span style={{width:7,height:7,borderRadius:"50%",background:"#22d67a",flexShrink:0,boxShadow:"0 0 5px #22d67a",display:"inline-block"}}/>}
                      {p.username||"Anon"}{me&&" 👈"}
                      {isPrize&&<span style={{marginLeft:6,fontSize:9,color:"#22d67a",fontWeight:800}}>💰PRIZE</span>}
                    </div>
                    <div style={{color:r.color,fontSize:9,fontWeight:700}}>{r.emoji} Lv.{lv} {r.name}</div>
                  </div>
                  <div style={{color:"#f5c842",fontWeight:900,fontSize:12,flexShrink:0}}>👆 {fmt(p.games_played||0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ):(
        <div style={{position:"relative",zIndex:1,padding:"16px"}}>
          <div style={{background:G.glass,border:`1px solid ${G.border}`,borderRadius:20,overflow:"hidden"}}>
            {players.map((p,i)=>{
              const r=getRankForScore(p.total_score||0);const lv=getLevelFromXP(p.total_score||0);
              const me=p.wallet_address===myPlayerId;const isPrize=i<20;
              const medalEmoji=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
              return(
                <div key={p.id} style={{
                  display:"flex",alignItems:"center",gap:10,
                  padding:"11px 14px",
                  borderBottom:i===19?`1px solid rgba(34,214,122,0.3)`:i<players.length-1?`1px solid rgba(255,255,255,0.04)`:"none",
                  background:me?"rgba(168,85,247,0.06)":isPrize?"rgba(34,214,122,0.015)":"transparent",
                }}>
                  <div style={{width:26,textAlign:"center",flexShrink:0,fontWeight:900,fontSize:13,color:medalEmoji?undefined:isPrize?"#22d67a":"#2a1540"}}>
                    {medalEmoji||`#${i+1}`}
                  </div>
                  <div style={{flexShrink:0,display:"flex",alignItems:"center"}}><AvatarDisplay emoji={CE[p.character]||"🎮"} url={p.avatar_url} size={28}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:me?"#c084fc":"#ccc",fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                      {isOnline(p.last_seen)&&<span style={{width:7,height:7,borderRadius:"50%",background:"#22d67a",flexShrink:0,boxShadow:"0 0 5px #22d67a",display:"inline-block"}}/>}
                      {p.username||"Anon"}{me&&" 👈"}
                      {isPrize&&<span style={{marginLeft:5,fontSize:9,color:"#22d67a",fontWeight:800}}>💰</span>}
                    </div>
                    <div style={{color:r.color,fontSize:9,fontWeight:700}}>{r.emoji} Lv.{lv} {r.name}</div>
                  </div>
                  <div style={{color:"#f5c842",fontWeight:900,fontSize:12,flexShrink:0}}>👆 {fmt(p.games_played||0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  const catItems=UPGRADES.filter(u=>u.category===cat);
  const catInfo=SHOP_CATEGORIES.find(c=>c.id===cat);

  return(
    <div style={{minHeight:"100vh",background:G.bg,color:"#fff",paddingBottom:88}}>
      {/* Header */}
      <div style={{background:"rgba(6,0,15,0.92)",borderBottom:`1px solid ${G.border}`,padding:"12px 16px 0",position:"sticky",top:0,zIndex:10,backdropFilter:G.blur}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <h2 style={{fontWeight:900,fontSize:17,margin:0,letterSpacing:"-0.02em"}}>⚡ Shop</h2>
          <div style={{marginLeft:"auto",
            background:"linear-gradient(135deg,rgba(245,200,66,0.1),rgba(245,200,66,0.05))",
            border:"1px solid rgba(245,200,66,0.25)",
            borderRadius:12,padding:"6px 14px",
            display:"flex",alignItems:"center",gap:6,
          }}>
            <span style={{fontSize:16}}>💰</span>
            <span style={{fontSize:14,fontWeight:900,color:G.gold,fontVariantNumeric:"tabular-nums"}}>{fmt(coins)}</span>
          </div>
        </div>
        {/* Category pills */}
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:12,WebkitOverflowScrolling:"touch" as any}}>
          {SHOP_CATEGORIES.map(c=>{
            const active=cat===c.id;
            const count=UPGRADES.filter(u=>u.category===c.id&&(upgrades[u.id]||0)>0).length;
            return(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{
                flex:"0 0 auto",
                background:active?"rgba(168,85,247,0.18)":G.glass,
                border:`1px solid ${active?"rgba(168,85,247,0.5)":G.border}`,
                color:active?"#c084fc":"#555",
                borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",
                whiteSpace:"nowrap",
                boxShadow:active?"0 0 12px rgba(168,85,247,0.2)":"none",
                transition:"all 0.15s",
                position:"relative",
              }}>
                {c.label} {c.short}
                {count>0&&<span style={{
                  position:"absolute",top:-4,right:-4,
                  background:G.purple,color:"#fff",
                  width:14,height:14,borderRadius:"50%",
                  fontSize:8,fontWeight:900,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {!charId?(
        <div style={{padding:60,textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12}}>🛒</div>
          <div style={{color:"#3a2255",fontSize:15,fontWeight:800}}>Start a game first</div>
          <div style={{color:"#2a1540",fontSize:12,marginTop:4}}>Head to the Play tab to pick your character</div>
        </div>
      ):(
        <div style={{padding:"10px 12px"}}>
          {/* Category description */}
          {catInfo&&<div style={{color:"#3a2255",fontSize:11,padding:"4px 4px 10px"}}>{catInfo.desc}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {catItems.map(u=>{
              const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv);
              const locked=(u.minLevel||0)>playerLevel;
              const can=!locked&&coins>=cost;
              const reqRank=u.minLevel?RANK_NAMES[u.minLevel]:"";
              return(
                <button key={u.id} onClick={()=>!locked&&can&&onBuyUpgrade(u.id)} disabled={locked||!can}
                  style={{
                    background:locked?"rgba(255,255,255,0.01)":can
                      ?"linear-gradient(145deg,rgba(245,200,66,0.06),rgba(245,200,66,0.02))"
                      :G.glass,
                    border:`1px solid ${locked?"rgba(255,60,60,0.1)":can?"rgba(245,200,66,0.2)":G.border}`,
                    borderRadius:18,padding:"14px 12px",
                    cursor:can?"pointer":"not-allowed",
                    textAlign:"left",
                    opacity:locked?0.4:can?1:0.55,
                    transition:"all 0.15s",position:"relative",
                    boxShadow:can?"0 0 20px rgba(245,200,66,0.04)":"none",
                  }}>
                  {/* Level badge */}
                  {lv>0&&(
                    <div style={{position:"absolute",top:8,right:8,background:"rgba(168,85,247,0.2)",border:"1px solid rgba(168,85,247,0.35)",borderRadius:8,padding:"2px 7px",fontSize:9,color:"#a855f7",fontWeight:800}}>
                      Lv{lv}
                    </div>
                  )}
                  <div style={{fontSize:28,marginBottom:8}}>{locked?"🔒":u.emoji}</div>
                  <div style={{fontWeight:800,fontSize:12,color:"#fff",marginBottom:3,lineHeight:1.3,paddingRight:lv>0?28:0}}>{u.name}</div>
                  {u.tapsPerSec&&<div style={{fontSize:9,color:"#22d67a",fontWeight:700,marginBottom:4}}>👆 +{u.tapsPerSec}/sec auto-taps</div>}
                  <div style={{color:"#3a2255",fontSize:10,marginBottom:8,lineHeight:1.4}}>{u.desc}</div>
                  {locked?(
                    <div style={{
                      background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",
                      borderRadius:8,padding:"4px 8px",
                      color:"#ef4444",fontSize:10,fontWeight:700,
                    }}>🔒 Requires {reqRank} (Lv.{u.minLevel})</div>
                  ):(
                    <div style={{
                      background:can?"rgba(245,200,66,0.08)":"rgba(255,255,255,0.03)",
                      border:`1px solid ${can?"rgba(245,200,66,0.2)":G.border}`,
                      borderRadius:8,padding:"4px 8px",display:"inline-flex",gap:4,alignItems:"center",
                    }}>
                      <span style={{fontSize:12}}>💰</span>
                      <span style={{color:can?G.gold:"#333",fontWeight:900,fontSize:12,fontVariantNumeric:"tabular-nums"}}>{fmt(cost)}</span>
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
      <div style={{color:"#2a1540",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",padding:"4px 14px 4px"}}>⚡ Quick Upgrades</div>
      <div style={{overflowX:"auto",display:"flex",gap:7,padding:"4px 14px 10px",WebkitOverflowScrolling:"touch" as any}}>
        {UPGRADES.map(u=>{
          const lv=upgrades[u.id]||0,cost=getUpgCost(u,lv),can=coins>=cost;
          return(
            <button key={u.id} onClick={()=>can&&onBuyUpgrade(u.id)} style={{
              flex:"0 0 76px",height:84,
              background:can?"rgba(245,200,66,0.05)":G.glass,
              border:`1px solid ${can?"rgba(245,200,66,0.2)":G.border}`,
              borderRadius:14,padding:"7px 5px",
              cursor:can?"pointer":"not-allowed",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",
              opacity:can?1:0.35,position:"relative",
              transition:"all 0.1s",
            }}>
              {lv>0&&<div style={{position:"absolute",top:3,right:4,background:"rgba(168,85,247,0.7)",borderRadius:4,fontSize:7,fontWeight:900,color:"#fff",padding:"1px 4px"}}>Lv{lv}</div>}
              <div style={{fontSize:22}}>{u.emoji}</div>
              <div style={{color:"#bbb",fontSize:9,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{u.name}</div>
              <div style={{color:can?G.gold:"#2a1540",fontSize:10,fontWeight:900}}>💰{fmt(cost)}</div>
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
  const [activeTab,setActiveTab]=useState<"home"|"play"|"shop"|"ranks"|"settings">("home");
  const [screen,setScreen]=useState<"select"|"game">("select");
  const [charId,setCharId]=useState<string|null>(null);
  // DB-loaded values — source of truth for taps/coins (never overwrite with local zeros)
  const dbValuesRef=useRef<{totalEarned:number;totalTaps:number;coins:number;upgrades:Record<string,number>}|null>(null);
  const [showModal,setShowModal]=useState(false);
  const [pendingChar,setPendingChar]=useState<string|null>(null);
  const [playerId,setPlayerId]=useState("");
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

  const pidRef=useRef(0);
  const saveRef=useRef<SaveData|null>(null);
  // liveRef keeps current values in sync for use by stable doSave callback
  const liveRef=useRef({charId:"",coins:0,totalEarned:0,totalTaps:0,upgrades:{} as Record<string,number>,uid:"",username:"",solWallet:"",avatarUrl:""});
  // Debounce timer ref — fires DB write 800ms after last tap
  const dbDebounceRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  // Heartbeat — update last_seen every 30s so online presence is accurate
  useEffect(()=>{
    const uid=user?.id;
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
  },[user?.id]);

  const char=CHARACTERS.find(c=>c.id===charId);
  const level=getLevelFromXP(totalEarned);
  const xpProgress=getLevelProgress(totalEarned);
  const rank=getRankFromLevel(level);
  const nextRank=getNextRank(level);
  const autoBoostMult=1+(upgrades["auto_boost"]||0)*0.10+(upgrades["auto_boost2"]||0)*0.25+(upgrades["auto_boost3"]||0)*0.50+(upgrades["auto_boost4"]||0)*1.50+(upgrades["auto_mult"]?1:0)+(upgrades["auto_mult2"]?2:0)+(upgrades["auto_mult3"]?4:0)+(upgrades["prestige_auto"]||0)*0.20+(upgrades["prestige_auto2"]||0)*0.60+(upgrades["prestige_auto3"]||0)*1.50;
  const autoRate=UPGRADES.filter(u=>u.tapsPerSec).reduce((sum,u)=>{
    const lvl=upgrades[u.id]||0;
    return sum+lvl*(u.tapsPerSec!)*autoBoostMult;
  },0);
  // Keep liveRef in sync so stable doSave always reads fresh values
  liveRef.current={charId:charId||"",coins,totalEarned,totalTaps,upgrades,uid:user?.id||playerId,username,solWallet,avatarUrl};

  useEffect(()=>{
    if(!user?.id)return;
    const authId=user.id;
    setPlayerId(authId);
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
        const resp=await fetch(`${SUPA_URL}/rest/v1/dt_players?wallet_address=eq.${encodeURIComponent(authId)}&limit=1`,{
          headers:{"apikey":SUPA_KEY,"Authorization":`Bearer ${authToken}`,"Cache-Control":"no-cache, no-store","Pragma":"no-cache"},
          cache:"no-store",
        });
        if(resp.ok){
          const arr=await resp.json() as Record<string,unknown>[];
          const existing=arr[0];
          if(existing){
            if(existing.username){setUsername(existing.username as string);setPlayerName(existing.username as string,authId);}
            if(existing.sol_wallet){setSolWallet(existing.sol_wallet as string);setPlayerWallet(existing.sol_wallet as string,authId);}
            const savedAv=getAvatar(authId);
            if(savedAv){setAvatar(savedAv);}
            if(existing.avatar_url){setAvatarUrl(existing.avatar_url as string);}
            const dbTaps=Number(existing.games_played)||0;
            const dbEarned=Number(existing.total_score)||0;
            const dbCoins=Number(existing.token_balance)||0;
            const dbUpgrades=(existing.upgrades as Record<string,number>)||{};
            dbValuesRef.current={totalEarned:dbEarned,totalTaps:dbTaps,coins:dbCoins,upgrades:dbUpgrades};
            // Auto-push local state if it's higher than DB (catches tabs/sessions that weren't synced)
            const globalLocal=getGlobalTaps(authId);
            const localTaps=globalLocal.totalTaps||0;
            const localEarned=globalLocal.totalEarned||0;
            if(localTaps>dbTaps||localEarned>dbEarned){
              const pushedTaps=Math.max(localTaps,dbTaps);
              const pushedEarned=Math.max(localEarned,dbEarned);
              const uname=existing.username as string||getPlayerName(authId);
              const charId=existing.character as string||"pepe";
              // Load character-specific coins too
              const saves=Object.keys(localStorage).filter(k=>k.startsWith(`degen_save_${authId}_`));
              let bestCoins=dbCoins;
              for(const sk of saves){
                try{const sv=JSON.parse(localStorage.getItem(sk)||"{}");if((sv.coins||0)>bestCoins)bestCoins=sv.coins;}catch{}
              }
              const pushedCoins=Math.max(bestCoins,dbCoins);
              syncDB(authId,uname,charId,pushedEarned,pushedTaps,pushedCoins,dbUpgrades,existing.sol_wallet as string||undefined,existing.avatar_url as string||undefined);
              dbValuesRef.current={totalEarned:pushedEarned,totalTaps:pushedTaps,coins:pushedCoins,upgrades:dbUpgrades};
            }
          } else {
            // Try to migrate old p_xxx localStorage player ID to this auth account
            let migrated=false;
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
          }
        }
      }catch(e){console.error("DB load error",e);}
      finally{clearTimeout(dbTimeout);setDbLoaded(true);}
    })();
    // On page focus, re-fetch DB to catch any cloud updates (e.g. playing on another device)
    const onFocus=()=>{
      if(!user?.id)return;
      const SUPA_URL="https://paxtohwiycuhwmlziwrr.supabase.co";
      const SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheHRvaHdpeWN1aHdtbHppd3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTEzNjMsImV4cCI6MjA5NjY4NzM2M30.HtHcTkUO35c_4WTjufHRHUhAHPDuATw23bqh39D_qkQ";
      fetch(`${SUPA_URL}/rest/v1/dt_players?select=games_played,total_score,token_balance,upgrades&wallet_address=eq.${encodeURIComponent(user.id)}&limit=1`,{
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
  },[user?.id]);

  function tryStart(id:string){
    const uid=user?.id||playerId;
    if(!username&&!getPlayerName(uid)){setPendingChar(id);setShowModal(true);}
    else startGame(id,username||getPlayerName(uid),solWallet||getPlayerWallet(uid));
  }
  function onUsername(name:string,wallet:string){
    const uid=user?.id||playerId;
    setPlayerName(name,uid);setUsername(name);
    setPlayerWallet(wallet,uid);setSolWallet(wallet);
    setShowModal(false);
    if(pendingChar)startGame(pendingChar,name,wallet);
  }
  function startGame(id:string,name:string,wallet?:string){
    const uid=user?.id||playerId;
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
    const s:SaveData={charId:d.charId,coins:d.coins,totalEarned:d.totalEarned,totalTaps:d.totalTaps,upgrades:d.upgrades,highScore:Math.max(d.coins,saveRef.current?.highScore||0)};
    persistSave(d.uid,s);saveRef.current=s;
    setGlobalTaps(d.uid,d.totalTaps,d.totalEarned);
    dbValuesRef.current={totalTaps:d.totalTaps,totalEarned:d.totalEarned,coins:d.coins,upgrades:d.upgrades};
    syncDB(d.uid,d.username||getPlayerName(d.uid),d.charId,d.totalEarned,d.totalTaps,d.coins,d.upgrades,d.solWallet||getPlayerWallet(d.uid)||undefined,d.avatarUrl||undefined);
  },[]);// eslint-disable-line react-hooks/exhaustive-deps

  // Save every 5s during play; save immediately on exit (cleanup)
  useEffect(()=>{
    if(screen!=="game"||!charId)return;
    const id=setInterval(doSave,5000);
    return()=>{clearInterval(id);doSave();};// save on screen/char change
  },[screen,charId]);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const rate=autoRate*(specialActive&&char.id==="trump"?5:1);
    if(rate<=0)return;
    const id=setInterval(()=>{const pt=rate/20;setCoins(c=>c+pt);setTotalEarned(t=>t+pt);setTotalTaps(t=>t+pt);},50);
    return()=>clearInterval(id);
  },[autoRate,activeTab,screen,char,specialActive]);

  useEffect(()=>{
    if(activeTab!=="play"||screen!=="game"||!char)return;
    const regenBonus=(upgrades["energy_reg"]||0)*0.5+(upgrades["energy_reg2"]||0)*1+(upgrades["energy_reg3"]||0)*2;
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
    e.preventDefault();
    let tx=window.innerWidth/2,ty=window.innerHeight/2;
    if("touches" in e&&e.touches.length>0){tx=e.touches[0].clientX;ty=e.touches[0].clientY;}
    else if("clientX" in e){tx=(e as React.MouseEvent).clientX;ty=(e as React.MouseEvent).clientY;}
    if(energy<=0)return;

    const tapPow=(upgrades["tap_power"]||0)*1+(upgrades["tap_pow2"]||0)*3+(upgrades["tap_pow3"]||0)*8+(upgrades["tap_pow4"]||0)*20+(upgrades["tap_pow5"]||0)*60+(upgrades["tap_pow6"]||0)*200+(upgrades["tap_pow7"]||0)*600+(upgrades["tap_pow8"]||0)*2000+(upgrades["tap_pow9"]||0)*8000;
    const chainBonus=1+(upgrades["tap_chain"]||0)*1+(upgrades["tap_chain2"]||0)*2+(upgrades["tap_chain3"]||0)*5;
    const multiTap=(1+(upgrades["multi_tap"]||0)*1+(upgrades["multi_tap2"]||0)*0.5+(upgrades["multi_tap3"]||0)*1+(upgrades["multi_tap4"]||0)*2+(upgrades["multi_tap5"]||0)*3+(upgrades["multi_tap6"]||0)*5+(upgrades["multi_tap7"]||0)*10)*chainBonus;
    const critChance=Math.min(0.95,((upgrades["crit_chance"]||0)+(upgrades["crit_chan2"]||0)+(upgrades["crit_chan3"]||0)+(upgrades["crit_chan4"]||0)+(upgrades["crit_chan5"]||0))*0.1);
    const critMult=(upgrades["crit_pow5"]?100:upgrades["crit_pow4"]?50:upgrades["crit_pow3"]?25:upgrades["crit_pow2"]?15:upgrades["crit_pow"]?8:5)*(1+(upgrades["crit_aura"]||0)*0.25+(upgrades["crit_aura2"]||0)*0.75);
    // Coin aura from multiple upgrade categories stacked
    const degenMult=1+(upgrades["degen_lore"]||0)*0.05+(upgrades["degen_lore2"]||0)*0.15+(upgrades["degen_lore3"]||0)*0.35+(upgrades["degen_lore4"]||0)*0.80+(upgrades["degen_lore5"]||0)*2.0+(upgrades["ngmi_tax"]||0)*0.10+(upgrades["wagmi_boost"]||0)*0.20+(upgrades["ape_in"]||0)*0.15+(upgrades["ape_in2"]||0)*0.40+(upgrades["diamond_hands"]||0)*0.25+(upgrades["diamond_hands2"]||0)*0.60+(upgrades["hype_train"]||0)*0.30+(upgrades["degen_grind"]||0)*0.20+(upgrades["degen_grind2"]||0)*0.50+(upgrades["alpha_call"]||0)*0.25+(upgrades["alpha_call2"]||0)*0.75+(upgrades["nft_flex"]||0)*0.20+(upgrades["whitelist"]||0)*0.15;
    const memeMult=1+(upgrades["meme_1"]||0)*0.10+(upgrades["meme_2"]||0)*0.12+(upgrades["meme_3"]||0)*0.15+(upgrades["meme_4"]||0)*0.18+(upgrades["meme_5"]||0)*0.12+(upgrades["meme_6"]||0)*0.20+(upgrades["meme_7"]||0)*0.30+(upgrades["meme_8"]||0)*0.50+(upgrades["meme_combo"]||0)*0.25+(upgrades["meme_legend"]||0)*1.0+(upgrades["viral_tap"]||0)*0.20+(upgrades["viral_tap2"]||0)*0.50+(upgrades["rug_pull"]||0)*0.15+(upgrades["pump_it"]||0)*0.35+(upgrades["to_da_moon"]||0)*0.60;
    const towerMult=1+(upgrades["tower_1"]||0)*0.05+(upgrades["tower_2"]||0)*0.12+(upgrades["tower_3"]||0)*0.25+(upgrades["tower_4"]||0)*0.50+(upgrades["tower_5"]||0)*1.0+(upgrades["tower_6"]||0)*2.0+(upgrades["tower_7"]||0)*5.0+(upgrades["tower_8"]||0)*15.0+(upgrades["tower_guard"]||0)*0.08+(upgrades["tower_lord"]||0)*0.50;
    const prestigeMult=1+(upgrades["prestige_tap"]||0)*0.20+(upgrades["prestige_tap2"]||0)*0.50+(upgrades["prestige_tap3"]||0)*1.0+(upgrades["prestige_all"]||0)*0.25+(upgrades["prestige_all2"]||0)*0.75+(upgrades["prestige_all3"]||0)*2.0+(upgrades["prestige_all4"]||0)*5.0;
    const galaxyMult=(upgrades["galaxy_3"]?5:upgrades["galaxy_2"]?3:upgrades["galaxy_1"]?2:1)*(1+(upgrades["big_bang"]||0)*0.5+(upgrades["dark_energy"]||0)*1.0+(upgrades["galaxy_forge"]?10:0));
    const coinAura=(1+((upgrades["coin_aura"]||0)*0.5)+((upgrades["coin_aura2"]||0)*1.0)+((upgrades["coin_aura3"]||0)*2.5)+((upgrades["coin_aura4"]||0)*10.0)+(upgrades["lucky_str2"]||0)*0.10+(upgrades["lucky_str3"]||0)*0.15+(upgrades["lucky_str4"]||0)*0.25+(upgrades["double_coins"]||0)*0.25+(upgrades["triple_coins"]||0)*0.10+(upgrades["rainbow_tap"]||0)*0.20+(upgrades["moon_shot"]||0)*0.10)*degenMult*memeMult*towerMult*prestigeMult*galaxyMult;
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
      // Fast DB write — debounced 400ms after last tap; leaderboard polls every 3s
      if(dbDebounceRef.current)clearTimeout(dbDebounceRef.current);
      dbDebounceRef.current=setTimeout(()=>{
        const d=liveRef.current;
        if(d.charId&&d.uid){
          dbValuesRef.current={totalTaps:d.totalTaps,totalEarned:d.totalEarned,coins:d.coins,upgrades:d.upgrades};
          syncDB(d.uid,d.username||getPlayerName(d.uid),d.charId,d.totalEarned,d.totalTaps,d.coins,d.upgrades,d.solWallet||getPlayerWallet(d.uid)||undefined,d.avatarUrl||undefined);
        }
      },400);
    },0);
    const ec=specialActive&&char.id==="bonk"?0:1;
    setEnergy(e=>Math.max(0,e-ec));
    const cspeed=1+(upgrades["combo_speed"]||0)*0.2+(upgrades["combo_spd2"]||0)*0.5+(upgrades["combo_spd3"]||0)*1+(upgrades["combo_spd4"]||0)*2+(upgrades["combo_spd5"]||0)*5;
    const gcBonus=char.id==="gigachad"?2:1;
    const maxCombo=char.comboMax+(upgrades["combo_max"]||0)*5+(upgrades["combo_max2"]||0)*15+(upgrades["combo_max3"]||0)*30+(upgrades["combo_max4"]||0)*60+(upgrades["combo_max5"]||0)*120+(upgrades["combo_max6"]||0)*300;
    setCombo(c=>Math.min(maxCombo,c+0.3*cspeed*gcBonus));
    setComboTimer(0.8);
    const spCharge=2+(upgrades["special_cd"]||0)*1+(upgrades["special_cd2"]||0)*2+(upgrades["special_cd3"]||0)*4+(upgrades["special_cd4"]||0)*8+(upgrades["special_cd5"]||0)*16+(upgrades["special_cd6"]||0)*40;
    setSpecialCharge(s=>Math.min(100,s+spCharge));
    setCharPulse(true);setTimeout(()=>setCharPulse(false),90);
    if(earned>tapBase*5){setShaking(true);setTimeout(()=>setShaking(false),180);}
  },[char,energy,combo,tapCount,upgrades,specialActive,checkAchievements,spawn]);

  const launchSpecial=useCallback(()=>{
    if(!char||specialCharge<100||specialActive)return;
    setSpecialActive(true);setSpecialCharge(0);setSpecialTimer(char.specialDuration);
    if(char.id==="gigachad")setCombo(char.comboMax);
    for(let i=0;i<14;i++)setTimeout(()=>spawn(window.innerWidth/2+(Math.random()-0.5)*300,window.innerHeight/2+(Math.random()-0.5)*260,["💥","⚡","🔥","✨","💫","🚀","💎","🌙","🎯","👑","🌟","🎆"][Math.floor(Math.random()*12)],char.color,true),i*50);
  },[char,specialCharge,specialActive,spawn]);

  const buyUpgrade=useCallback((id:string)=>{
    const u=UPGRADES.find(u=>u.id===id)!;
    const lv=upgrades[id]||0,cost=getUpgCost(u,lv);
    if(coins<cost)return;
    setCoins(c=>c-cost);
    setUpgrades(u=>({...u,[id]:(u[id]||0)+1}));
    if(id==="energy_max"||id==="energy_max2"||id==="energy_max3"||id==="energy_max4"||id==="energy_max5"||id==="energy_max6"){
      const nu={...upgrades,[id]:(upgrades[id]||0)+1};
      setMaxEnergy(1000+(nu["energy_max"]||0)*200+(nu["energy_max2"]||0)*500+(nu["energy_max3"]||0)*1000+(nu["energy_max4"]||0)*2000+(nu["energy_max5"]||0)*5000+(nu["energy_max6"]||0)*15000);
    }
    showToast(`${u.emoji} ${u.name} Lv.${lv+1}!`);
  },[coins,upgrades]);

  void comboTimer;

  function handleSettingsSave(u:string,w:string,av:string,url?:string){
    const uid=user?.id||playerId;
    setUsername(u);setPlayerName(u,uid);
    setSolWallet(w);setPlayerWallet(w,uid);
    setAvatar(av);setAvatarStore(av,uid);
    if(url!==undefined)setAvatarUrl(url);
    syncDB(uid,u,charId||"pepe",totalEarned,totalTaps,coins,upgrades,w||undefined,url||avatarUrl||undefined);
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return(
    <div style={{background:G.bg,minHeight:"100vh",position:"relative"}}>
      <TopBar username={username} avatar={avatar} avatarUrl={avatarUrl} onSettings={()=>setActiveTab("settings")} onLogout={signOut}/>
      {showModal&&<UsernameModal onConfirm={onUsername}/>}

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

      {/* Tab content */}
      {activeTab==="home"&&<HomeTab onPlay={()=>setActiveTab("play")} username={username} avatar={avatar} avatarUrl={avatarUrl} totalEarned={totalEarned} totalTaps={totalTaps} level={level} rank={rank} xpProgress={xpProgress} nextRank={nextRank} charId={charId}/>}
      {activeTab==="ranks"&&<LeaderboardTab myPlayerId={playerId} key="lb"/>}
      {activeTab==="shop"&&<ShopTab coins={coins} charId={charId} upgrades={upgrades} onBuyUpgrade={buyUpgrade} playerLevel={level}/>}
      {activeTab==="settings"&&<SettingsTab username={username} solWallet={solWallet} currentAvatarUrl={avatarUrl} onSave={handleSettingsSave}/>}

      {activeTab==="play"&&(
        <>
          {/* ── CHARACTER SELECT ── */}
          {screen==="select"&&(
            <div style={{minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column",alignItems:"center",padding:"52px 16px 100px",position:"relative",overflowY:"auto"}}>
              <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 30%,rgba(100,30,180,0.2) 0%,transparent 65%)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"28px 0 24px"}}>
                <img src="/logo.png" alt="Degen Clicker" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
                  style={{width:100,height:100,objectFit:"contain",marginBottom:8,filter:"drop-shadow(0 0 30px rgba(168,85,247,0.7))"}}/>
                <h2 style={{color:"#fff",fontWeight:900,fontSize:20,margin:"0 0 4px",letterSpacing:"-0.02em"}}>Choose Your Legend</h2>
                <p style={{color:"#3a2255",fontSize:12,margin:0}}>Each legend has unique abilities and passives</p>
              </div>
              {!dbLoaded&&<div style={{color:"#f5c842",fontSize:13,fontWeight:700,marginBottom:8,letterSpacing:"0.05em"}}>Loading your account…</div>}
              <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",maxWidth:480,position:"relative",zIndex:1}}>
                {CHARACTERS.map(c=>{
                  const s=loadSave(user?.id||playerId,c.id);
                  return(
                    <button key={c.id} onClick={()=>dbLoaded&&tryStart(c.id)} disabled={!dbLoaded}
                      style={{
                        width:130,
                        background:`linear-gradient(145deg,rgba(${c.glow},0.06),rgba(${c.glow},0.02))`,
                        border:`1.5px solid rgba(${c.glow},0.2)`,
                        borderRadius:22,cursor:"pointer",padding:"20px 10px 16px",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                        transition:"all 0.2s",
                        boxShadow:`0 4px 20px rgba(0,0,0,0.3)`,
                      }}
                      onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor=`rgba(${c.glow},0.8)`;el.style.background=`linear-gradient(145deg,rgba(${c.glow},0.14),rgba(${c.glow},0.06))`;el.style.transform="translateY(-6px)";el.style.boxShadow=`0 16px 40px rgba(${c.glow},0.3)`;}}
                      onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor=`rgba(${c.glow},0.2)`;el.style.background=`linear-gradient(145deg,rgba(${c.glow},0.06),rgba(${c.glow},0.02))`;el.style.transform="";el.style.boxShadow="0 4px 20px rgba(0,0,0,0.3)";}}>
                      <div style={{fontSize:52,filter:`drop-shadow(0 0 16px rgba(${c.glow},0.6))`}}>{c.emoji}</div>
                      <div style={{color:"#fff",fontWeight:900,fontSize:14,letterSpacing:"-0.01em"}}>{c.name}</div>
                      <div style={{
                        background:`rgba(${c.glow},0.12)`,border:`1px solid rgba(${c.glow},0.3)`,
                        borderRadius:8,padding:"3px 9px",fontSize:9,color:`rgb(${c.glow})`,
                        fontWeight:700,textAlign:"center",lineHeight:1.3,
                      }}>{c.ability}</div>
                      <div style={{fontSize:9,color:"#2a1540",lineHeight:1.4,textAlign:"center"}}>{c.abilityDesc}</div>
                      {s.totalEarned>0&&(
                        <div style={{fontSize:9,color:"#3a2255",background:G.glass,borderRadius:6,padding:"2px 6px"}}>💰 {fmt(s.totalEarned)} saved</div>
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
              minHeight:"100vh",background:G.bg,
              display:"flex",flexDirection:"column",alignItems:"center",
              paddingBottom:88,position:"relative",overflow:"hidden",
              userSelect:"none",WebkitUserSelect:"none",
            }} className={shaking?"shake":""}>
              <div style={{position:"fixed",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse at 50% 40%,rgba(${char.glow},${specialActive?0.3:0.12}) 0%,transparent 60%)`,transition:"background 0.6s"}}/>

              {/* Top stats bar */}
              <div style={{width:"100%",maxWidth:480,padding:"58px 16px 6px",zIndex:10,position:"relative"}}>
                {/* Coins + rank row */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <button onClick={()=>setScreen("select")} style={{background:G.glass,border:`1px solid ${G.border}`,color:"#555",borderRadius:10,padding:"6px 10px",cursor:"pointer",fontSize:12}}>⬅ Back</button>

                  {/* Big coin display */}
                  <div style={{
                    background:"linear-gradient(135deg,rgba(245,200,66,0.1),rgba(245,200,66,0.05))",
                    border:"1px solid rgba(245,200,66,0.25)",
                    borderRadius:16,padding:"6px 16px",
                    textAlign:"center",
                  }}>
                    <div style={{fontSize:20,fontWeight:900,color:G.gold,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.02em"}}>💰 {fmt(coins)}</div>
                    <div style={{fontSize:8,color:"#3a2255",textTransform:"uppercase",letterSpacing:"0.08em"}}>$DEGEN</div>
                  </div>

                  {/* Rank */}
                  <div style={{textAlign:"right"}}>
                    <div style={{color:rank.color,fontWeight:800,fontSize:12,marginBottom:1}}>{rank.emoji} {rank.name}</div>
                    <div style={{color:"#2a1540",fontSize:9}}>Level {level}</div>
                  </div>
                </div>

                {/* XP bar */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:8,color:"#2a1540",fontWeight:700,flexShrink:0}}>Lv.{level}</span>
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
                  ].map(s=>(
                    <div key={s.label} style={{flex:1,background:G.glass,border:`1px solid ${G.border}`,borderRadius:8,padding:"4px 6px",textAlign:"center"}}>
                      <div style={{color:"#2a1540",fontSize:6,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:1}}>{s.label}</div>
                      <div style={{color:"#ccc",fontWeight:800,fontSize:10}}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

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

              {/* Character */}
              <div style={{position:"relative",zIndex:10,width:"100%",maxWidth:280,height:270,margin:"0 auto 8px"}}>
                <ModelStage char={char} specialActive={specialActive} charPulse={charPulse} onTap={handleTap} firstPlay={totalTaps<3}/>
              </div>

              {/* Energy bar */}
              <div style={{width:"100%",maxWidth:300,padding:"0 0 5px",position:"relative",zIndex:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:8,color:"#2a1540",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>⚡ Energy</span>
                  <span style={{fontSize:8,color:"#2a1540"}}>{Math.floor(energy)}/{maxEnergy}</span>
                </div>
                <div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden",border:`1px solid ${G.border}`}}>
                  <div style={{
                    height:"100%",borderRadius:3,width:`${(energy/maxEnergy)*100}%`,
                    background:(energy/maxEnergy)>0.5
                      ?`linear-gradient(90deg,rgba(${char.glow},0.7),rgb(${char.glow}))`
                      :(energy/maxEnergy)>0.2
                        ?"linear-gradient(90deg,#cc8800,#ffaa00)"
                        :"linear-gradient(90deg,#aa2233,#ff4455)",
                    transition:"width 0.15s",
                    boxShadow:`0 0 8px rgba(${char.glow},0.4)`,
                  }}/>
                </div>
              </div>

              {/* Special charge */}
              <div style={{width:"100%",maxWidth:300,padding:"0 0 6px",position:"relative",zIndex:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:8,color:"#2a1540",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>✨ {char.specialName}</span>
                  <span style={{fontSize:8,color:specialCharge>=100?`rgb(${char.glow})`:"#2a1540"}}>{Math.floor(specialCharge)}%</span>
                </div>
                <div onClick={launchSpecial} style={{height:7,background:"rgba(255,255,255,0.04)",borderRadius:4,overflow:"hidden",cursor:specialCharge>=100&&!specialActive?"pointer":"default",border:specialCharge>=100&&!specialActive?`1px solid rgba(${char.glow},0.5)`:`1px solid ${G.border}`}}>
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

      <BottomBar active={activeTab} onTab={t=>setActiveTab(t as any)}/>

      <style>{`
        @keyframes floatUp { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,calc(-50% - 110px)) scale(0.5)} }
        @keyframes slideDown { 0%{opacity:0;transform:translateX(-50%) translateY(-14px)} 100%{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes pulseBanner { 0%,100%{opacity:1} 50%{opacity:0.75} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.8)} }
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
