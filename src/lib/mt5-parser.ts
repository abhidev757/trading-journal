import { createWorker } from "tesseract.js"

export interface ExtractedMT5Trade {
  instrument?: string
  direction?: "Buy" | "Sell"
  lotSize?: string
  entryPrice?: string
  exitPrice?: string
  stopLoss?: string
  takeProfit?: string
  entryDate?: string // YYYY-MM-DD
  entryTime?: string // HH:mm
  exitDate?: string // YYYY-MM-DD
  exitTime?: string // HH:mm
  netPnl?: string
  fees?: string
  swap?: string
  rawText?: string
}

export function parseMT5Text(text: string): ExtractedMT5Trade {
  const result: ExtractedMT5Trade = { rawText: text }

  // 1. Symbol, direction, lot size
  // e.g. "XAUUSD, sell 0.02" or "EURUSD buy 1.00" or "US30.cash, buy 0.5"
  const symbolDirMatch = text.match(/([A-Z0-9.\-_]{3,12})[\s,]+(buy|sell)\s+([0-9.]+)/i)
  if (symbolDirMatch) {
    result.instrument = symbolDirMatch[1].toUpperCase()
    result.direction = symbolDirMatch[2].toLowerCase() === "buy" ? "Buy" : "Sell"
    result.lotSize = symbolDirMatch[3]
  }

  // 2. Open Date & Time
  // e.g. "Open: 2026.11.12 09:53:19" or "Open 2026-11-12 09:53"
  const openMatch = text.match(/Open:?\s*(\d{4})[./-](\d{2})[./-](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/i)
  if (openMatch) {
    result.entryDate = `${openMatch[1]}-${openMatch[2]}-${openMatch[3]}`
    result.entryTime = `${openMatch[4]}:${openMatch[5]}`
  }

  // 3. Close Date & Time
  // Often on top right or first line: "2026.11.12 10:49:46"
  const allDateMatches = [...text.matchAll(/(\d{4})[./-](\d{2})[./-](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/g)]
  for (const m of allDateMatches) {
    const dStr = `${m[1]}-${m[2]}-${m[3]}`
    const tStr = `${m[4]}:${m[5]}`
    if (dStr !== result.entryDate || tStr !== result.entryTime) {
      result.exitDate = dStr
      result.exitTime = tStr
      break
    }
  }

  // 4. Prices and PnL
  // In MT5, the second row typically contains:
  // [entryPrice] [arrow/dash] [exitPrice] [profit/loss]
  // e.g. "3 962.29 -> 3 938.03 48.52" or "28 155.65 — 28 094.00 -30.83"
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const priceLine = lines.find((l) =>
    /(?:—|–|->|→|\s+-\s+)/.test(l) ||
    (/\d+\.\d+/.test(l) && !l.includes("Open:") && !l.includes("S/L") && !l.includes("T/P") && !l.toLowerCase().includes("buy") && !l.toLowerCase().includes("sell"))
  )

  if (priceLine) {
    const parts = priceLine.split(/\s*(?:—|–|->|→|\s+-\s+)\s*/)
    if (parts.length >= 2) {
      result.entryPrice = parts[0].replace(/\s+/g, "")
      const right = parts[1].trim()
      const matches = [...right.matchAll(/([+-]?\s*[\d\s]+\.\d+)/g)]
      if (matches.length >= 2) {
        result.exitPrice = matches[0][1].replace(/\s+/g, "")
        const profitVal = parseFloat(matches[1][1].replace(/\s+/g, ""))
        if (!isNaN(profitVal)) {
          result.netPnl = profitVal.toFixed(2)
        }
      } else if (matches.length === 1) {
        result.exitPrice = matches[0][1].replace(/\s+/g, "")
      } else {
        result.exitPrice = right.replace(/\s+/g, "")
      }
    }
  }

  // Fallback for netPnl if OCR wrapped profit to another line
  if (!result.netPnl) {
    for (const l of lines) {
      if (/^[+-]?\s*\d+\.\d+$/.test(l) && !l.includes(":") && !l.startsWith("#")) {
        const val = parseFloat(l.replace(/\s+/g, ""))
        if (!isNaN(val)) {
          result.netPnl = val.toFixed(2)
          break
        }
      }
    }
  }

  // 5. Stop Loss (S/L or S / L)
  const slMatch = text.match(/S\s*\/\s*L:?\s*([0-9\s]+(?:\.[0-9]+)?)/i)
  if (slMatch) {
    result.stopLoss = slMatch[1].replace(/\s+/g, "")
  }

  // 6. Take Profit (T/P or T / P)
  const tpMatch = text.match(/T\s*\/\s*P:?\s*([0-9\s]+(?:\.[0-9]+)?)/i)
  if (tpMatch) {
    result.takeProfit = tpMatch[1].replace(/\s+/g, "")
  }

  // 7. Swap
  const swapMatch = text.match(/Swap:?\s*(-?[0-9\s]+(?:\.[0-9]+)?)/i)
  if (swapMatch) {
    const swapVal = parseFloat(swapMatch[1].replace(/\s+/g, ""))
    if (!isNaN(swapVal)) {
      result.swap = swapVal.toFixed(2)
    }
  }

  // 8. Commission / Fees
  const commMatch = text.match(/Commission:?\s*(-?[0-9\s]+(?:\.[0-9]+)?)/i)
  if (commMatch) {
    const val = parseFloat(commMatch[1].replace(/\s+/g, ""))
    if (!isNaN(val)) {
      result.fees = Math.abs(val).toFixed(2)
    }
  }

  return result
}

export async function extractTradeFromScreenshot(
  imageSource: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<ExtractedMT5Trade> {
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  try {
    const ret = await worker.recognize(imageSource)
    return parseMT5Text(ret.data.text)
  } finally {
    await worker.terminate()
  }
}
