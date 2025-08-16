"use client"

import { useState } from "react"
import type { Mission, UserMission } from "@/types"
import { Target, Clock, Code, Users, X, Send, ExternalLink, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface MissionSectionProps {
  missions: Record<string, Mission>
  userMissions: Record<string, UserMission>
  onStartMission: (missionId: string) => Promise<any>
  onVerifyMission: (missionId: string) => Promise<any>
  onSubmitPromoCode: (missionId: string, code: string) => Promise<any>
  onClaimReward: (missionId: string) => Promise<any>
}

export const MissionSection = ({
  missions,
  userMissions,
  onStartMission,
  onVerifyMission,
  onSubmitPromoCode,
  onClaimReward,
}: MissionSectionProps) => {
  const [currentFilter, setCurrentFilter] = useState("all")
  const [selectedMission, setSelectedMission] = useState<string | null>(null)
  const { toast } = useToast()
  const [promoCodeModal, setPromoCodeModal] = useState<{
    isOpen: boolean
    missionId: string
    code: string
    submitting: boolean
    error: string
  }>({
    isOpen: false,
    missionId: "",
    code: "",
    submitting: false,
    error: "",
  })

  const filters = [
    { id: "all", label: "All", icon: "🎯" },
    { id: "join_channel", label: "Join", icon: "👥" },
    { id: "url_timer", label: "Timer", icon: "⏰" },
    { id: "promo_code", label: "Code", icon: "🔐" },
  ]

  const filteredMissions = Object.entries(missions).filter(([id, mission]) => {
    if (!mission || !mission.active) return false
    if (currentFilter === "all") return true
    return mission.type === currentFilter
  })

  const sortedMissions = filteredMissions.sort(([aId, a], [bId, b]) => {
    const aUserMission = userMissions[aId]
    const bUserMission = userMissions[bId]

    const aCompleted = aUserMission?.completed || false
    const bCompleted = bUserMission?.completed || false

    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1
    }

    return (a.priority || 999) - (b.priority || 999)
  })

  const getMissionIcon = (mission: Mission) => {
    // If mission has img property, use it as image
    if (mission.img) {
      return (
        <Image
          src={mission.img}
          alt={mission.title}
          width={32}
          height={32}
          className="w-8 h-8 rounded-lg object-cover"
        />
      )
    }

    // Otherwise use default icons
    switch (mission.type) {
      case "join_channel":
      case "join_group":
        return <Users className="w-5 h-5" />
      case "url_timer":
        return <Clock className="w-5 h-5" />
      case "promo_code":
        return <Code className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const handleMissionClick = (missionId: string) => {
    const userMission = userMissions[missionId]

    // Only show modal for missions that haven't been started yet
    if (!userMission?.started) {
      setSelectedMission(missionId)
    } else if (userMission?.completed && !userMission?.claimed) {
      // If completed but not claimed, claim directly
      handleClaimMissionReward(missionId)
    } else if (userMission?.started && !userMission?.completed) {
      // If started but not completed, show appropriate action
      const mission = missions[missionId]
      if (mission?.type === "promo_code") {
        handleOpenPromoModal(missionId)
      } else {
        // For other types, try to verify
        onVerifyMission(missionId).then((result) => {
          if (result.success) {
            toast({
              title: "✅ Mission Completed!",
              description: result.message,
              duration: 3000,
            })
          } else {
            toast({
              title: "⏳ Not Ready Yet",
              description: result.message,
              duration: 3000,
            })
          }
        })
      }
    }
  }

  const selectedMissionData = selectedMission ? missions[selectedMission] : null

  const handleOpenPromoModal = (missionId: string) => {
    setPromoCodeModal({
      isOpen: true,
      missionId,
      code: "",
      submitting: false,
      error: "",
    })
  }

  const handleClosePromoModal = () => {
    setPromoCodeModal({
      isOpen: false,
      missionId: "",
      code: "",
      submitting: false,
      error: "",
    })
  }

  const handleSubmitPromoCode = async () => {
    if (!promoCodeModal.code.trim()) return

    setPromoCodeModal((prev) => ({ ...prev, submitting: true, error: "" }))

    try {
      const result = await onSubmitPromoCode(promoCodeModal.missionId, promoCodeModal.code)
      if (result.success) {
        toast({
          title: "✅ Code Verified!",
          description: "Mission completed successfully!",
          duration: 3000,
        })
        handleClosePromoModal()
      } else {
        toast({
          title: "❌ Invalid Code",
          description: "Please check the code and try again.",
          duration: 3000,
        })
        setPromoCodeModal((prev) => ({ ...prev, error: "Incorrect code. Try again." }))
      }
    } catch (error) {
      setPromoCodeModal((prev) => ({ ...prev, error: "Failed to submit code. Try again." }))
    } finally {
      setPromoCodeModal((prev) => ({ ...prev, submitting: false }))
    }
  }

  const handleReturnToMission = () => {
    const mission = missions[promoCodeModal.missionId]
    if (mission?.url) {
      window.open(mission.url, "_blank")
    }
  }

  const handleClaimMissionReward = (missionId: string) => {
    onClaimReward(missionId).then((result) => {
      if (result.success) {
        toast({
          title: "🎁 Reward Claimed!",
          description: `You earned ${result.reward} UC!`,
          duration: 3000,
        })
      }
    })
  }

  return (
    <div className="pb-4 px-2">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-3 mb-4 shadow-lg shadow-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-lg shadow-lg">
            🎯
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-display">Missions & Rewards</h2>
            <p className="text-gray-300 text-xs">Complete tasks to earn UC</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-semibold">
                {sortedMissions.filter(([id]) => !userMissions[id]?.completed).length} Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Filters */}
      <div className="flex gap-1 mb-4 p-1 bg-black/30 backdrop-blur-md border border-gray-700/30 rounded-lg overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setCurrentFilter(filter.id)}
            className={`px-2 py-1.5 rounded-lg font-semibold text-xs whitespace-nowrap transition-all duration-300 flex items-center gap-1 ${
              currentFilter === filter.id
                ? "bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-md border border-green-500/50"
                : "text-gray-400 hover:text-white hover:bg-gray-800/30 border border-transparent"
            }`}
          >
            <span className="text-xs">{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Missions List */}
      <div className="space-y-2">
        {sortedMissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🎯</div>
            <h3 className="text-lg font-bold text-white font-display mb-2">No Missions Available</h3>
            <p className="text-gray-400 text-sm">Check back later for new missions!</p>
          </div>
        ) : (
          sortedMissions.map(([missionId, mission]) => {
            const userMission = userMissions[missionId] || {
              started: false,
              completed: false,
              claimed: false,
              currentCount: 0,
            }

            const progressPercentage = Math.min((userMission.currentCount / (mission.requiredCount || 1)) * 100, 100)

            return (
              <div
                key={missionId}
                onClick={() => handleMissionClick(missionId)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                  userMission.claimed
                    ? "bg-green-500/10 border border-green-500/30 opacity-75"
                    : userMission.completed
                      ? "bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20"
                      : userMission.started
                        ? "bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20"
                        : "bg-black/20 border border-gray-700/30 hover:bg-black/30"
                }`}
              >
                {/* Mission Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  {getMissionIcon(mission)}
                </div>

                {/* Mission Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{mission.title}</h3>
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                      {mission.category}
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 mb-1 truncate">{mission.description}</div>
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                      💎 {mission.reward}
                    </div>
                    <div className="text-xs text-gray-400">
                      {userMission.currentCount}/{mission.requiredCount || 1}
                    </div>
                  </div>
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {userMission.claimed ? (
                    <div className="w-6 h-6 text-green-400">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.79502 15.875L4.62502 11.705L3.20502 13.115L8.79502 18.705L20.795 6.705L19.385 5.295L8.79502 15.875Z"
                          fill="#28E0B9"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 text-gray-400">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M9.70498 6L8.29498 7.41L12.875 12L8.29498 16.59L9.70498 18L15.705 12L9.70498 6Z"
                          fill="#9D99A9"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Mission Detail Modal */}
      {selectedMission && selectedMissionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-md border-2 border-green-500/30 rounded-2xl shadow-xl shadow-green-500/20">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-2xl">
                  {getMissionIcon(selectedMissionData)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-display">{selectedMissionData.title}</h2>
                  <p className="text-sm text-green-400">{selectedMissionData.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMission(null)}
                className="w-8 h-8 bg-gray-700/20 hover:bg-red-500/20 border border-gray-700/30 hover:border-red-500/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-300 mb-4 leading-relaxed">{selectedMissionData.description}</p>

              {/* Reward */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-1">{selectedMissionData.reward}</div>
                <div className="text-sm text-gray-300">UC Reward</div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {selectedMissionData.type === "join_channel" || selectedMissionData.type === "join_group" ? (
                  <>
                    <button
                      onClick={() => {
                        window.open(`https://t.me/${selectedMissionData.channelId}`, "_blank")
                        onStartMission(selectedMission)
                        setSelectedMission(null)
                      }}
                      className="w-full bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Channel/Group
                    </button>
                  </>
                ) : selectedMissionData.type === "url_timer" ? (
                  <button
                    onClick={() => {
                      if (selectedMissionData.url) {
                        window.open(selectedMissionData.url, "_blank")
                      }
                      onStartMission(selectedMission)
                      setSelectedMission(null)
                    }}
                    className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website ({selectedMissionData.requiredTime}s)
                  </button>
                ) : selectedMissionData.type === "promo_code" ? (
                  <button
                    onClick={() => {
                      if (selectedMissionData.url) {
                        window.open(selectedMissionData.url, "_blank")
                      }
                      onStartMission(selectedMission)
                      setSelectedMission(null)
                    }}
                    className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    Find Promo Code
                  </button>
                ) : null}

                <button
                  onClick={() => setSelectedMission(null)}
                  className="w-full bg-gray-700/20 hover:bg-gray-700/40 text-gray-300 hover:text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 border border-gray-700/30 hover:border-gray-600/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promo Code Modal */}
      {promoCodeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-gray-900/95 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl shadow-xl shadow-purple-500/20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-xl">
                  🔐
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-display">Enter Code</h2>
                  <p className="text-xs text-gray-400">Enter the code you found</p>
                </div>
              </div>
              <button
                onClick={handleClosePromoModal}
                className="w-8 h-8 bg-gray-700/20 hover:bg-red-500/20 border border-gray-700/30 hover:border-red-500/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Promo Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={promoCodeModal.code}
                    onChange={(e) => {
                      setPromoCodeModal((prev) => ({ ...prev, code: e.target.value, error: "" }))
                    }}
                    placeholder="Enter code..."
                    className={`w-full bg-gray-800/50 border-2 ${
                      promoCodeModal.error ? "border-red-500" : "border-gray-700/50 focus:border-purple-500"
                    } rounded-xl px-3 py-2 text-white placeholder-gray-400 focus:outline-none transition-all duration-200 text-base font-mono tracking-wider`}
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400">
                    <Code className="w-4 h-4" />
                  </div>
                </div>
                {promoCodeModal.error && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400 font-semibold">{promoCodeModal.error}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleSubmitPromoCode}
                  disabled={!promoCodeModal.code.trim() || promoCodeModal.submitting}
                  className="w-full bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {promoCodeModal.submitting ? "Submitting..." : "Submit"}
                </button>

                <button
                  onClick={handleReturnToMission}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 border border-blue-600/30 hover:border-blue-500/50 flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  Return to Mission
                </button>

                <button
                  onClick={handleClosePromoModal}
                  className="w-full bg-gray-700/20 hover:bg-gray-700/40 text-gray-300 hover:text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 border border-gray-700/30 hover:border-gray-600/50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
