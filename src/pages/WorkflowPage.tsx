import { useState } from "react"
import {
  useWorkflowStatus,
  useWorkflowHistory,
  useWorkflowEvents,
  useBestFactors,
  useTriggerWorkflow,
} from "@/hooks/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatPercent } from "@/lib/format"

const PHASE_COLORS: Record<string, string> = {
  IDLE: "bg-gray-100 text-gray-700",
  PRE_MARKET: "bg-blue-100 text-blue-700",
  TRADING: "bg-green-100 text-green-700",
  MARKET_CLOSE: "bg-yellow-100 text-yellow-700",
  REVIEW: "bg-purple-100 text-purple-700",
  MINING: "bg-indigo-100 text-indigo-700",
  EMERGENCY_STOP: "bg-red-100 text-red-700",
}

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  FAILED: "bg-red-100 text-red-700",
  STOPPED: "bg-red-100 text-red-700",
  SKIPPED: "bg-yellow-100 text-yellow-700",
  NO_RUN: "bg-gray-100 text-gray-500",
}

function WorkflowPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const { data: status } = useWorkflowStatus()
  const { data: history } = useWorkflowHistory()
  const { data: bestFactors } = useBestFactors()
  const { data: events } = useWorkflowEvents(selectedRunId)
  const trigger = useTriggerWorkflow()

  const handleTrigger = (phase: string) => {
    if (phase === "emergency_stop") {
      if (!window.confirm("긴급 정지를 실행하시겠습니까? 모든 포지션이 청산됩니다.")) return
    }
    trigger.mutate(phase)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between" data-tour="wf-header">
        <h1 className="text-2xl font-bold">자동매매 워크플로우</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleTrigger("emergency_stop")}
          disabled={trigger.isPending}
        >
          긴급 정지
        </Button>
      </div>

      {/* 상태 카드 3열 */}
      <div className="grid grid-cols-3 gap-4" data-tour="wf-status-cards">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              현재 Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={PHASE_COLORS[status?.phase ?? "IDLE"] ?? ""}>
              {status?.phase ?? "IDLE"}
            </Badge>
            {status?.date && (
              <p className="mt-1 text-xs text-muted-foreground">
                {status.date}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              오늘 PnL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                (status?.pnl_pct ?? 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {status?.pnl_pct != null
                ? formatPercent(status.pnl_pct)
                : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              거래 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{status?.trade_count ?? 0}건</p>
          </CardContent>
        </Card>
      </div>

      {/* 팩터 + 마이닝 2열 */}
      <div className="grid grid-cols-2 gap-4" data-tour="wf-factor-info">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">최적 팩터</CardTitle>
          </CardHeader>
          <CardContent>
            {bestFactors && bestFactors.length > 0 ? (
              <div className="space-y-2">
                {bestFactors.slice(0, 3).map((f) => (
                  <div
                    key={f.factor_id}
                    className="rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{f.factor_name}</span>
                      <Badge variant="outline">
                        {f.composite_score.toFixed(3)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {f.expression_str}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span>IC: {f.ic_mean?.toFixed(4) ?? "-"}</span>
                      <span>Sharpe: {f.sharpe?.toFixed(2) ?? "-"}</span>
                      <span>MDD: {f.max_drawdown?.toFixed(2) ?? "-"}%</span>
                      {f.causal_robust != null && (
                        <span>
                          {f.causal_robust ? "인과 통과" : "인과 미통과"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                매매 가능한 팩터 없음
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">마이닝 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  status?.mining_running ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-sm">
                {status?.mining_running ? "실행 중" : "중지"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              사이클: {status?.mining_cycles ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">
              발견 팩터: {status?.mining_factors ?? 0}개
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 수동 트리거 버튼 */}
      <Card data-tour="wf-manual-triggers">
        <CardHeader>
          <CardTitle className="text-sm">수동 트리거</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["pre_market", "market_open", "market_close", "review", "mining"].map(
            (phase) => (
              <Button
                key={phase}
                variant="outline"
                size="sm"
                onClick={() => handleTrigger(phase)}
                disabled={trigger.isPending}
              >
                {phase}
              </Button>
            ),
          )}
        </CardContent>
      </Card>

      {/* 히스토리 테이블 */}
      <Card data-tour="wf-history">
        <CardHeader>
          <CardTitle className="text-sm">히스토리 (최근 30일)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>PnL</TableHead>
                <TableHead>거래수</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRunId(run.id)}
                >
                  <TableCell className="font-mono text-xs">
                    {run.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        PHASE_COLORS[run.phase] ?? "bg-gray-100 text-gray-700"
                      }
                    >
                      {run.phase}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      (run.pnl_pct ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {run.pnl_pct != null ? formatPercent(run.pnl_pct) : "-"}
                  </TableCell>
                  <TableCell>{run.trade_count}건</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        STATUS_COLORS[run.status] ?? ""
                      }
                    >
                      {run.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!history || history.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    워크플로우 기록 없음
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 이벤트 로그 */}
      {selectedRunId && (
        <Card data-tour="wf-events">
          <CardHeader>
            <CardTitle className="text-sm">
              이벤트 로그
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {selectedRunId.slice(0, 8)}...
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {events?.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex gap-3 rounded px-2 py-1 text-xs hover:bg-muted/50"
                  >
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {evt.created_at
                        ? new Date(evt.created_at).toLocaleTimeString("ko-KR")
                        : ""}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {evt.event_type}
                    </Badge>
                    <span className="truncate">{evt.message}</span>
                  </div>
                ))}
                {(!events || events.length === 0) && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    이벤트 없음
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default WorkflowPage
