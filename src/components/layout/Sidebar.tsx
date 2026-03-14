import type { ReactNode } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { Term } from "@/components/ui/term"
import { cn } from "@/lib/utils"
import { useTour } from "@/hooks/use-tour"
import { alphaTourSteps } from "@/lib/tours/alpha-tour"
import { backtestTourSteps } from "@/lib/tours/backtest-tour"
import { chartTourSteps } from "@/lib/tours/chart-tour"
import { dashboardTourSteps } from "@/lib/tours/dashboard-tour"
import { dataExplorerTourSteps } from "@/lib/tours/data-explorer-tour"
import { historyTourSteps } from "@/lib/tours/history-tour"
import { orderTourSteps } from "@/lib/tours/order-tour"
import { positionsTourSteps } from "@/lib/tours/positions-tour"
import { simulationTourSteps } from "@/lib/tours/simulation-tour"
import { tradingTourSteps } from "@/lib/tours/trading-tour"
import { workflowTourSteps } from "@/lib/tours/workflow-tour"
import type { DriveStep } from "driver.js"

const TOUR_MAP: Record<string, { key: string; steps: DriveStep[] }> = {
  "/": { key: "dashboard", steps: dashboardTourSteps },
  "/chart": { key: "chart", steps: chartTourSteps },
  "/order": { key: "order", steps: orderTourSteps },
  "/positions": { key: "positions", steps: positionsTourSteps },
  "/backtest": { key: "backtest", steps: backtestTourSteps },
  "/alpha": { key: "alpha", steps: alphaTourSteps },
  "/simulation": { key: "simulation", steps: simulationTourSteps },
  "/trading": { key: "trading", steps: tradingTourSteps },
  "/workflow": { key: "workflow", steps: workflowTourSteps },
  "/data": { key: "data-explorer", steps: dataExplorerTourSteps },
  "/history": { key: "history", steps: historyTourSteps },
}

interface NavItem {
  label: ReactNode
  icon: string
  to: string
}

const navItems: NavItem[] = [
  { label: "대시보드", icon: "📊", to: "/" },
  { label: "차트", icon: "📈", to: "/chart" },
  { label: "주문", icon: "📝", to: "/order" },
  { label: <Term>포지션</Term>, icon: "💼", to: "/positions" },
  { label: <Term>백테스트</Term>, icon: "🧪", to: "/backtest" },
  { label: <Term>알파 탐색</Term>, icon: "🔬", to: "/alpha" },
  { label: <Term>시뮬레이션</Term>, icon: "🌐", to: "/simulation" },
  { label: <Term>자동매매</Term>, icon: "🤖", to: "/trading" },
  { label: <Term>워크플로우</Term>, icon: "🔄", to: "/workflow" },
  { label: "데이터 탐색", icon: "🗃️", to: "/data" },
  { label: "주문내역", icon: "📋", to: "/history" },
  { label: "설정", icon: "⚙️", to: "/settings" },
]

function TourButton() {
  const { pathname } = useLocation()
  const tourConfig = TOUR_MAP[pathname]
  const { startTour } = useTour(
    tourConfig?.key ?? "",
    tourConfig?.steps ?? [],
  )

  if (!tourConfig) return null

  return (
    <button
      onClick={startTour}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        "text-muted-foreground hover:bg-primary/10 hover:text-primary",
      )}
      title="페이지 가이드"
    >
      <span className="text-base">❓</span>
      가이드
    </button>
  )
}

function Sidebar() {
  return (
    <aside className="hidden w-52 shrink-0 self-start sticky top-14 h-[calc(100vh-3.5rem)] border-r bg-background md:block">
      <nav className="flex h-full flex-col gap-1 p-3">
        <div className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="border-t pt-2">
          <TourButton />
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
