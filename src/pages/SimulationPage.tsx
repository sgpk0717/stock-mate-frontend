import { useCallback, useState } from "react"
import StressTestConfig from "@/components/simulation/StressTestConfig"
import StressTestProgress from "@/components/simulation/StressTestProgress"
import PriceChart from "@/components/simulation/PriceChart"
import LOBVisualization from "@/components/simulation/LOBVisualization"
import StressMetrics from "@/components/simulation/StressMetrics"
import StressTestHistory from "@/components/simulation/StressTestHistory"
import McpDashboard from "@/components/simulation/McpDashboard"
import { cn } from "@/lib/utils"
import {
  useStartStressTest,
  useStressTest,
} from "@/hooks/queries"
import type { StressTestRequest } from "@/types/simulation"

type Tab = "stress" | "mcp"

function SimulationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("stress")

  // 스트레스 테스트 상태
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const { data: activeRun } = useStressTest(activeRunId)
  const startMutation = useStartStressTest()

  function handleStart(req: StressTestRequest) {
    startMutation.mutate(req, {
      onSuccess: (res) => setActiveRunId(res.id),
    })
  }

  function handleSelectRun(runId: string) {
    setActiveRunId(runId)
  }

  const handleCompleted = useCallback(() => {
    // WebSocket에서 완료 수신 시 refetch 트리거
  }, [])

  const isRunning =
    startMutation.isPending ||
    activeRun?.status === "PENDING" ||
    activeRun?.status === "RUNNING"

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">시뮬레이션</h1>

      {/* 탭 */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("stress")}
          className={cn(
            "px-4 py-2 text-sm transition-colors",
            activeTab === "stress"
              ? "border-b-2 border-primary font-medium text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          스트레스 테스트
        </button>
        <button
          onClick={() => setActiveTab("mcp")}
          className={cn(
            "px-4 py-2 text-sm transition-colors",
            activeTab === "mcp"
              ? "border-b-2 border-primary font-medium text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          MCP 대시보드
        </button>
      </div>

      {/* 스트레스 테스트 탭 */}
      {activeTab === "stress" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* 왼쪽: 설정 + 결과 */}
          <div className="space-y-6">
            <StressTestConfig onStart={handleStart} isRunning={isRunning} />

            {/* 진행률 */}
            <StressTestProgress
              runId={activeRunId}
              status={activeRun?.status ?? null}
              onCompleted={handleCompleted}
            />

            {/* 에러 메시지 */}
            {activeRun?.status === "FAILED" && activeRun.error_message && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
                {activeRun.error_message}
              </div>
            )}

            {/* 결과 */}
            {activeRun?.status === "COMPLETED" && (
              <>
                <StressMetrics metrics={activeRun.metrics} />
                <PriceChart results={activeRun.results} />
                <LOBVisualization results={activeRun.results} />
              </>
            )}
          </div>

          {/* 오른쪽: 실행 기록 */}
          <div>
            <StressTestHistory
              selectedRunId={activeRunId}
              onSelectRun={handleSelectRun}
            />
          </div>
        </div>
      )}

      {/* MCP 대시보드 탭 */}
      {activeTab === "mcp" && <McpDashboard />}
    </div>
  )
}

export default SimulationPage
