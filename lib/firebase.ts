import { initializeApp, getApps, getApp } from "firebase/app" // Import getApps and getApp
import { getDatabase, ref, set, get, update } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyCEREULVgN4HHnilztiKtCt0TrXGlHLiH8",
  authDomain: "rountenote.firebaseapp.com",
  databaseURL: "https://rountenote-default-rtdb.firebaseio.com",
  projectId: "rountenote",
  storageBucket: "rountenote.firebasestorage.app",
  messagingSenderId: "468968349508",
  appId: "1:468968349508:web:10118a57a2c90e8fa70111",
  measurementId: "G-9ZBMKW473G",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const database = getDatabase(app)

export const firebaseService = {
  database, // Export database for direct access

  // Validate user authentication
  async validateAuth(userId: string, authKey: string) {
    try {
      const snapshot = await get(ref(database, `users/${userId}`))
      const userData = snapshot.val()
      
      if (!userData || !userData.authKey) {
        return { valid: false, isNewUser: true }
      }
      
      return { 
        valid: userData.authKey === authKey, 
        isNewUser: false,
        userData 
      }
    } catch (error) {
      console.error("Error validating auth:", error)
      return { valid: false, isNewUser: false }
    }
  },

  // Get bot token dynamically from Firebase
  async getBotToken() {
    try {
      const snapshot = await get(ref(database, "config/botToken"))
      return snapshot.val() || "7270345128:AAEuRX7lABDMBRh6lRU1d-4aFzbiIhNgOWE"
    } catch (error) {
      console.error("Error getting bot token:", error)
      return "7270345128:AAEuRX7lABDMBRh6lRU1d-4aFzbiIhNgOWE"
    }
  },

  // Get bot username dynamically from Firebase
  async getBotUsername() {
    try {
      const snapshot = await get(ref(database, "config/botUsername"))
      return snapshot.val() || "UCCoinUltraBot"
    } catch (error) {
      console.error("Error getting bot username:", error)
      return "UCCoinUltraBot"
    }
  },

  // Get UC packages dynamically from Firebase
  async getUCPackages() {
    try {
      const snapshot = await get(ref(database, "config/ucPackages"))
      const packages = snapshot.val()

      if (packages) {
        return Object.values(packages).sort((a: any, b: any) => a.amount - b.amount)
      }

      // Default packages if not found in Firebase
      return [
        { amount: 60, packageType: "60 UC", popular: false },
        { amount: 325, packageType: "325 UC", popular: true },
        { amount: 660, packageType: "660 UC", popular: false },
        { amount: 1800, packageType: "1800 UC", popular: true },
        { amount: 3850, packageType: "3850 UC", popular: false },
        { amount: 8100, packageType: "8100 UC", popular: false },
      ]
    } catch (error) {
      console.error("Error getting UC packages:", error)
      return [
        { amount: 60, packageType: "60 UC", popular: false },
        { amount: 325, packageType: "325 UC", popular: true },
        { amount: 660, packageType: "660 UC", popular: false },
        { amount: 1800, packageType: "1800 UC", popular: true },
        { amount: 3850, packageType: "3850 UC", popular: false },
        { amount: 8100, packageType: "8100 UC", popular: false },
      ]
    }
  },

  // User operations
  async saveUser(userId: string, userData: any) {
    try {
      // Ensure authKey is preserved and required
      if (!userData.authKey) {
        throw new Error("AuthKey is required")
      }
      
      await set(ref(database, `users/${userId}`), {
        ...userData,
        lastActive: Date.now(),
        status: "active",
        dataInitialized: true,
      })
      return true
    } catch (error) {
      console.error("Error saving user:", error)
      return false
    }
  },

  async getUser(userId: string) {
    try {
      const snapshot = await get(ref(database, `users/${userId}`))
      return snapshot.val()
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  },

  // Mission operations
  async getMissions() {
    try {
      const snapshot = await get(ref(database, "missions"))
      return snapshot.val() || {}
    } catch (error) {
      console.error("Error getting missions:", error)
      return {}
    }
  },

  async getUserMissions(userId: string) {
    try {
      const snapshot = await get(ref(database, `userMissions/${userId}`))
      return snapshot.val() || {}
    } catch (error) {
      console.error("Error getting user missions:", error)
      return {}
    }
  },

  async updateUserMission(userId: string, missionId: string, missionData: any) {
    try {
      await set(ref(database, `userMissions/${userId}/${missionId}`), missionData)
      return true
    } catch (error) {
      console.error("Error updating user mission:", error)
      return false
    }
  },

  // Referral operations
  async getReferralData(userId: string) {
    try {
      const snapshot = await get(ref(database, `referrals/${userId}`))
      return snapshot.val() || { count: 0, totalUC: 0, referrals: {} }
    } catch (error) {
      console.error("Error getting referral data:", error)
      return { count: 0, totalUC: 0, referrals: {} }
    }
  },

  async getLeaderboard() {
    try {
      const [referralsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(database, "referrals")),
        get(ref(database, "users")),
      ])

      const referralsData = referralsSnapshot.val() || {}
      const users = usersSnapshot.val() || {}

      const leaderboardData = Object.entries(referralsData)
        .map(([id, data]: [string, any]) => ({
          id,
          count: data.count || 0,
          earned: data.totalUC || 0,
          user: users[id] || {},
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 100) // Top 100

      return leaderboardData
    } catch (error) {
      console.error("Error getting leaderboard:", error)
      return []
    }
  },

  async processReferral(refId: string, userId: string, userData: any) {
    try {
      // Validate referrer exists and has authKey
      const referrerSnapshot = await get(ref(database, `users/${refId}`))
      const referrerData = referrerSnapshot.val()
      
      if (!referrerData || !referrerData.authKey) {
        console.log("Invalid referrer or missing authKey")
        return false
      }
      
      const refSnapshot = await get(ref(database, `referrals/${refId}`))
      const refData = refSnapshot.val() || { referrals: {} }

      if (refData.referrals && refData.referrals[userId]) {
        return false // Already processed
      }

      const newReferralData = {
        count: (refData.count || 0) + 1,
        totalUC: (refData.totalUC || 0) + 15,
        referrals: {
          ...(refData.referrals || {}),
          [userId]: {
            date: new Date().toISOString(),
            earned: 15,
            firstName: userData.firstName,
            lastName: userData.lastName || "",
            avatarUrl: userData.avatarUrl || "",
          },
        },
      }

      await set(ref(database, `referrals/${refId}`), newReferralData)

      // Update referrer's balance
      if (referrerData) {
        await update(ref(database, `users/${refId}`), {
          balance: (referrerData.balance || 0) + 15,
          referralCount: (referrerData.referralCount || 0) + 1,
          totalEarned: (referrerData.totalEarned || 0) + 15,
        })
      }

      return true
    } catch (error) {
      console.error("Error processing referral:", error)
      return false
    }
  },

  // Withdrawal operations
  async createWithdrawal(userId: string, withdrawalData: any) {
    try {
      const withdrawalsRef = ref(database, `withdrawals/${userId}`)
      const snapshot = await get(withdrawalsRef)
      const existingWithdrawals = snapshot.val() || {}
      const withdrawalNumbers = Object.keys(existingWithdrawals)
        .map(Number)
        .filter((n) => !isNaN(n))
      const nextNumber = withdrawalNumbers.length > 0 ? Math.max(...withdrawalNumbers) + 1 : 1

      await set(ref(database, `withdrawals/${userId}/${nextNumber}`), {
        ...withdrawalData,
        withdrawalNum: nextNumber,
        requestedAt: Date.now(),
      })

      return nextNumber
    } catch (error) {
      console.error("Error creating withdrawal:", error)
      return null
    }
  },

  // Telegram verification with dynamic bot token
  async verifyTelegramMembership(userId: string, channelId: string) {
    try {
      // Use custom API for membership verification
      let apiData = ""
      
      // Check if channelId starts with @ (username) or is numeric (channel ID)
      if (channelId.startsWith("@")) {
        // For username channels, send with @
        apiData = btoa(`${channelId}|${userId}`)
      } else if (channelId.startsWith("-100") || /^\d+$/.test(channelId)) {
        // For numeric IDs, ensure -100 prefix for supergroups
        const fullChannelId = channelId.startsWith("-100") ? channelId : `-100${channelId}`
        apiData = btoa(`${fullChannelId}|${userId}`)
      } else {
        // Default case - assume it's a username and add @
        apiData = btoa(`@${channelId}|${userId}`)
      }

      const response = await fetch(
        `https://m5576.myxvest.ru/davronovapi/api.php?data=${apiData}`
      )
      const result = await response.text()
      
      // API returns "yes" for subscribed, "no" for not subscribed
      return result.toLowerCase().trim() === "yes"
    } catch (error) {
      console.error("Error verifying membership:", error)
      return false
    }
  },

  // Fallback method using Telegram Bot API (if needed)
  async verifyTelegramMembershipFallback(userId: string, channelId: string) {
    try {
      const botToken = await this.getBotToken()
      let chatId = channelId
      
      // Format chat ID properly
      if (!channelId.startsWith("@") && !channelId.startsWith("-")) {
        chatId = `@${channelId}`
      }
      
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${chatId}&user_id=${userId}`
      )
      const data = await response.json()

      if (data.ok && data.result) {
        const status = data.result.status
        return ["member", "administrator", "creator"].includes(status)
      }
      return false
    } catch (error) {
      console.error("Error verifying membership:", error)
      return false
    }
  },

  async getGlobalLeaderboard() {
    try {
      const snapshot = await get(ref(database, "users"))
      const users = snapshot.val() || {}

      return Object.entries(users)
        .map(([id, userData]: [string, any]) => ({
          id,
          firstName: userData.firstName || "User",
          lastName: userData.lastName || "",
          avatarUrl: userData.avatarUrl || "",
          totalEarned: userData.totalEarned || 0,
        }))
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 100)
    } catch (error) {
      console.error("Error getting global leaderboard:", error)
      return []
    }
  },
}
