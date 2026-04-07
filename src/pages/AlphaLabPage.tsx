import { useEffect, useRef, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Term } from "@/components/ui/term"
import AlphaFactorTable from "@/components/alpha/AlphaFactorTable"
import AlphaFactoryControl from "@/components/alpha/AlphaFactoryControl"
import CompositeFactorBuilder from "@/components/alpha/CompositeFactorBuilder"
import ImprovementHistory from "@/components/alpha/ImprovementHistory"
import { MiningDashboard } from "@/components/alpha/mining/MiningDashboard"
import {
  useAlphaFactors,
  useDeleteAlphaFactor,
  useDeleteAlphaFactorsBatch,
  usePruneFactors,
  useStartCausalValidationBatch,
  useCausalValidationStatus,
  useCancelCausalValidation,
  useBacktestWithFactor,
} from "@/hooks/queries/use-alpha"

function AlphaLabPage() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(100)
  const [sorts, setSorts] = useState<{ column: string; order: "asc" | "desc" }[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [causalFilter, setCausalFilter] = useState("")
  const [intervalFilter, setIntervalFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // 검색어 debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: factorPage, isPending: isLoadingFactors } = useAlphaFactors({
    page,
    limit: pageSize,
    sort_by: sorts.length ? sorts.map((s) => s.column).join(",") : undefined,
    order: sorts.length ? sorts.map((s) => s.order).join(",") : undefined,
    status: statusFilter || undefined,
    causal_robust: causalFilter === "" ? undefined : causalFilter === "true",
    interval: intervalFilter || undefined,
    search: debouncedSearch || undefined,
  })
  const [validationJobId, setValidationJobId] = useState<string | null>(null)
  const deleteFactor = useDeleteAlphaFactor()
  const deleteFactorsBatch = useDeleteAlphaFactorsBatch()
  const pruneMutation = usePruneFactors()
  const startValidation = useStartCausalValidationBatch()
  const { data: validationProgress } = useCausalValidationStatus(validationJobId)
  const cancelValidation = useCancelCausalValidation()
  const backtestFactor = useBacktestWithFactor()

  const factors = factorPage?.items ?? []
  const totalFactors = factorPage?.total ?? 0
  const totalPages = Math.ceil(totalFactors / pageSize)

  const handleBacktest = (factorId: string) => {
    const factor = factors.find((f) => f.id === factorId)
    const factorInterval = factor?.interval ?? "1d"
    const isIntraday = factorInterval !== "1d"
    backtestFactor.mutate(
      {
        factorId,
        data: {
          factor_id: factorId,
          start_date: "",  // 비어 있으면 백엔드가 마이닝 config에서 자동 추출
          end_date: "",
          symbols: [],
          initial_capital: 100_000_000,
          top_pct: 0.2,
          max_positions: 20,
          rebalance_freq: isIntraday ? "daily" : "weekly",
          band_threshold: 0.05,
          interval: factorInterval,
          stop_loss_pct: 0.15,
          trailing_stop_pct: 0,
          max_drawdown_pct: 0,
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

  const handleDeleteFactor = (factorId: string) => {
    if (!window.confirm("이 팩터를 삭제하시겠습니까?")) return
    deleteFactor.mutate(factorId, {
      onError: (e) => {
        console.error("Delete factor failed:", e)
      },
    })
  }

  const handleDeleteBatch = (factorIds: string[]) => {
    if (!window.confirm(`${factorIds.length}개 팩터를 삭제하시겠습니까?`)) return
    deleteFactorsBatch.mutate(factorIds, {
      onError: (e) => {
        console.error("Batch delete failed:", e)
      },
    })
  }

  const isValidating = !!validationJobId && validationProgress?.status === "running" && !validationProgress?.cancelled
  const completedAlerted = useRef<string | null>(null)

  // 검증 완료/중단 시 job_id 해제
  useEffect(() => {
    if (
      validationJobId &&
      (validationProgress?.status === "completed" || validationProgress?.cancelled) &&
      completedAlerted.current !== validationJobId
    ) {
      completedAlerted.current = validationJobId
      const p = validationProgress
      const cancelledLabel = p.cancelled ? " (사용자 중단)" : ""
      window.alert(
        `인과 검증 완료${cancelledLabel}: ${p.completed}개 검증 (robust ${p.robust}, mirage ${p.mirage}), ${p.failed}개 실패`,
      )
      setValidationJobId(null)
    }
  }, [validationJobId, validationProgress])

  const handleValidateBatch = (factorIds: string[]) => {
    startValidation.mutate(factorIds, {
      onSuccess: (res) => {
        if (res.job_id) {
          setValidationJobId(res.job_id)
        } else {
          window.alert(`인과 검증할 팩터가 없습니다. (${res.skipped}개 이미 검증됨)`)
        }
      },
      onError: (e) => {
        console.error("Batch validate failed:", e)
      },
    })
  }

  const handleSortChange = (column: string) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.column === column)
      if (idx === -1) {
        // 새 컬럼: desc로 추가
        return [...prev, { column, order: "desc" }]
      }
      const current = prev[idx]
      if (current.order === "desc") {
        // desc → asc
        const next = [...prev]
        next[idx] = { column, order: "asc" }
        return next
      }
      // asc → 제거 (중립)
      return prev.filter((_, i) => i !== idx)
    })
    setPage(0)
  }

  const handleClearSorts = () => {
    setSorts([])
    setPage(0)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(0)
  }

  const handleCausalFilterChange = (value: string) => {
    setCausalFilter(value)
    setPage(0)
  }

  const handleIntervalFilterChange = (value: string) => {
    setIntervalFilter(value)
    setPage(0)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(0)
  }

  return (
    <Tabs defaultValue="discovery" className="flex h-full flex-col p-4">
      <TabsList className="w-fit" data-tour="alpha-tabs">
        <TabsTrigger value="discovery"><Term>탐색</Term></TabsTrigger>
        <TabsTrigger value="portfolio" data-tour="alpha-portfolio-tab"><Term>포트폴리오</Term></TabsTrigger>
        <TabsTrigger value="improvement">개선 이력</TabsTrigger>
        <TabsTrigger value="dashboard">대시보드</TabsTrigger>
      </TabsList>

      {/* 탐색 탭 */}
      <TabsContent value="discovery" className="flex-1 overflow-hidden">
        <div className="flex h-full gap-4 overflow-hidden">
          {/* 좌측 패널 */}
          <div className="w-80 shrink-0 overflow-y-auto">
            <AlphaFactoryControl />
          </div>

          {/* 우측 패널 */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto" data-tour="alpha-factor-table">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                <Term>알파</Term> <Term>팩터</Term> ({totalFactors}개)
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-24 rounded border px-2 py-1 text-sm"
                  min={100}
                  step={500}
                  defaultValue={3000}
                  id="prune-limit"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById("prune-limit") as HTMLInputElement
                    const limit = Number(input?.value || 3000)
                    if (
                      !window.confirm(
                        `인터벌별 ${limit}개 초과 팩터를 정리합니다. 계속할까요?`,
                      )
                    )
                      return
                    pruneMutation.mutate(
                      { max_per_interval: limit },
                      {
                        onSuccess: (res) => {
                          window.alert(
                            `팩터 정리 완료: 총 ${res.total_pruned}개 삭제\n${Object.entries(
                              res.intervals,
                            )
                              .map(
                                ([iv, d]) =>
                                  `  ${iv}: ${d.before} -> ${d.after} (${d.pruned}개 삭제)`,
                              )
                              .join("\n")}`,
                          )
                        },
                        onError: (e) => {
                          window.alert(`팩터 정리 실패: ${e.message}`)
                        },
                      },
                    )
                  }}
                  disabled={pruneMutation.isPending}
                >
                  {pruneMutation.isPending ? "정리 중..." : "팩터 정리"}
                </Button>
              </div>
            </div>

            <AlphaFactorTable
              factors={factors}
              onDelete={handleDeleteFactor}
              onDeleteBatch={handleDeleteBatch}
              onValidateBatch={handleValidateBatch}
              onBacktest={handleBacktest}
              isValidating={isValidating || startValidation.isPending}
              validationProgress={validationProgress ?? null}
              onCancelValidation={
                validationJobId
                  ? () => cancelValidation.mutate(validationJobId)
                  : undefined
              }
              isLoading={isLoadingFactors}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              sorts={sorts}
              onSortChange={handleSortChange}
              onClearSorts={handleClearSorts}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              causalFilter={causalFilter}
              onCausalFilterChange={handleCausalFilterChange}
              intervalFilter={intervalFilter}
              onIntervalFilterChange={handleIntervalFilterChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      </TabsContent>

      {/* 포트폴리오 탭 */}
      <TabsContent value="portfolio" className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          <CompositeFactorBuilder />
        </div>
      </TabsContent>

      {/* 개선 이력 탭 */}
      <TabsContent value="improvement" className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl py-4">
          <ImprovementHistory />
        </div>
      </TabsContent>

      {/* 대시보드 탭 */}
      <TabsContent value="dashboard" className="p-4">
        <MiningDashboard />
      </TabsContent>
    </Tabs>
  )
}

export default AlphaLabPage
