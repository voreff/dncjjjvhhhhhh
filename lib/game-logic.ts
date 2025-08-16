import type { User } from "@/types"

// Update auto bot cost to 10000 UC and add rank system
export const GAME_CONFIG = {
  REFERRAL_BONUS: 15,
  BASE_EARNINGS: 0.001,
  WELCOME_BONUS: 10,
  JACKPOT_COOLDOWN: 3600000, // 1 hour
  TAP_BOT_COST: 10000, // Changed from 1000 to 10000
  TAP_BOT_INTERVAL: 1000, // 1 tap per second for auto-bot
  ENERGY_REGEN_RATE: 2000, // 1 energy per 2 seconds (slower recharge)
  COMBO_THRESHOLD: 10,
  CRITICAL_CHANCE: 0.02, // Reduced from 0.05 to 0.02
  JACKPOT_CHANCE: 0.0005, // Reduced from 0.001 to 0.0005
  MAX_LEVEL: 50,
  XP_PER_LEVEL: 100,
}

export const gameLogic = {
  calculateTapEarnings(user: User): { earned: number; type: "normal" | "critical" | "jackpot" } {
    let earned = GAME_CONFIG.BASE_EARNINGS * user.multiTapValue
    let type: "normal" | "critical" | "jackpot" = "normal"

    // Critical hit chance
    if (Math.random() < GAME_CONFIG.CRITICAL_CHANCE) {
      earned *= 2 // Reduced from 3x to 2x
      type = "critical"
    }

    // Jackpot chance
    const now = Date.now()
    if (Math.random() < GAME_CONFIG.JACKPOT_CHANCE && now - user.lastJackpotTime > GAME_CONFIG.JACKPOT_COOLDOWN) {
      const jackpotBonus = 10 + Math.random() * 90 // Reduced jackpot bonus
      earned += jackpotBonus
      type = "jackpot"
    }

    return { earned, type }
  },

  calculateLevel(xp: number): { level: number; currentXP: number; xpForNext: number } {
    let level = 1
    let remainingXP = xp

    while (remainingXP >= this.getXpForLevel(level)) {
      remainingXP -= this.getXpForLevel(level)
      level++
    }

    return {
      level,
      currentXP: remainingXP,
      xpForNext: this.getXpForLevel(level),
    }
  },

  getXpForLevel(level: number): number {
    return 100 * level
  },

  // Add rank calculation based on total earned
  calculateRank(totalEarned: number): { rank: number; title: string; nextRankAt: number; icon: string } {
    const ranks = [
      { threshold: 0, title: "Rookie Miner", icon: "🥉" },
      { threshold: 1000, title: "Bronze Miner", icon: "🥉" },
      { threshold: 5000, title: "Silver Miner", icon: "🥈" },
      { threshold: 15000, title: "Gold Miner", icon: "🥇" },
      { threshold: 50000, title: "Platinum Miner", icon: "💎" },
      { threshold: 150000, title: "Diamond Miner", icon: "💎" },
      { threshold: 500000, title: "Master Miner", icon: "👑" },
      { threshold: 1500000, title: "Grandmaster Miner", icon: "👑" },
      { threshold: 5000000, title: "Legend Miner", icon: "🏆" },
      { threshold: 15000000, title: "Mythical Miner", icon: "⭐" },
      { threshold: 50000000, title: "Ultimate Miner", icon: "🌟" },
    ]

    let currentRank = 1
    let currentTitle = ranks[0].title
    let currentIcon = ranks[0].icon
    let nextRankAt = ranks[1]?.threshold || 0

    for (let i = 0; i < ranks.length; i++) {
      if (totalEarned >= ranks[i].threshold) {
        currentRank = i + 1
        currentTitle = ranks[i].title
        currentIcon = ranks[i].icon
        nextRankAt = ranks[i + 1]?.threshold || ranks[i].threshold
      } else {
        break
      }
    }

    return {
      rank: currentRank,
      title: currentTitle,
      nextRankAt,
      icon: currentIcon,
    }
  },

  getBoostCost(boostType: "energy" | "multiTap" | "recharge", currentLevel: number): number {
    const costs = {
      energy: [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000],
      multiTap: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      recharge: [150, 300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 76800],
    }

    const costArray = costs[boostType]
    const index = Math.min(currentLevel - 1, costArray.length - 1)

    if (index < costArray.length) {
      return costArray[index]
    } else {
      return costArray[costArray.length - 1] * Math.pow(2, currentLevel - costArray.length)
    }
  },

  formatNumber(num: number | undefined | null): string {
    const safeNum = typeof num === "number" ? num : 0

    if (safeNum >= 1000000) {
      return (safeNum / 1000000).toFixed(1) + "M"
    } else if (safeNum >= 1000) {
      return (safeNum / 1000).toFixed(1) + "K"
    }
    return safeNum.toFixed(3)
  },

  updateComboAndStreak(user: User, now: number): { combo: number; streak: number } {
    // Combo and streak removed as requested
    return { combo: 0, streak: 0 }
  },
}
