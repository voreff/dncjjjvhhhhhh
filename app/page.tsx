"use client"

import { useState, useEffect } from "react"
import { useGameState } from "@/hooks/useGameState"
import { useMissions } from "@/hooks/useMissions"
import { Header } from "@/components/Header"
import { TapSection } from "@/components/TapSection"
import { BoostSection } from "@/components/BoostSection"
import { MissionSection } from "@/components/MissionSection"
import { WalletSection } from "@/components/WalletSection"
import { FriendsSection } from "@/components/FriendsSection"
import { BottomNavigation } from "@/components/BottomNavigation"
import { WelcomeModal } from "@/components/Modals/WelcomeModal"
import { SettingsModal } from "@/components/Modals/SettingsModal"
import { WithdrawalModal } from "@/components/Modals/WithdrawalModal"
import { RankModal } from "@/components/RankModal"
import { firebaseService } from "@/lib/firebase"
import { telegram } from "@/lib/telegram"

export default function Home() {
  const { user, gameState, loading, handleTap, upgradeBoost, claimWelcomeBonus, setUser, handleToggleAutoTap } =
    useGameState()
  const { missions, userMissions, startMission, verifyMission, submitPromoCode, claimReward, updateProgress } =
    useMissions(user.id)

  const [activeSection, setActiveSection] = useState("tap")
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showRankModal, setShowRankModal] = useState(false)
  const [withdrawalModal, setWithdrawalModal] = useState<{
    isOpen: boolean
    amount: number
    packageType: string
  }>({ isOpen: false, amount: 0, packageType: "" })
  const [botUsername, setBotUsername] = useState("UCCoinUltraBot")
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [loadingDone, setLoadingDone] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoStarted, setVideoStarted] = useState(false)
  const [minLoadingDone, setMinLoadingDone] = useState(false)

  // Kamida 5 sekund loading ko‘rsatish
  useEffect(() => {
    if (loading && videoStarted) {
      const timer = setTimeout(() => setMinLoadingDone(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [loading, videoStarted])

  // Load bot username from Firebase
  useEffect(() => {
    loadBotUsername()
  }, [])

  const loadBotUsername = async () => {
    try {
      const username = await firebaseService.getBotUsername()
      setBotUsername(username)
    } catch (error) {
      console.error("Failed to load bot username:", error)
    }
  }

  // Show welcome modal for users who haven't claimed bonus
  useEffect(() => {
    if (gameState.dataLoaded && !user.bonusClaimed) {
      setShowWelcomeModal(true)
    }
  }, [gameState.dataLoaded, user.bonusClaimed])

  // Handle welcome bonus claim
  const handleClaimWelcomeBonus = async () => {
    const result = await claimWelcomeBonus()
    if (result.success) {
      setShowWelcomeModal(false)
      telegram.hapticFeedback("success")
    }
    return result
  }

  // Handle boost upgrades
  const handleUpgradeBoost = async (boostType: "energy" | "multiTap" | "recharge") => {
    const result = await upgradeBoost(boostType)
    if (result.success) {
      // saveUserData is now called internally by upgradeBoost
    }
    return result
  }

  // Handle mission reward claim
  const handleClaimMissionReward = async (missionId: string) => {
    const result = await claimReward(missionId)
    if (result.success && result.reward) {
      const updatedUser = {
        ...user,
        balance: user.balance + result.reward,
        totalEarned: user.totalEarned + result.reward,
      }
      setUser(updatedUser) // Update local state
      await firebaseService.saveUser(updatedUser.id, updatedUser) // Direct save for immediate persistence
      telegram.hapticFeedback("success")
    }
    return result
  }

  // Handle PUBG ID save
  const handleSavePubgId = async (pubgId: string) => {
    const updatedUser = { ...user, pubgId }
    setUser(updatedUser) // Update local state
    await firebaseService.saveUser(updatedUser.id, updatedUser) // Direct save for immediate persistence
    telegram.hapticFeedback("success")
    return { success: true, message: "PUBG ID saved!" }
  }

  // Handle withdrawal
  const handleWithdraw = async (amount: number, packageType: string) => {
    if (!user.pubgId) {
      telegram.hapticFeedback("error")
      return { success: false, message: "Please set your PUBG ID first" }
    }

    if (user.balance < amount) {
      telegram.hapticFeedback("error")
      return { success: false, message: "Insufficient balance" }
    }

    setWithdrawalModal({ isOpen: true, amount, packageType })
    return { success: true }
  }

  // Confirm withdrawal
  const handleConfirmWithdrawal = async () => {
    const { amount, packageType } = withdrawalModal

    try {
      const withdrawalNum = await firebaseService.createWithdrawal(user.id, {
        pubgId: user.pubgId,
        amount,
        packageType,
        status: "pending",
      })

      if (withdrawalNum) {
        const updatedUser = {
          ...user,
          balance: user.balance - amount,
          withdrawals: [
            ...user.withdrawals,
            {
              txId: withdrawalNum,
              amount,
              packageType,
              status: "pending" as const,
              requestedAt: Date.now(),
              pubgId: user.pubgId!,
            },
          ],
        }
        setUser(updatedUser)
        await firebaseService.saveUser(updatedUser.id, updatedUser)
        telegram.hapticFeedback("success")
        return { success: true, message: "Withdrawal requested!" }
      }
    } catch (error) {
      console.error("Withdrawal failed:", error)
      telegram.hapticFeedback("error")
      return { success: false, message: "Withdrawal failed" }
    }
  }

  // Handle referral link copy with dynamic bot username
  const handleCopyReferralLink = async () => {
    const referralLink = `https://t.me/${botUsername}?start=${user.id}`

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(referralLink)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = referralLink
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      telegram.hapticFeedback("success")

      if (telegram.webApp) {
        const shareText = `🎮 Join UC Coin Ultra and start earning UC for PUBG Mobile!

💎 Get 100 UC welcome bonus
⚡ Tap to earn more UC
🎁 Complete missions for rewards

Join now: ${referralLink}`

        telegram.openLink(
          `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
        )
      }

      return { success: true, message: "Link copied and shared!" }
    } catch (error) {
      console.error("Failed to copy referral link:", error)
      telegram.hapticFeedback("error")
      return { success: false, message: "Failed to copy link" }
    }
  }

  // Handle settings update
  const handleUpdateSettings = async (newSettings: Partial<typeof user.settings>) => {
    const updatedUser = {
      ...user,
      settings: { ...user.settings, ...newSettings },
    }
    setUser(updatedUser)
    await firebaseService.saveUser(updatedUser.id, updatedUser)
  }

  // Prevent section change if welcome bonus not claimed
  const handleSectionChange = (section: string) => {
    if (!user.bonusClaimed && section !== "tap") {
      setShowWelcomeModal(true)
      return
    }
    setActiveSection(section)
  }

  // Video yuklangach, 7 sekunddan keyin loading tugaydi
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (videoLoaded && loading) {
      timer = setTimeout(() => setLoadingDone(true), 7000)
    }
    return () => timer && clearTimeout(timer)
  }, [videoLoaded, loading])

  // Loading ekrani: loading true va loadingDone false bo‘lsa
  if (loading && !loadingDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
        <video
          src="/loading.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          onLoadedData={() => setVideoLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="relative z-20 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Authenticating...</p>
          <p className="text-gray-300 text-sm mt-2">Verifying your credentials</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative overflow-x-hidden"
      style={{ backgroundImage: "url(/background.png)" }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* App Container */}
      <div className="relative z-10 main-container min-h-screen bg-transparent px-2 sm:px-4 md:px-6">
        {/* Header */}
        <Header user={user} onOpenSettings={() => setShowSettingsModal(true)} />

        {/* Main Content */}
        <main className="flex-1 pb-20 sm:pb-24 md:pb-28 flex flex-col">
          {activeSection === "tap" && (
            <TapSection user={user} onTap={handleTap} onOpenRank={() => setShowRankModal(true)} />
          )}

          {activeSection === "boost" && (
            <BoostSection
              user={user}
              onUpgrade={handleUpgradeBoost}
              onToggleAutoTap={handleToggleAutoTap}
              onOpenRank={() => setShowRankModal(true)}
            />
          )}

          {activeSection === "missions" && (
            <MissionSection
              missions={missions}
              userMissions={userMissions}
              onStartMission={startMission}
              onVerifyMission={verifyMission}
              onSubmitPromoCode={submitPromoCode}
              onClaimReward={handleClaimMissionReward}
            />
          )}

          {activeSection === "wallet" && (
            <WalletSection user={user} onSavePubgId={handleSavePubgId} onWithdraw={handleWithdraw} />
          )}

          {activeSection === "friends" && <FriendsSection user={user} onCopyReferralLink={handleCopyReferralLink} />}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>

      {/* Modals */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onClaimBonus={handleClaimWelcomeBonus}
        onSkip={async () => {
          const updatedUser = { ...user, bonusClaimed: true, dataInitialized: true }
          setUser(updatedUser)
          setShowWelcomeModal(false)
          await firebaseService.saveUser(updatedUser.id, updatedUser)
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* RankModal onClose prop corrected */}
      <RankModal isOpen={showRankModal} onClose={() => setShowRankModal(false)} user={user} />

      <WithdrawalModal
        isOpen={withdrawalModal.isOpen}
        onClose={() => setWithdrawalModal((prev) => ({ ...prev, isOpen: false }))}
        amount={withdrawalModal.amount}
        packageType={withdrawalModal.packageType}
        pubgId={user.pubgId || ""}
        onConfirm={handleConfirmWithdrawal}
      />
    </div>
  )
}
