import { useEffect, useRef } from "react"
import { GlossaryText } from "@/components/ui/glossary-text"
import type { IterationLog, MiningLogSummary } from "@/types/alpha"

interface AlphaMiningLogProps {
  iterations: IterationLog[]
  summary: MiningLogSummary | null
  icThreshold?: number
}

function AlphaMiningLog({
  iterations,
  summary,
  icThreshold = 0.03,
}: AlphaMiningLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 새 iteration 추가 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [iterations.length])

  if (iterations.length === 0 && !summary) {
    return null
  }

  return (
    <div className="rounded-lg border">
      {/* 요약 헤더 */}
      {summary && summary.total_iterations > 0 && (
        <div className="border-b px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            {summary.total_iterations}회 반복 · {summary.total_attempts}회 시도
            · {summary.total_discovered}개 발견
            {summary.avg_ic_all_attempts != null && (
              <> · 평균 IC {summary.avg_ic_all_attempts.toFixed(4)}</>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {summary.total_ic_failures > 0 && (
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-600">
                IC미달 {summary.total_ic_failures}
              </span>
            )}
            {summary.total_parse_errors > 0 && (
              <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-600">
                파싱오류 {summary.total_parse_errors}
              </span>
            )}
            {summary.total_orthogonality_rejections > 0 && (
              <span className="rounded bg-yellow-50 px-1.5 py-0.5 text-[10px] text-yellow-700">
                직교성거부 {summary.total_orthogonality_rejections}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Iteration 리스트 */}
      <div
        ref={scrollRef}
        className="max-h-[400px] overflow-y-auto px-3 py-2 space-y-3"
      >
        {iterations.map((it) => (
          <IterationEntry
            key={it.iteration}
            log={it}
            icThreshold={icThreshold}
          />
        ))}
      </div>
    </div>
  )
}

function IterationEntry({
  log,
  icThreshold,
}: {
  log: IterationLog
  icThreshold: number
}) {
  const isDiscovered = log.discovered_factor_name != null

  return (
    <div
      className={`rounded border p-2 text-xs ${
        isDiscovered
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-gray-200"
      }`}
    >
      {/* 가설 헤더 */}
      <div className="mb-1 flex items-start gap-1.5">
        <span className="shrink-0 font-mono text-muted-foreground">
          #{log.iteration}
        </span>
        <span className="text-muted-foreground">가설:</span>
        <GlossaryText text={log.hypothesis} className="break-all" />
      </div>

      {/* Attempts */}
      {log.attempts.length > 0 && (
        <div className="ml-4 space-y-0.5">
          {log.attempts.map((attempt, i) => {
            const isLast = i === log.attempts.length - 1
            const prefix = isLast ? "└─" : "├─"

            let colorClass = "text-red-600"
            let bgClass = ""
            if (attempt.outcome === "discovered") {
              colorClass = "text-emerald-600"
              bgClass = "bg-emerald-50"
            } else if (
              attempt.ic_mean != null &&
              attempt.ic_mean >= icThreshold * 0.5
            ) {
              colorClass = "text-yellow-600"
            }

            return (
              <div key={i} className={`flex items-start gap-1 ${bgClass}`}>
                <span className="shrink-0 font-mono text-muted-foreground">
                  {prefix}
                </span>
                <span className="text-muted-foreground">
                  depth {attempt.depth}:
                </span>
                <span className={colorClass}>
                  {attempt.outcome === "discovered" && "발견!"}
                  {attempt.outcome === "ic_below_threshold" && (
                    <>
                      IC={attempt.ic_mean?.toFixed(4)} {"<"}{" "}
                      {icThreshold.toFixed(2)}
                    </>
                  )}
                  {attempt.outcome === "orthogonality_rejected" && (
                    <>
                      IC={attempt.ic_mean?.toFixed(4)} OK · 직교성=
                      {attempt.orthogonality_max_corr?.toFixed(2)} 거부
                    </>
                  )}
                  {attempt.outcome === "parse_error" && "파싱 실패"}
                  {attempt.outcome === "eval_error" &&
                    `평가 실패${attempt.error_message ? `: ${attempt.error_message.slice(0, 60)}` : ""}`}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* 수식 (마지막 attempt의 expression) */}
      {log.attempts.length > 0 && (
        <div className="mt-1 ml-4">
          <code className="break-all text-[10px] text-muted-foreground">
            {log.attempts[0].expression_str}
          </code>
        </div>
      )}

      {/* 발견 표시 */}
      {isDiscovered && (
        <div className="mt-1 ml-4 font-medium text-emerald-600">
          발견: {log.discovered_factor_name}
        </div>
      )}
    </div>
  )
}

export default AlphaMiningLog
