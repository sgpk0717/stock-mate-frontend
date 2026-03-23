import { useImprovementHistory } from "@/hooks/queries/use-alpha"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ImprovementRound,
  MetricsSnapshot,
  VerificationCriterion,
} from "@/types/alpha"

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  success: { label: "성공", variant: "default" },
  partial_success: { label: "부분 성공", variant: "secondary" },
  failure: { label: "실패", variant: "destructive" },
  pending: { label: "검증 대기", variant: "outline" },
}

function MetricsTable({
  label,
  metrics,
}: {
  label: string
  metrics: MetricsSnapshot | null
}) {
  if (!metrics) return null
  const rows: [string, string][] = [
    ["총 팩터", metrics.total_factors?.toLocaleString() ?? "-"],
    ["세대", metrics.generations?.toString() ?? "-"],
    ["avg IC", metrics.avg_ic?.toFixed(3) ?? "-"],
    ["max IC", metrics.max_ic?.toFixed(3) ?? "-"],
    ["avg ICIR", metrics.avg_icir?.toFixed(2) ?? "-"],
    ["max ICIR", metrics.max_icir?.toFixed(2) ?? "-"],
    ["volume 비중", metrics.volume_pct != null ? `${metrics.volume_pct}%` : "-"],
    ["패밀리 수", metrics.family_count?.toString() ?? "-"],
    ["인과 통과율", metrics.causal_pass_pct != null ? `${metrics.causal_pass_pct}%` : "-"],
  ]

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CriteriaList({ criteria }: { criteria: VerificationCriterion[] }) {
  return (
    <div className="space-y-1">
      {criteria.map((c, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded px-2 py-1 text-sm"
        >
          <span className="text-base">
            {c.passed === true ? "\u2705" : c.passed === false ? "\u274c" : "\u23f3"}
          </span>
          <span className="flex-1">{c.label}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {c.actual}
          </span>
          <span className="text-xs text-muted-foreground">
            (목표: {c.target})
          </span>
        </div>
      ))}
    </div>
  )
}

function RoundCard({ round }: { round: ImprovementRound }) {
  const status = STATUS_MAP[round.status] ?? STATUS_MAP.pending
  const dt = new Date(round.datetime)
  const dateStr = dt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <span className="mr-2 font-mono text-sm text-muted-foreground">
              Round {round.round}
            </span>
            {round.title}
          </CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* 진단 */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            문제 진단
          </p>
          <p>{round.diagnosis.summary}</p>
        </div>

        <MetricsTable label="변경 전 지표" metrics={round.diagnosis.metrics_before} />

        {/* 변경 내용 */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            변경 내용
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            {round.changes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        {/* 수정 파일 */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            수정 파일
          </p>
          <div className="space-y-0.5">
            {round.files_modified.map((f, i) => (
              <p key={i} className="font-mono text-xs text-muted-foreground">
                {f}
              </p>
            ))}
          </div>
        </div>

        {/* 검증 결과 */}
        {round.verification.metrics_after && (
          <MetricsTable
            label={`변경 후 지표 (${round.verification.cycles_elapsed}사이클, ${round.verification.generations_range})`}
            metrics={round.verification.metrics_after}
          />
        )}

        {round.verification.criteria.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              검증 기준
            </p>
            <CriteriaList criteria={round.verification.criteria} />
          </div>
        )}

        {/* 교훈 */}
        {round.lesson && (
          <div className="rounded-lg border-l-4 border-primary/30 bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              교훈
            </p>
            <p className="mt-1 text-sm">{round.lesson}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ImprovementHistory() {
  const { data, isLoading } = useImprovementHistory()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  const rounds = data?.rounds ?? []

  if (rounds.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        아직 개선 이력이 없습니다.
        <br />
        <span className="text-xs">
          /improve-mining 스킬을 실행하면 여기에 기록됩니다.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">마이닝 개선 이력</h2>
        <span className="text-sm text-muted-foreground">
          총 {rounds.length}개 라운드
        </span>
      </div>
      {[...rounds].reverse().map((round) => (
        <RoundCard key={round.round} round={round} />
      ))}
    </div>
  )
}
