import { create } from "zustand"
import type { OrderBookEntry, RealtimeTick } from "@/types"

interface TickState {
  ticks: Record<string, RealtimeTick[]>
  orderBooks: Record<
    string,
    { currentPrice: number; asks: OrderBookEntry[]; bids: OrderBookEntry[] }
  >
  addTick: (symbol: string, tick: RealtimeTick) => void
  setOrderBook: (
    symbol: string,
    book: {
      currentPrice: number
      asks: OrderBookEntry[]
      bids: OrderBookEntry[]
    },
  ) => void
  clearSymbol: (symbol: string) => void
}

export const useTickStore = create<TickState>((set) => ({
  ticks: {},
  orderBooks: {},

  addTick: (symbol, tick) =>
    set((state) => ({
      ticks: {
        ...state.ticks,
        [symbol]: [...(state.ticks[symbol] ?? []), tick].slice(-1000),
      },
    })),

  setOrderBook: (symbol, book) =>
    set((state) => ({
      orderBooks: { ...state.orderBooks, [symbol]: book },
    })),

  clearSymbol: (symbol) =>
    set((state) => {
      const { [symbol]: _t, ...restTicks } = state.ticks
      const { [symbol]: _o, ...restBooks } = state.orderBooks
      return { ticks: restTicks, orderBooks: restBooks }
    }),
}))
