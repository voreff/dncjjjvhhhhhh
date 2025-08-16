"use client"

import type { User } from "@/types"
import { gameLogic } from "@/lib/game-logic"
import { ArrowUp, Zap, Hand, Battery, Bot } from "lucide-react"

interface BoostSectionProps {
  user: User
  onUpgrade: (boostType: "energy" | "multiTap" | "recharge") => Promise<any>
  onToggleAutoTap: () => Promise<any>
  onOpenRank: () => void
}

export const BoostSection = ({ user, onUpgrade, onToggleAutoTap, onOpenRank }: BoostSectionProps) => {
  const energyCost = gameLogic.getBoostCost("energy", user.boosts.energyLevel)
  const multiTapCost = gameLogic.getBoostCost("multiTap", user.boosts.multiTapLevel)
  const rechargeCost = gameLogic.getBoostCost("recharge", user.boosts.rechargeLevel)
  const { rank, icon } = gameLogic.calculateRank(user.totalEarned)

  const boosts = [
    {
      id: "energy",
      title: "Energy Capacity",
      description: "Increase your maximum energy limit",
      icon: <Zap className="w-6 h-6" />,
      level: user.boosts.energyLevel,
      current: user.energyLimit,
      next: user.energyLimit + 500,
      cost: energyCost,
      onUpgrade: () => onUpgrade("energy"),
    },
    {
      id: "multiTap",
      title: "Multi-Tap",
      description: "Earn more UC per tap",
      icon: <Hand className="w-6 h-6" />,
      level: user.boosts.multiTapLevel,
      current: `${user.multiTapValue}x`,
      next: `${user.multiTapValue + 1}x`,
      cost: multiTapCost,
      onUpgrade: () => onUpgrade("multiTap"),
    },
    {
      id: "recharge",
      title: "Recharge Speed",
      description: "Faster energy regeneration",
      icon: <Battery className="w-6 h-6" />,
      level: user.boosts.rechargeLevel,
      current: `${user.rechargingSpeed}x`,
      next: `${user.rechargingSpeed + 1}x`,
      cost: rechargeCost,
      onUpgrade: () => onUpgrade("recharge"),
    },
  ]

  return (
    <div className="pb-4">
      {/* Section Header with Rank */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-black/30 backdrop-blur-md border border-green-500/30 rounded-xl p-2 sm:p-3 flex-1 shadow-lg shadow-green-500/10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-lg sm:text-xl shadow-lg">
              🚀
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-display">Boost Power</h2>
              <p className="text-gray-400 text-xs">Upgrade capabilities</p>
            </div>
          </div>
        </div>

        {/* Rank Icon */}
        <button
          onClick={onOpenRank}
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-lg p-1.5 sm:p-2 hover:border-yellow-500/60 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-yellow-500/30"
        >
          <div className="text-center">
            <div className="text-sm sm:text-lg mb-0.5 animate-bounce">{icon}</div>
            <div className="text-xs text-yellow-400 font-bold">#{rank}</div>
          </div>
        </button>
      </div>

      {/* Boost Cards */}
      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        {boosts.map((boost) => (
          <div
            key={boost.id}
            className="bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-xl p-2 sm:p-3 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-base sm:text-lg shadow-lg">
                {boost.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xs sm:text-sm font-bold text-white font-display">{boost.title}</h3>
                <p className="text-xs text-gray-400">{boost.description}</p>
              </div>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Lv.{boost.level}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-3 p-1.5 sm:p-2 bg-black/20 rounded-lg border border-gray-700/20">
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">Current</p>
                <p className="text-xs sm:text-sm font-bold text-white">{boost.current}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">Next Level</p>
                <p className="text-xs sm:text-sm font-bold text-green-400">{boost.next}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">Cost</p>
                <p className="text-xs sm:text-sm font-bold text-orange-400">{gameLogic.formatNumber(boost.cost)}</p>
              </div>
            </div>

            <button
              onClick={boost.onUpgrade}
              disabled={user.balance < boost.cost}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
              Upgrade {boost.title}
            </button>
          </div>
        ))}
      </div>

      {/* Auto Tap Bot */}
      <div className="bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-xl p-2 sm:p-3 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-base sm:text-lg shadow-lg">
            <Bot className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-white font-display">Auto Tap Bot</h3>
            <p className="text-xs text-gray-400">Automatic tapping</p>
          </div>
          <div
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border ${
              user.tapBotPurchased
                ? user.tapBotActive
                  ? "bg-green-500/20 border-green-500/30"
                  : "bg-gray-500/20 border-gray-500/30"
                : "bg-gray-500/20 border-gray-500/30"
            }`}
          >
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                user.tapBotPurchased ? (user.tapBotActive ? "text-green-400" : "text-gray-400") : "text-gray-400"
              }`}
            >
              {user.tapBotPurchased ? (user.tapBotActive ? "Active" : "Inactive") : "Not Purchased"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-3 p-1.5 sm:p-2 bg-black/20 rounded-lg border border-gray-700/20">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">Rate</p>
            <p className="text-xs sm:text-sm font-bold text-white">1/sec</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">Duration</p>
            <p className="text-xs sm:text-sm font-bold text-green-400">24/7</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">Cost</p>
            <p className="text-xs sm:text-sm font-bold text-orange-400">
              {user.tapBotPurchased ? "Free" : gameLogic.formatNumber(10000)}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleAutoTap}
          disabled={!user.tapBotPurchased && user.balance < 10000}
          className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
        >
          <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
          {user.tapBotPurchased ? (user.tapBotActive ? "Deactivate Bot" : "Activate Bot") : "Purchase Bot"}
        </button>
      </div>
    </div>
  )
}
