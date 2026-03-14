import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Term } from "@/components/ui/term"

interface AnalysisResult {
  type: "technical" | "risk"
  analysis?: string
  assessment?: string
  signal?: string
  risk_level?: string
  suggestions?: string[]
  indicators?: Record<string, number>
}

interface AgentAnalysisProps {
  results: AnalysisResult[]
}

const RISK_COLORS: Record<string, string> = {
  "낮음": "text-green-600",
  "보통": "text-yellow-600",
  "높음": "text-orange-600",
  "매우 높음": "text-red-600",
}

const SIGNAL_COLORS: Record<string, string> = {
  "강력 매수": "text-red-600",
  "매수": "text-red-500",
  "중립": "text-muted-foreground",
  "매도": "text-blue-500",
  "강력 매도": "text-blue-600",
}

function AgentAnalysis({ results }: AgentAnalysisProps) {
  if (results.length === 0) return null

  return (
    <div className="space-y-3">
      {results.map((result, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {result.type === "technical" ? (
                <>
                  <Term>기술적 분석</Term>
                  {result.signal && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        SIGNAL_COLORS[result.signal] ?? "text-muted-foreground",
                      )}
                    >
                      {result.signal}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Term>리스크 평가</Term>
                  {result.risk_level && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        RISK_COLORS[result.risk_level] ?? "text-muted-foreground",
                      )}
                    >
                      {result.risk_level}
                    </span>
                  )}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* 분석 텍스트 */}
            <div className="select-text whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
              {result.analysis || result.assessment}
            </div>

            {/* 기술적 지표 요약 */}
            {result.indicators &&
              Object.keys(result.indicators).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(result.indicators).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums"
                    >
                      {key}: {typeof value === "number" ? value.toLocaleString() : value}
                    </span>
                  ))}
                </div>
              )}

            {/* 리스크 개선 제안 */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="space-y-1 pt-1">
                <p className="text-xs font-medium text-muted-foreground">
                  개선 제안
                </p>
                {result.suggestions.map((sug, j) => (
                  <p key={j} className="select-text text-xs text-foreground/70">
                    - {sug}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default AgentAnalysis
