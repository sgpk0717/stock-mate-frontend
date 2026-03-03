import { Term } from "@/components/ui/term"

interface CausalDAGViewProps {
  dagEdges: { from: string; to: string }[]
  placeboPassed: boolean
  randomCausePassed: boolean
  regimeShiftPassed?: boolean
}

// 고정 노드 위치 (SVG 좌표)
const NODES: Record<string, { x: number; y: number; label: string }> = {
  market_return: { x: 80, y: 40, label: "시장수익률" },
  market_volatility: { x: 80, y: 120, label: "시장변동성" },
  base_rate: { x: 80, y: 200, label: "기준금리" },
  sector_id: { x: 80, y: 280, label: "섹터" },
  alpha_factor: { x: 280, y: 160, label: "알파 팩터" },
  forward_return: { x: 480, y: 160, label: "미래 수익률" },
}

function CausalDAGView({
  dagEdges,
  placeboPassed,
  randomCausePassed,
  regimeShiftPassed,
}: CausalDAGViewProps) {
  const treatmentEdgeColor =
    placeboPassed && randomCausePassed ? "#059669" : "#dc2626"

  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        <Term>인과 DAG</Term> (Directed Acyclic Graph)
      </p>
      <svg
        viewBox="0 0 580 320"
        className="w-full"
        style={{ maxHeight: 240, minHeight: 160 }}
        role="img"
        aria-label="인과 DAG: 교란 변수와 알파 팩터, 미래 수익률 간의 관계"
      >
        {/* 화살표 마커 — 색상별 */}
        <defs>
          <marker
            id="arrowhead-default"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
          <marker
            id="arrowhead-treatment"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={treatmentEdgeColor} />
          </marker>
        </defs>

        {/* 엣지 */}
        {dagEdges.map((edge, i) => {
          const from = NODES[edge.from]
          const to = NODES[edge.to]
          if (!from || !to) return null

          // treatment → outcome 엣지만 특별 색상
          const isTreatmentEdge =
            edge.from === "alpha_factor" && edge.to === "forward_return"
          const color = isTreatmentEdge ? treatmentEdgeColor : "#94a3b8"
          const width = isTreatmentEdge ? 2.5 : 1.5

          return (
            <line
              key={i}
              x1={from.x + 50}
              y1={from.y + 14}
              x2={to.x - 4}
              y2={to.y + 14}
              stroke={color}
              strokeWidth={width}
              markerEnd={isTreatmentEdge ? "url(#arrowhead-treatment)" : "url(#arrowhead-default)"}
            />
          )
        })}

        {/* 노드 */}
        {Object.entries(NODES).map(([id, node]) => {
          const isTarget = id === "forward_return"
          const isTreatment = id === "alpha_factor"

          let fill = "#f1f5f9"
          let stroke = "#cbd5e1"
          if (isTreatment) {
            fill = placeboPassed && randomCausePassed ? "#d1fae5" : "#fee2e2"
            stroke = placeboPassed && randomCausePassed ? "#059669" : "#dc2626"
          }
          if (isTarget) {
            fill = "#dbeafe"
            stroke = "#3b82f6"
          }

          return (
            <g key={id}>
              <rect
                x={node.x - 4}
                y={node.y}
                width={108}
                height={28}
                rx={6}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
              />
              <text
                x={node.x + 50}
                y={node.y + 18}
                textAnchor="middle"
                className="text-[10px]"
                fill="#334155"
              >
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 범례 */}
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-4 rounded"
            style={{ backgroundColor: treatmentEdgeColor }}
          />
          <Term>인과 효과</Term> ({placeboPassed && randomCausePassed ? "유효" : "무효"})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-slate-400" />
          <Term>교란 경로</Term>
        </span>
        {regimeShiftPassed !== undefined && (
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-2 w-4 rounded ${regimeShiftPassed ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <Term>국면 생존력</Term> ({regimeShiftPassed ? "통과" : "실패"})
          </span>
        )}
      </div>
    </div>
  )
}

export default CausalDAGView
