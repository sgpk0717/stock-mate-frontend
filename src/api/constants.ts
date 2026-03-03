import type { OrderBook } from "@/types"

// ── 호가 생성 (클라이언트 사이드 fallback) ─────────────────
export function generateOrderBook(
  symbol: string,
  basePrice = 72800,
): OrderBook {
  const tick = basePrice < 50000 ? 50 : basePrice < 200000 ? 100 : 500

  const asks = Array.from({ length: 10 }, (_, i) => ({
    price: basePrice + tick * (i + 1),
    volume: Math.floor(Math.random() * 5000) + 100,
  }))
  const bids = Array.from({ length: 10 }, (_, i) => ({
    price: basePrice - tick * (i + 1),
    volume: Math.floor(Math.random() * 5000) + 100,
  }))

  return { symbol, asks, bids }
}
