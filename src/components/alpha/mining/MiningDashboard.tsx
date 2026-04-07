import { useState } from "react"
import { useMiningReport, useMiningReports } from "@/hooks/queries/use-alpha"
import { ExecutiveSummary } from "./ExecutiveSummary"
import { NicheDonut } from "./NicheDonut"
import { IcTrendChart } from "./IcTrendChart"
import { FunnelChart } from "./FunnelChart"
import { CoverageHistogram } from "./CoverageHistogram"
import { FeatureUsageGrid } from "./FeatureUsageGrid"
import { OperatorChart } from "./OperatorChart"
import { DiscoveryRateTrend } from "./DiscoveryRateTrend"
import { FamilyHeatmap } from "./FamilyHeatmap"
import { OperatorTrend } from "./OperatorTrend"
import { SaturationCurve } from "./SaturationCurve"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ViewMode = "latest" | "range"

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-100 rounded-lg" />
      <div className="h-28 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-gray-100 rounded-lg" />
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}

export function MiningDashboard() {
  const [interval, setInterval_] = useState("1d")
  const [viewMode, setViewMode] = useState<ViewMode>("latest")
  const [genFrom, setGenFrom] = useState<number | undefined>()
  const [genTo, setGenTo] = useState<number | undefined>()
  // 조회 버튼을 눌러야만 쿼리가 실행되도록 확정된 범위를 별도 관리
  const [committedFrom, setCommittedFrom] = useState<number | undefined>()
  const [committedTo, setCommittedTo] = useState<number | undefined>()

  const latestQuery = useMiningReport(interval)
  const rangeQuery = useMiningReports({
    interval,
    gen_from: viewMode === "range" ? committedFrom : undefined,
    gen_to: viewMode === "range" ? committedTo : undefined,
  })

  const handleSearch = () => {
    setCommittedFrom(genFrom)
    setCommittedTo(genTo)
  }

  const latestData = latestQuery.data
  const rangeData = rangeQuery.data
  const latestGen = latestData?.generation ?? 0
  // 슬라이더 범위: 리포트 DB의 실제 min/max 세대 (API 응답), fallback은 ic_trend
  const reportMinGen = rangeData?.min_gen || 0
  const reportMaxGen = rangeData?.max_gen || 0
  const minGen = reportMinGen > 0 ? reportMinGen : (latestData?.ic_trend?.length ? Math.min(...latestData.ic_trend.map((t) => t.gen)) : latestGen || 1)
  const maxGen = reportMaxGen > 0 ? reportMaxGen : latestGen

  // 인터벌 변경 시 세대 범위 리셋
  const handleIntervalChange = (iv: string) => {
    setInterval_(iv)
    setGenFrom(undefined)
    setGenTo(undefined)
    setCommittedFrom(undefined)
    setCommittedTo(undefined)
  }

  const handleLatestClick = () => setViewMode("latest")
  const handleRangeClick = () => {
    setViewMode("range")
    if (latestGen && genFrom == null) {
      const from = Math.max(minGen, latestGen - 10)
      setGenFrom(from)
      setGenTo(latestGen)
      // 초기 진입 시 자동 조회 (min/max 세대 파악용)
      setCommittedFrom(from)
      setCommittedTo(latestGen)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {["1d", "5m"].map((iv) => (
            <button
              key={iv}
              onClick={() => handleIntervalChange(iv)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                interval === iv
                  ? "bg-[#4056F4] text-white border-[#4056F4]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {iv === "1d" ? "일봉" : "5분봉"}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex gap-1">
          <button
            onClick={handleLatestClick}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              viewMode === "latest"
                ? "bg-[#4056F4] text-white border-[#4056F4]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            최신
          </button>
          <button
            onClick={handleRangeClick}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              viewMode === "range"
                ? "bg-[#4056F4] text-white border-[#4056F4]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            세대 범위
          </button>
        </div>

        {(latestQuery.isFetching || rangeQuery.isFetching) && (
          <span className="text-xs text-blue-400 ml-auto">데이터 로딩 중...</span>
        )}
      </div>

      {/* Range Slider — 별도 행 */}
      {viewMode === "range" && maxGen > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 select-none shrink-0 w-12 text-right">Gen {Math.max(genFrom ?? minGen, minGen)}</span>
          <div className="relative flex-1 h-6 flex items-center">
            <div className="absolute inset-x-0 h-1.5 bg-gray-200 rounded-full" />
            <div
              className="absolute h-1.5 bg-[#4056F4] rounded-full"
              style={{
                left: `${((Math.max(genFrom ?? minGen, minGen) - minGen) / Math.max(maxGen - minGen, 1)) * 100}%`,
                right: `${100 - (((genTo ?? maxGen) - minGen) / Math.max(maxGen - minGen, 1)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={minGen}
              max={maxGen}
              value={Math.max(genFrom ?? minGen, minGen)}
              onChange={(e) => {
                const v = Number(e.target.value)
                setGenFrom(Math.min(v, (genTo ?? maxGen) - 1))
              }}
              onMouseUp={handleSearch}
              onTouchEnd={handleSearch}
              className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4056F4] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <input
              type="range"
              min={minGen}
              max={maxGen}
              value={genTo ?? maxGen}
              onChange={(e) => {
                const v = Number(e.target.value)
                setGenTo(Math.max(v, (genFrom ?? minGen) + 1))
              }}
              onMouseUp={handleSearch}
              onTouchEnd={handleSearch}
              className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E3B23C] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <span className="text-xs text-gray-500 select-none shrink-0 w-12">Gen {genTo ?? maxGen}</span>
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 text-sm rounded-md bg-[#4056F4] text-white hover:bg-[#3348d4] transition-colors shrink-0"
          >
            조회
          </button>
        </div>
      )}

      {/* Latest View */}
      {viewMode === "latest" && (
        <>
          {latestQuery.isLoading ? (
            <DashboardSkeleton />
          ) : !latestData || !latestData.generation ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2 select-none">
              <span>마이닝 데이터가 없습니다.</span>
              <span className="text-sm">Factory를 실행하면 여기에 대시보드가 표시됩니다.</span>
            </div>
          ) : (
            <>
              <ExecutiveSummary data={latestData} />
              <div className="grid grid-cols-2 gap-4">
                <NicheDonut distribution={latestData.family_distribution} delta={latestData.family_delta} />
                <IcTrendChart data={latestData.ic_trend} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FunnelChart data={latestData.funnel} discovered={latestData.discovered_factors.length} />
                <CoverageHistogram data={latestData.coverage_health} />
              </div>
              <FeatureUsageGrid usage={latestData.derived_feature_usage} />
              <div className="grid grid-cols-2 gap-4">
                <OperatorChart stats={latestData.operator_stats} />
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">상위 팩터</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {latestData.discovered_factors.slice(0, 5).map((f, i) => (
                      <div key={i} className="border rounded p-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">IC {f.ic_mean.toFixed(4)}</span>
                          <span>Sharpe {f.sharpe.toFixed(2)}</span>
                        </div>
                        <code className="text-xs text-gray-600 block mt-1 truncate">{f.expression}</code>
                      </div>
                    ))}
                    {latestData.discovered_factors.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-4">이번 세대에서 발견된 팩터 없음</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* Range View */}
      {viewMode === "range" && (
        <>
          {rangeQuery.isLoading ? (
            <DashboardSkeleton />
          ) : !rangeData || !rangeData.reports.length ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2 select-none">
              <span>선택한 범위에 데이터가 없습니다.</span>
              <span className="text-sm">세대 범위를 입력하고 조회하세요.</span>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500">
                {rangeData.interval} · Gen {rangeData.reports[0].generation} ~ {rangeData.reports[rangeData.reports.length - 1].generation} · {rangeData.total}개 세대
              </div>
              <div className="grid grid-cols-2 gap-4">
                <IcTrendChart data={rangeData.reports.map((r) => {
                  const matching = r.ic_trend.find((t) => t.gen === r.generation)
                  return matching ?? { gen: r.generation, avg_ic: 0, best_ic: 0, avg_icir: 0, factor_count: 0 }
                })} />
                <DiscoveryRateTrend reports={rangeData.reports} />
              </div>
              <FamilyHeatmap reports={rangeData.reports} />
              <div className="grid grid-cols-2 gap-4">
                <OperatorTrend reports={rangeData.reports} />
                <SaturationCurve reports={rangeData.reports} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
