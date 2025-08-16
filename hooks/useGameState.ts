"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import type { User, GameState } from "@/types"
import { firebaseService } from "@/lib/firebase"
import { gameLogic, GAME_CONFIG } from "@/lib/game-logic"
import { telegram } from "@/lib/telegram"
import { getUrlParameter, parseReferralFromUrl, parseRefAuthFromUrl, clearUrlParameters, debounce } from "@/lib/utils"

const defaultUserData: User = {
  id: "",
  firstName: "User",
  lastName: "",
  avatarUrl: "",
  balance: 0,
  tapsLeft: 500,
  energyLimit: 500,
  multiTapValue: 1,
  rechargingSpeed: 1,
  tapBotPurchased: false,
  tapBotActive: false,
  bonusClaimed: false,
  pubgId: "",
  totalTaps: 0,
  totalEarned: 0,
  lastJackpotTime: 0,
  referredBy: "",
  referralCount: 0,
  level: 1,
  xp: 0,
  streak: 0,
  combo: 0,
  lastTapTime: 0,
  settings: {
    sound: true,
    vibration: true,
    notifications: true,
  },
  boosts: {
    energyLevel: 1,
    multiTapLevel: 1,
    rechargeLevel: 1,
  },
  missions: {},
  withdrawals: [],
  joinedAt: Date.now(),
  lastActive: Date.now(),
  isReturningUser: false,
  dataInitialized: false,
}

export const useGameState = () => {
  const [user, setUser] = useState<User>(defaultUserData)
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    soundEnabled: true,
    vibrationEnabled: true,
    dataLoaded: false,
    saveInProgress: false,
    lastSaveTime: 0,
  })
  const [loading, setLoading] = useState(true)

  // Define the actual save function
  const performSave = useCallback(async () => {
    if (!user.id) return

    setGameState((prev) => ({ ...prev, saveInProgress: true }))
    try {
      await firebaseService.saveUser(user.id, user)
      setGameState((prev) => ({ ...prev, lastSaveTime: Date.now() }))
    } catch (error) {
      console.error("Failed to save user data:", error)
    } finally {
      setGameState((prev) => ({ ...prev, saveInProgress: false }))
    }
  }, [user])

  // Create a debounced version of the save function for frequent taps
  const debouncedSaveUserData = useCallback(debounce(performSave, 500), [performSave])

  // Initialize user and game
  const initializeGame = useCallback(async () => {
    try {
      telegram.init()
      const telegramUser = telegram.getUser()

      const userId = getUrlParameter("id") || telegramUser?.id?.toString() || "user123"
      const authKey = getUrlParameter("authKey")
      
      if (!authKey) {
        console.error("AuthKey is required")
        return // Stay in loading state
      }
      
      // Validate authentication
      const authResult = await firebaseService.validateAuth(userId, authKey)
      
      if (!authResult.valid && !authResult.isNewUser) {
        console.error("Invalid authentication")
        return // Stay in loading state
      }

      if (authResult.valid && authResult.userData) {
        // Existing user with valid auth
        setUser({ ...defaultUserData, ...authResult.userData, id: userId, isReturningUser: true })
      } else {
        // New user - create account
        const newUser = {
          ...defaultUserData,
          id: userId,
          authKey,
          firstName: telegramUser?.first_name || getUrlParameter("first_name") || "User",
          lastName: telegramUser?.last_name || getUrlParameter("last_name") || "",
          avatarUrl: "", // Don't accept avatar from URL for security
          isReturningUser: false,
        }

        // Handle referral for new users only
        const refId = parseReferralFromUrl()
        const refAuth = parseRefAuthFromUrl()
        
        if (refId && refId !== userId && refAuth) {
          // Validate referrer's authKey
          const referrerAuth = await firebaseService.validateAuth(refId, refAuth)
          if (referrerAuth.valid) {
            newUser.referredBy = refId
            await firebaseService.processReferral(refId, userId, newUser)
          }
        }

        await firebaseService.saveUser(userId, newUser)
        setUser(newUser)
      }
      
      // Clear URL parameters for security
      // clearUrlParameters() // URL parametrlarini tozalamaslik

      setGameState((prev) => ({ ...prev, dataLoaded: true }))
      setLoading(false)
    } catch (error) {
      console.error("Failed to initialize game:", error)
      // Stay in loading state on error
    }
  }, [])

  // Optimized tap function
  const handleTap = useCallback(
    (event?: React.MouseEvent | React.TouchEvent) => {
      // Prevent default for touch events to avoid scrolling/zooming
      if (event && "preventDefault" in event) {
        event.preventDefault()
      }

      if (user.tapsLeft < user.multiTapValue) {
        telegram.hapticFeedback("error")
        return { success: false, message: "Not enough energy!" }
      }

      const now = Date.now()
      const { earned, type } = gameLogic.calculateTapEarnings(user)

      setUser((prev) => ({
        ...prev,
        balance: prev.balance + earned,
        totalEarned: prev.totalEarned + earned,
        tapsLeft: prev.tapsLeft - prev.multiTapValue,
        totalTaps: prev.totalTaps + prev.multiTapValue,
        xp: prev.xp + 1,
        lastTapTime: now,
        lastJackpotTime: type === "jackpot" ? now : prev.lastJackpotTime,
      }))

      if (type === "normal") {
        telegram.hapticFeedback("light")
      } else if (type === "critical") {
        telegram.hapticFeedback("medium")
      } else {
        telegram.hapticFeedback("heavy")
      }

      debouncedSaveUserData()

      return { success: true, earned, type }
    },
    [user, debouncedSaveUserData],
  )

  // Upgrade functions
  const upgradeBoost = useCallback(
    async (boostType: "energy" | "multiTap" | "recharge") => {
      const currentLevel = user.boosts[`${boostType}Level` as keyof typeof user.boosts]
      const cost = gameLogic.getBoostCost(boostType, currentLevel)

      if (user.balance < cost) {
        telegram.hapticFeedback("error")
        return { success: false, message: `Need ${gameLogic.formatNumber(cost)} UC` }
      }

      const updates: Partial<User> = {
        balance: user.balance - cost,
        boosts: { ...user.boosts, [`${boostType}Level`]: currentLevel + 1 },
      }

      switch (boostType) {
        case "energy":
          updates.energyLimit = user.energyLimit + 500
          updates.tapsLeft = user.energyLimit + 500
          break
        case "multiTap":
          updates.multiTapValue = user.multiTapValue + 1
          break
        case "recharge":
          updates.rechargingSpeed = user.rechargingSpeed + 1
          break
      }

      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      await firebaseService.saveUser(updatedUser.id, updatedUser)

      telegram.hapticFeedback("success")
      return { success: true, message: `${boostType} upgraded!` }
    },
    [user],
  )

  // Claim welcome bonus
  const claimWelcomeBonus = useCallback(async () => {
    if (user.bonusClaimed) return { success: false, message: "Already claimed" }

    const updatedUser = {
      ...user,
      balance: user.balance + GAME_CONFIG.WELCOME_BONUS,
      totalEarned: user.totalEarned + GAME_CONFIG.WELCOME_BONUS,
      bonusClaimed: true,
      dataInitialized: true,
    }

    setUser(updatedUser)
    await firebaseService.saveUser(updatedUser.id, updatedUser)

    telegram.hapticFeedback("success")
    return { success: true, message: `Claimed ${GAME_CONFIG.WELCOME_BONUS} UC!` }
  }, [user])

  // Handle auto tap bot
  const handleToggleAutoTap = useCallback(async () => {
    if (!user.tapBotPurchased) {
      if (user.balance >= GAME_CONFIG.TAP_BOT_COST) {
        const updatedUser = {
          ...user,
          balance: user.balance - GAME_CONFIG.TAP_BOT_COST,
          tapBotPurchased: true,
          tapBotActive: true,
        }
        setUser(updatedUser)
        await firebaseService.saveUser(updatedUser.id, updatedUser)
        telegram.hapticFeedback("success")
        return { success: true, message: "Auto Tap Bot purchased!" }
      } else {
        telegram.hapticFeedback("error")
        return { success: false, message: "Insufficient funds" }
      }
    } else {
      const updatedUser = {
        ...user,
        tapBotActive: !user.tapBotActive,
      }
      setUser(updatedUser)
      await firebaseService.saveUser(updatedUser.id, updatedUser)
      telegram.hapticFeedback("medium")
      return { success: true, message: user.tapBotActive ? "Bot deactivated" : "Bot activated" }
    }
  }, [user])

  // Energy recharge effect
  useEffect(() => {
    if (!user.id || !gameState.dataLoaded) return

    let interval: NodeJS.Timeout
    
    const startRecharge = () => {
      interval = setInterval(() => {
        setUser((prev) => {
          if (prev.tapsLeft < prev.energyLimit) {
            return {
              ...prev,
              tapsLeft: Math.min(prev.tapsLeft + prev.rechargingSpeed, prev.energyLimit),
            }
          }
          return prev
        })
      }, Math.max(GAME_CONFIG.ENERGY_REGEN_RATE / user.rechargingSpeed, 200)) // Slower recharge, minimum 200ms
    }

    // Only recharge when page is visible and user is active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval)
      } else {
        startRecharge()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    if (!document.hidden) {
      startRecharge()
    }

    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [gameState.dataLoaded, user.rechargingSpeed])

  // Auto-bot tapping effect
  useEffect(() => {
    let tapBotInterval: NodeJS.Timeout | undefined

    if (user.tapBotActive && gameState.dataLoaded) {
      tapBotInterval = setInterval(() => {
        // Call handleTap without an event object for auto-taps
        handleTap()
      }, GAME_CONFIG.TAP_BOT_INTERVAL)
    }

    return () => {
      if (tapBotInterval) {
        clearInterval(tapBotInterval)
      }
    }
  }, [user.tapBotActive, gameState.dataLoaded, handleTap]) // Dependencies for auto-bot

  // Initialize on mount
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  return {
    user,
    gameState,
    loading,
    handleTap,
    upgradeBoost,
    claimWelcomeBonus,
    saveUserData: debouncedSaveUserData,
    setUser,
    handleToggleAutoTap,
  }
}