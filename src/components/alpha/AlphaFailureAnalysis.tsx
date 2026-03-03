import { Term } from "@/components/ui/term"
import type { MiningLogSummary } from "@/types/alpha"

interface AlphaFailureAnalysisProps {
  summary: MiningLogSummary
  icThreshold: number
}

function AlphaFailureAnalysis({
  summary,
  icThreshold,
}: AlphaFailureAnalysisProps) {
  if (summary.total_discovered > 0 || summary.total_attempts === 0) {
    return null
  }

  const recommendations: string[] = []

  // IC 근접 실패가 많으면 → 임계값 낮추기
  if (
    summary.total_ic_failures > 0 &&
    summary.max_ic_failed != null &&
    summary.max_ic_failed >= icThreshold * 0.5
  ) {
    const suggestedThreshold = Math.max(0.01, icThreshold * 0.6)
    recommendations.push(
      `IC 임계값을 ${suggestedThreshold.toFixed(3)}으로 낮춰보세요 (가장 가까운 IC: ${summary.max_ic_failed.toFixed(4)})`,
    )
  }

  // 반복 횟수가 적으면 → 늘리기
  if (summary.total_iterations <= 5) {
    recommendations.push(
      `반복 횟수를 ${summary.total_iterations * 2}회 이상으로 늘려보세요`,
    )
  }

  // 직교성 거부가 많으면 → 임계값 높이기
  if (
    summary.total_orthogonality_rejections > 0 &&
    summary.total_orthogonality_rejections >=
      summary.total_attempts * 0.3
  ) {
    recommendations.push(
      "직교성 임계값을 0.8 이상으로 올려보세요 (더 느슨한 필터)",
    )
  }

  // 파싱 오류가 많으면 → 모델 이슈
  if (
    summary.total_parse_errors > 0 &&
    summary.total_parse_errors >= summary.total_attempts * 0.3
  ) {
    recommendations.push(
      "파싱 오류가 빈번합니다. 시장 맥락을 더 구체적으로 입력해보세요",
    )
  }

  // 기본 권장
  if (recommendations.length === 0) {
    recommendations.push("유니버스를 변경하거나 기간을 조정해보세요")
  }

  const icPct =
    summary.total_attempts > 0
      ? Math.round((summary.total_ic_failures / summary.total_attempts) * 100)
      : 0
  const parsePct =
    summary.total_attempts > 0
      ? Math.round(
          (summary.total_parse_errors / summary.total_attempts) * 100,
        )
      : 0
  const orthPct =
    summary.total_attempts > 0
      ? Math.round(
          (summary.total_orthogonality_rejections / summary.total_attempts) *
            100,
        )
      : 0

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
      <p className="mb-2 text-sm font-semibold text-yellow-800">
        팩터를 발견하지 못했습니다
      </p>

      <p className="mb-2 text-xs text-yellow-700">
        {summary.total_iterations}회 반복, {summary.total_attempts}회
        시도에서 0개 팩터 발견
      </p>

      {/* 실패 원인 */}
      <div className="mb-2 space-y-1">
        <p className="text-xs font-medium text-yellow-800">실패 원인:</p>
        {summary.total_ic_failures > 0 && (
          <div className="ml-2 text-xs text-yellow-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 mr-1" />
            <Term k="IC">IC</Term> 미달 ({summary.total_ic_failures}회, {icPct}%)
            {summary.avg_ic_all_attempts != null && (
              <span className="ml-1 text-muted-foreground">
                평균 IC {summary.avg_ic_all_attempts.toFixed(4)}
              </span>
            )}
          </div>
        )}
        {summary.total_parse_errors > 0 && (
          <div className="ml-2 text-xs text-yellow-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400 mr-1" />
            <Term>파싱</Term>/평가 오류 ({summary.total_parse_errors}회, {parsePct}%)
          </div>
        )}
        {summary.total_orthogonality_rejections > 0 && (
          <div className="ml-2 text-xs text-yellow-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1" />
            <Term>직교성</Term> 거부 ({summary.total_orthogonality_rejections}회,{" "}
            {orthPct}%)
          </div>
        )}
      </div>

      {/* 권장 조치 */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-yellow-800">권장 조치:</p>
        {recommendations.map((rec, i) => (
          <p key={i} className="ml-2 text-xs text-yellow-700">
            {i + 1}. {rec}
          </p>
        ))}
      </div>
    </div>
  )
}

export default AlphaFailureAnalysis
