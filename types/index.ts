export interface User {
  id: string
  firstName: string
  lastName?: string
  avatarUrl?: string
  balance: number
  tapsLeft: number
  energyLimit: number
  multiTapValue: number
  rechargingSpeed: number
  tapBotPurchased: boolean
  tapBotActive: boolean
  bonusClaimed: boolean
  pubgId?: string
  totalTaps: number
  totalEarned: number
  lastJackpotTime: number
  referredBy?: string
  referralCount: number
  level: number
  xp: number
  streak: number
  combo: number
  lastTapTime: number
  settings: {
    sound: boolean
    vibration: boolean
    notifications: boolean
  }
  boosts: {
    energyLevel: number
    multiTapLevel: number
    rechargeLevel: number
  }
  missions: Record<string, UserMission>
  withdrawals: Withdrawal[]
  joinedAt: number
  lastActive: number
  isReturningUser: boolean
  dataInitialized: boolean
}

export interface Mission {
  id: string
  title: string
  description: string
  reward: number
  requiredCount?: number
  channelId?: string
  url?: string
  code?: string
  requiredTime?: number
  active: boolean
  category: string
  type: "join_channel" | "join_group" | "url_timer" | "promo_code" | "daily_taps" | "invite_friends"
  icon?: string
  img?: string
  priority?: number
  createdAt: string
  expiresAt?: string
  resetDaily?: boolean
}

export interface UserMission {
  started: boolean
  completed: boolean
  claimed: boolean
  currentCount: number
  startedDate?: number
  completedAt?: number
  claimedAt?: number
  lastVerifyAttempt?: number
  timerStarted?: number
  codeSubmitted?: string
}

export interface Withdrawal {
  txId: number
  amount: number
  packageType: string
  status: "pending" | "approved" | "rejected"
  requestedAt: number
  pubgId: string
}

export interface GameState {
  isPlaying: boolean
  tapBotInterval?: NodeJS.Timeout
  rechargeInterval?: NodeJS.Timeout
  comboTimer?: NodeJS.Timeout
  soundEnabled: boolean
  vibrationEnabled: boolean
  dataLoaded: boolean
  saveInProgress: boolean
  lastSaveTime: number
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}
