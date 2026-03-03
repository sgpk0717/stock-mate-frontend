import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/stores/use-app-store"

function Header() {
  const tradingMode = useAppStore((s) => s.tradingMode)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary">Stock Mate</h1>
          <Badge
            variant={tradingMode === "PAPER" ? "secondary" : "destructive"}
            className="text-xs"
          >
            {tradingMode === "PAPER" ? "Paper" : "Real"}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">서버 연결됨</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
