"use client"

import { useState, useEffect } from "react"
import type { User } from "@/types"
import { gameLogic } from "@/lib/game-logic"
import { firebaseService } from "@/lib/firebase"
import { Wallet, TrendingUp, Hand, Star, Gamepad2, Save, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletSectionProps {
  user: User
  onSavePubgId: (pubgId: string) => Promise<any>
  onWithdraw: (amount: number, packageType: string) => Promise<any>
}

export const WalletSection = ({ user, onSavePubgId, onWithdraw }: WalletSectionProps) => {
  const [pubgId, setPubgId] = useState(user.pubgId || "")
  const [saving, setSaving] = useState(false)
  const [withdrawalPackages, setWithdrawalPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const { level } = gameLogic.calculateLevel(user.xp)

  // Load UC packages from Firebase
  useEffect(() => {
    loadUCPackages()
  }, [])

  const loadUCPackages = async () => {
    try {
      setLoading(true)
      const packages = await firebaseService.getUCPackages()
      setWithdrawalPackages(packages)
    } catch (error) {
      console.error("Failed to load UC packages:", error)
    } finally {
      setLoading(false)
    }
  }

  const walletStats = [
    {
      icon: <Wallet className="w-6 h-6" />,
      value: gameLogic.formatNumber(user.balance),
      label: "Total Balance",
      color: "from-green-400 to-blue-500",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: gameLogic.formatNumber(user.totalEarned),
      label: "Total Earned",
      color: "from-blue-400 to-purple-500",
    },
    {
      icon: <Hand className="w-6 h-6" />,
      value: user.totalTaps.toLocaleString(),
      label: "Total Taps",
      color: "from-purple-400 to-pink-500",
    },
    {
      icon: <Star className="w-6 h-6" />,
      value: level.toString(),
      label: "Current Level",
      color: "from-yellow-400 to-orange-500",
    },
  ]

  const handleSavePubgId = async () => {
    if (!pubgId.trim() || !/^\d+$/.test(pubgId.trim())) {
      return
    }

    setSaving(true)
    try {
      const result = await onSavePubgId(pubgId.trim())
      if (result.success) {
        toast({
          title: "✅ PUBG ID Saved!",
          description: "Your PUBG ID has been saved successfully.",
          duration: 3000,
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-400"
      case "rejected":
        return "text-red-400"
      default:
        return "text-orange-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Completed"
      case "rejected":
        return "Rejected"
      default:
        return "Pending"
    }
  }

  const handleWithdraw = async (amount: number, packageType: string) => {
    const result = await onWithdraw(amount, packageType)
    if (result.success) {
      toast({
        title: "💸 Withdrawal Requested!",
        description: `Your ${packageType} withdrawal request has been submitted.`,
        duration: 3000,
      })
    }
  }

  return (
    <div className="pb-4">
      {/* Enhanced Section Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-3 mb-4 shadow-lg shadow-green-500/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-xl shadow-lg">
            💰
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display">Wallet & Withdrawals</h2>
            <p className="text-gray-300 text-xs">Manage your UC coins</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-semibold">Secure Processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Wallet Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {walletStats.map((stat, index) => (
          <div
            key={index}
            className="bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-lg p-3 text-center hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
          >
            <div
              className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white mx-auto mb-2 shadow-lg`}
            >
              {stat.icon}
            </div>
            <div className="text-sm font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400 font-semibold uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Enhanced PUBG ID Section */}
      <div className="bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">PUBG Mobile ID</h3>
            <p className="text-sm text-gray-400">Enter your PUBG Mobile ID for UC withdrawals</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={pubgId}
            onChange={(e) => setPubgId(e.target.value)}
            placeholder="Enter your PUBG Mobile ID"
            maxLength={20}
            className="flex-1 bg-gray-800/50 border-2 border-gray-700/50 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-all duration-200"
          />
          <button
            onClick={handleSavePubgId}
            disabled={saving || !pubgId.trim() || !/^\d+$/.test(pubgId.trim())}
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Enhanced Withdrawal Packages */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Withdrawal Packages
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-spin text-green-400">⏳</div>
            <p className="text-gray-400">Loading packages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {withdrawalPackages.map((pkg, index) => (
              <div
                key={index}
                onClick={() => handleWithdraw(pkg.amount, pkg.packageType)}
                className={`bg-black/30 backdrop-blur-md border rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 relative ${
                  pkg.popular
                    ? "border-yellow-500/50 shadow-yellow-500/20 bg-yellow-500/5"
                    : "border-gray-700/30 hover:border-green-500/40 hover:shadow-green-500/10"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    POPULAR
                  </div>
                )}
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                  💎
                </div>
                <div className="text-2xl font-bold text-white mb-1">{pkg.amount}</div>
                <div className="text-sm text-gray-400 font-semibold uppercase tracking-wide mb-3">UC</div>
                <div className="text-lg font-bold text-orange-400 mb-2">{gameLogic.formatNumber(pkg.amount)} UC</div>
                <div className="text-xs text-green-400 font-semibold uppercase tracking-wide">Available</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Withdrawal History */}
      <div>
        <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Withdrawal History
        </h3>
        <div className="space-y-3">
          {user.withdrawals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">💸</div>
              <h3 className="text-2xl font-bold text-white font-display mb-4">No Withdrawals Yet</h3>
              <p className="text-gray-400 text-lg">Start earning UC and make your first withdrawal!</p>
            </div>
          ) : (
            user.withdrawals
              .sort((a, b) => b.requestedAt - a.requestedAt) // Sort by requestedAt, not txId
              .map((withdrawal) => (
                <div
                  key={withdrawal.txId}
                  className="bg-black/20 backdrop-blur-md border border-gray-700/20 rounded-xl p-4 hover:border-green-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        #{withdrawal.txId}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{withdrawal.amount} UC</div>
                        <div className="text-sm text-gray-400">{withdrawal.packageType}</div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 font-bold ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      <span>{getStatusText(withdrawal.status)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 mb-1">
                    PUBG ID: <span className="font-bold">{withdrawal.pubgId}</span>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(withdrawal.requestedAt).toLocaleString()}</div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
