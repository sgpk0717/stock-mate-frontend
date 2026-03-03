import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Term } from "@/components/ui/term"
import AlphaMineConfig from "@/components/alpha/AlphaMineConfig"
import AlphaMineProgress from "@/components/alpha/AlphaMineProgress"
import AlphaFactorTable from "@/components/alpha/AlphaFactorTable"
import AlphaFactorDetail from "@/components/alpha/AlphaFactorDetail"
import AlphaMineHistory from "@/components/alpha/AlphaMineHistory"
import AlphaFactoryControl from "@/components/alpha/AlphaFactoryControl"
import FactorLineageTree from "@/components/alpha/FactorLineageTree"
import CompositeFactorBuilder from "@/components/alpha/CompositeFactorBuilder"
import {
  useStartAlphaMining,
  useAlphaMiningRun,
  useAlphaMiningRuns,
  useDeleteAlphaMiningRun,
  useAlphaFactors,
  useDeleteAlphaFactor,
  useBacktestWithFactor,
} from "@/hooks/queries/use-alpha"
import type {
  AlphaFactor,
  AlphaMineRequest,
  AlphaMiningRunSummary,
} from "@/types/alpha"

const EMPTY_FACTORS: AlphaFactor[] = []
const EMPTY_RUNS: AlphaMiningRunSummary[] = []

function AlphaLabPage() {
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [selectedFactor, setSelectedFactor] = useState<AlphaFactor | null>(null)

  const startMining = useStartAlphaMining()
  const { data: activeRun } = useAlphaMiningRun(activeRunId)
  const { data: miningRuns = EMPTY_RUNS } = useAlphaMiningRuns()
  const deleteMiningRun = useDeleteAlphaMiningRun()
  const { data: factors = EMPTY_FACTORS } = useAlphaFactors()
  const deleteFactor = useDeleteAlphaFactor()
  const backtestFactor = useBacktestWithFactor()

  const handleStart = (config: AlphaMineRequest) => {
    startMining.mutate(config, {
      onSuccess: (res) => {
        setActiveRunId(res.id)
      },
      onError: (e) => {
        console.error("Mining start failed:", e)
      },
    })
  }

  const handleBacktest = (factorId: string) => {
    backtestFactor.mutate(
      {
        factorId,
        data: {
          factor_id: factorId,
          buy_threshold: 0.0,
          sell_threshold: 0.0,
          start_date: "2024-01-01",
          end_date: "2025-12-31",
          symbols: [],
          initial_capital: 100_000_000,
          position_size_pct: 0.1,
          max_positions: 10,
        },
      },
      {
        onSuccess: (res) => {
          window.alert(
            `백테스트가 시작되었습니다.\nRun ID: ${res.backtest_run_id}\n백테스트 페이지에서 결과를 확인하세요.`,
          )
        },
        onError: (e) => {
          console.error("Factor backtest failed:", e)
        },
      },
    )
  }

  const handleDeleteRun = (runId: string) => {
    if (
      !window.confirm(
        "이 마이닝 실행을 삭제하시겠습니까? 관련 팩터도 함께 삭제됩니다.",
      )
    )
      return
    deleteMiningRun.mutate(runId, {
      onError: (e) => {
        console.error("Delete mining run failed:", e)
      },
    })
  }

  const handleDeleteFactor = (factorId: string) => {
    if (!window.confirm("이 팩터를 삭제하시겠습니까?")) return
    deleteFactor.mutate(factorId, {
      onError: (e) => {
        console.error("Delete factor failed:", e)
      },
    })
  }

  // 계보가 있는 팩터 (parent_ids 존재)
  const factorsWithLineage = factors.filter(
    (f) => f.parent_ids && f.parent_ids.length > 0,
  )

  return (
    <Tabs defaultValue="discovery" className="flex h-full flex-col p-4">
      <TabsList className="w-fit">
        <TabsTrigger value="discovery"><Term>탐색</Term></TabsTrigger>
        <TabsTrigger value="factory">공장</TabsTrigger>
        <TabsTrigger value="portfolio"><Term>포트폴리오</Term></TabsTrigger>
      </TabsList>

      {/* 탐색 탭 */}
      <TabsContent value="discovery" className="flex-1 overflow-hidden">
        <div className="flex h-full gap-4 overflow-hidden">
          {/* 좌측 패널 */}
          <div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
            <AlphaMineConfig
              onStart={handleStart}
              isLoading={startMining.isPending}
            />
            {activeRun && <AlphaMineProgress run={activeRun} />}
            <AlphaMineHistory
              runs={miningRuns}
              onSelect={(runId) => setActiveRunId(runId)}
              onDelete={handleDeleteRun}
            />
          </div>

          {/* 우측 패널 */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                <Term>알파</Term> <Term>팩터</Term> ({factors.length}개)
              </h2>
            </div>

            <AlphaFactorTable
              factors={factors}
              onSelect={(f) => setSelectedFactor(f)}
              onDelete={handleDeleteFactor}
            />

            {selectedFactor && (
              <AlphaFactorDetail
                factor={selectedFactor}
                onBacktest={handleBacktest}
                onClose={() => setSelectedFactor(null)}
              />
            )}
          </div>
        </div>
      </TabsContent>

      {/* 공장 탭 */}
      <TabsContent value="factory" className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6">
          <AlphaFactoryControl />

          {/* 팩터 계보 트리 */}
          {factorsWithLineage.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold"><Term>팩터</Term> <Term>계보</Term></h3>
              <FactorLineageTree
                factors={factors}
                onSelect={(f) => setSelectedFactor(f)}
              />
            </div>
          )}

          {/* 발견된 팩터 목록 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              발견된 <Term>팩터</Term> ({factors.length}개)
            </h3>
            <AlphaFactorTable
              factors={factors}
              onSelect={(f) => setSelectedFactor(f)}
              onDelete={handleDeleteFactor}
            />
          </div>

          {selectedFactor && (
            <AlphaFactorDetail
              factor={selectedFactor}
              onBacktest={handleBacktest}
              onClose={() => setSelectedFactor(null)}
            />
          )}
        </div>
      </TabsContent>

      {/* 포트폴리오 탭 */}
      <TabsContent value="portfolio" className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          <CompositeFactorBuilder />
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default AlphaLabPage
