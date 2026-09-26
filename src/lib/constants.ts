export const INSTRUMENTS = [
  // Forex Majors
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
  // Forex Minors
  "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD",
  "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
  "AUDJPY", "AUDCHF", "AUDCAD", "AUDNZD",
  "CADJPY", "CHFJPY", "NZDJPY", "NZDCAD", "NZDCHF",
  // Gold & Silver
  "XAUUSD", "XAGUSD", "XAUJPY", "XAUEUR",
  // Crypto
  "BTCUSD", "ETHUSD", "BNBUSD", "SOLUSD", "XRPUSD", "ADAUSD", "DOGEUSD",
  "BTCEUR", "ETHEUR",
  // Indices
  "US30", "US500", "NAS100", "US2000",
  "UK100", "GER40", "FRA40", "ESP35", "EU50",
  "JP225", "AUS200", "HK50",
  // Oil
  "USOIL", "UKOIL",
]

export const ENTRY_CONFLUENCES = [
  "LQ Sweep", "HTF POI", "MTF POI", "LTF POI", "LTF POI Mitigation",
  "MTF POI Mitigation", "HTF POI Mitigation", "BOS", "CHOCH", "MSS",
  "Market Shift", "FVG", "OB", "BB", "Breaker Block",
  "LQ Void", "Inducement", "Premium/Discount", "Session Open",
  "News Catalyst", "Support/Resistance", "Trend Following",
]

export const MISTAKES = [
  "Impatient", "Too Late", "Too Early", "Oversized", "Undersized",
  "Revenge Trading", "FOMO", "No Plan", "Moved SL", "Broke Rules",
  "Emotional Exit", "Premature Exit", "Held Too Long",
  "Did Not Wait For POI Mitigation", "Ignored HTF Bias",
  "Poor Risk Management", "Chased Entry",
]

export const TRADING_PLANS = [
  "A+ Setup Checklist",
  "London Session Plan",
  "New York Session Plan",
  "Swing Trade Plan",
  "Scalp Plan",
]

export const EMOTIONS = [
  "Confident", "Calm", "Excited", "Fearful", "Greedy",
  "Revenge", "Impatient", "Relieved", "Frustrated", "Neutral",
  "FOMO", "Disciplined",
] as const

export const EMOTION_EMOJI: Record<string, string> = {
  Confident: "??",
  Calm: "??",
  Excited: "??",
  Fearful: "??",
  Greedy: "??",
  Revenge: "??",
  Impatient: "??",
  Relieved: "??",
  Frustrated: "??",
  Neutral: "??",
  FOMO: "??",
  Disciplined: "??",
}

export const EMOTION_COLORS: Record<string, string> = {
  Confident: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Calm: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Excited: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Fearful: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Greedy: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Revenge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Impatient: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Relieved: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Frustrated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  FOMO: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Disciplined: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
}

export const SESSIONS = ["Asia", "London", "NewYork"] as const
