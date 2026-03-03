import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Term } from "@/components/ui/term"
import {
  useTradingContexts,
  useDeleteTradingContext,
  useStartTrading,
} from "@/hooks/queries/use-trading"
import { formatKRW } from "@/lib/format"
import { cn } from "@/lib/utils"

interface ContextPanelProps {
  mode: "paper" | "real"
}

function ContextPanel({ mode }: ContextPanelProps) {
  const { data: contexts, isLoading } = useTradingContexts()
  const deleteMutation = useDeleteTradingContext()
  const startMutation = useStartTrading()

  const filtered = contexts?.filter((c) => c.mode === mode) ?? []

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-xs text-muted-foreground">
            로딩 중...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {mode === "real" ? "실전" : "모의"} 전략 ({filtered.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            등록된 전략이 없습니다. 백테스트 결과에서 전환하세요.
          </p>
        )}
        {filtered.map((ctx) => (
          <div
            key={ctx.id}
            className="rounded-md border p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {ctx.strategy_name || "이름 없는 전략"}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  ctx.mode === "real"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                )}
              >
                {ctx.mode === "real" ? "실전" : "모의"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="block text-foreground/60"><Term>초기자본</Term></span>
                <span>{formatKRW(ctx.initial_capital)}</span>
              </div>
              <div>
                <span className="block text-foreground/60">최대포지션</span>
                <span>{ctx.max_positions}개</span>
              </div>
              <div>
                <span className="block text-foreground/60"><Term>비중</Term></span>
                <span>{(ctx.position_size_pct * 100).toFixed(0)}%</span>
              </div>
            </div>

            {ctx.symbols.length > 0 && (
              <div className="text-xs text-muted-foreground">
                종목: {ctx.symbols.slice(0, 5).join(", ")}
                {ctx.symbols.length > 5 && ` 외 ${ctx.symbols.length - 5}개`}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => startMutation.mutate(ctx.id)}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? "시작 중..." : "실행"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(ctx.id)}
                disabled={deleteMutation.isPending}
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default ContextPanel
