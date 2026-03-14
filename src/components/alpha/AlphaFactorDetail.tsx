import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GlossaryText } from "@/components/ui/glossary-text"
import { Term } from "@/components/ui/term"
import CausalBadge from "@/components/alpha/CausalBadge"
import CausalDAGView from "@/components/alpha/CausalDAGView"
import FactorChat from "@/components/alpha/FactorChat"
import { useValidateFactor } from "@/hooks/queries/use-alpha"
import type { AlphaFactor, CausalValidationResponse } from "@/types/alpha"

interface AlphaFactorDetailProps {
  factor: AlphaFactor
  onBacktest: (factorId: string) => void
  onClose: () => void
}

function AlphaFactorDetail({ factor, onBacktest, onClose }: AlphaFactorDetailProps) {
  const validateMutation = useValidateFactor()
  const [causalResult, setCausalResult] = useState<CausalValidationResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)

  if (showChat) {
    return (
      <div className="rounded-lg border p-4">
        <div className="flex h-[500px] flex-col">
          <FactorChat
            factor={factor}
            onSaved={() => setShowChat(false)}
            onClose={() => setShowChat(false)}
          />
        </div>
      </div>
    )
  }

  const handleValidate = () => {
    setErrorMsg(null)
    validateMutation.mutate(factor.id, {
      onSuccess: (result) => {
        setCausalResult(result)
      },
      onError: (e) => {
        const msg = e instanceof Error ? e.message : "인과 검증에 실패했습니다"
        setErrorMsg(msg)
      },
    })
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{factor.name}</h3>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          닫기
        </button>
      </div>

      {/* 수식 */}
      <div className="mb-3 rounded bg-muted/50 p-3">
        <p className="mb-1 text-xs text-muted-foreground">수식</p>
        <code className="text-sm font-mono break-all">{factor.expression_str}</code>
      </div>

      {/* 수식 설명 */}
      <div className="mb-3">
        <p className="mb-1 text-xs text-muted-foreground">수식 설명</p>
        {factor.hypothesis && !factor.hypothesis.startsWith("Evolved from") && !factor.hypothesis.startsWith("Seed factor") ? (
          <GlossaryText text={factor.hypothesis} className="text-sm whitespace-pre-line" />
        ) : (
          <p className="text-xs text-muted-foreground italic">
            아직 한글 설명이 생성되지 않은 팩터입니다. 새로 진화시키면 한글 설명이 생성됩니다.
          </p>
        )}
      </div>

      {/* 메트릭 그리드 */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <MetricCard label={<><Term k="IC">IC</Term> Mean</>} value={factor.ic_mean} format={4} />
        <MetricCard label={<><Term k="IC">IC</Term> Std</>} value={factor.ic_std} format={4} />
        <MetricCard label={<Term>ICIR</Term>} value={factor.icir} format={2} />
        <MetricCard label={<><Term k="Net Sharpe">Net Sharpe</Term></>} value={factor.sharpe} format={2} />
        <MetricCard label={<><Term k="MDD">L/S MDD</Term></>} value={factor.max_drawdown} format={4} pct />
        <MetricCard label={<Term>Signal Flip</Term>} value={factor.turnover} format={2} />
      </div>

      {/* 세대 / 상태 / 인과 검증 */}
      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span><Term>세대</Term>: {factor.generation}</span>
        <span>상태: {factor.status}</span>
        <CausalBadge
          causalRobust={factor.causal_robust}
          effectSize={factor.causal_effect_size}
          pValue={factor.causal_p_value}
        />
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 로딩 상태 */}
      {validateMutation.isPending && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          인과 검증 진행 중... (4단계: ATE 추정 → 플라시보 → 랜덤 원인 → 체제 변화)
        </div>
      )}

      {/* 인과 검증 결과 DAG */}
      {causalResult && (
        <div className="mb-3">
          <CausalDAGView
            dagEdges={causalResult.dag_edges}
            placeboPassed={causalResult.placebo_passed}
            randomCausePassed={causalResult.random_cause_passed}
            regimeShiftPassed={causalResult.regime_shift_passed}
          />
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="text-muted-foreground"><Term>인과 효과</Term>: </span>
              <span className="font-semibold">
                {causalResult.causal_effect_size?.toFixed(6) ?? "—"}
              </span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">p-value: </span>
              <span className="font-semibold">
                {causalResult.p_value?.toFixed(4) ?? "—"}
              </span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Placebo: </span>
              <span className={causalResult.placebo_passed ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                {causalResult.placebo_passed ? "통과" : "실패"}
              </span>
              <span className="ml-1 text-muted-foreground">
                ({causalResult.placebo_effect?.toFixed(6) ?? "—"})
              </span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Random Cause: </span>
              <span className={causalResult.random_cause_passed ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                {causalResult.random_cause_passed ? "통과" : "실패"}
              </span>
              <span className="ml-1 text-muted-foreground">
                ({causalResult.random_cause_delta?.toFixed(6) ?? "—"})
              </span>
            </div>
            <div className="col-span-2 rounded border p-2">
              <span className="text-muted-foreground"><Term>국면 생존력</Term>: </span>
              <span className={causalResult.regime_shift_passed ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                {causalResult.regime_shift_passed ? "통과" : "실패"}
              </span>
              <span className="ml-2 text-muted-foreground">
                전반 ATE: {causalResult.regime_ate_first_half?.toFixed(6) ?? "—"}
                {" / "}
                후반 ATE: {causalResult.regime_ate_second_half?.toFixed(6) ?? "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleValidate}
          disabled={validateMutation.isPending}
          className="flex-1"
        >
          {validateMutation.isPending ? "검증 중..." : "인과 검증"}
        </Button>
        <Button size="sm" onClick={() => onBacktest(factor.id)} className="flex-1">
          이 팩터로 백테스트
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowChat(true)}
          className="flex-1"
        >
          AI 수정
        </Button>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  format,
  pct,
}: {
  label: React.ReactNode
  value: number | null
  format: number
  pct?: boolean
}) {
  const display = value != null
    ? pct ? `${(value * 100).toFixed(1)}%` : value.toFixed(format)
    : "—"

  return (
    <div className="rounded border p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{display}</p>
    </div>
  )
}

export default AlphaFactorDetail
