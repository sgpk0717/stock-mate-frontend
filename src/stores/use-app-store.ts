import { create } from "zustand"

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  tradingMode: "PAPER" | "REAL"
  setTradingMode: (mode: "PAPER" | "REAL") => void
  selectedSymbol: string
  setSelectedSymbol: (symbol: string) => void
  expertMode: boolean
  setExpertMode: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  tradingMode: "PAPER",
  setTradingMode: (mode) => set({ tradingMode: mode }),
  selectedSymbol: "005930",
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  expertMode: JSON.parse(localStorage.getItem("expertMode") ?? "true"),
  setExpertMode: (v) => {
    localStorage.setItem("expertMode", JSON.stringify(v))
    set({ expertMode: v })
  },
}))
