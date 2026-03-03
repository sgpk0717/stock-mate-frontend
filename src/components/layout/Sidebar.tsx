import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { Term } from "@/components/ui/term"
import { cn } from "@/lib/utils"

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
  { label: "주문내역", icon: "📋", to: "/history" },
  { label: "설정", icon: "⚙️", to: "/settings" },
]

function Sidebar() {
  return (
    <aside className="hidden w-52 shrink-0 border-r bg-background md:block">
      <nav className="flex flex-col gap-1 p-3">
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
      </nav>
    </aside>
  )
}

export default Sidebar
