import { useMemo } from "react"
import type { AlphaFactor } from "@/types/alpha"
import { Term } from "@/components/ui/term"

interface FactorLineageTreeProps {
  factors: AlphaFactor[]
  onSelect?: (factor: AlphaFactor) => void
}

interface TreeNode {
  factor: AlphaFactor
  children: TreeNode[]
  x: number
  y: number
}

function FactorLineageTree({ factors, onSelect }: FactorLineageTreeProps) {
  const { nodes, edges } = useMemo(() => {
    if (factors.length === 0) return { nodes: [], edges: [] }

    const factorMap = new Map(factors.map((f) => [f.id, f]))

    // 세대별 그룹핑
    const byGeneration = new Map<number, AlphaFactor[]>()
    for (const f of factors) {
      const gen = f.generation
      if (!byGeneration.has(gen)) byGeneration.set(gen, [])
      byGeneration.get(gen)!.push(f)
    }

    const generations = [...byGeneration.keys()].sort((a, b) => a - b)
    const nodePositions: TreeNode[] = []
    const edgeList: { from: string; to: string }[] = []

    const nodeWidth = 140
    const nodeHeight = 40
    const xGap = 20
    const yGap = 60

    for (let gi = 0; gi < generations.length; gi++) {
      const gen = generations[gi]
      const gFactors = byGeneration.get(gen)!
      const y = gi * (nodeHeight + yGap) + 30
      const totalWidth = gFactors.length * (nodeWidth + xGap) - xGap
      const startX = Math.max(20, (600 - totalWidth) / 2)

      for (let fi = 0; fi < gFactors.length; fi++) {
        const f = gFactors[fi]
        const x = startX + fi * (nodeWidth + xGap)
        nodePositions.push({ factor: f, children: [], x, y })

        // 부모 엣지
        if (f.parent_ids) {
          for (const pid of f.parent_ids) {
            if (factorMap.has(pid)) {
              edgeList.push({ from: pid, to: f.id })
            }
          }
        }
      }
    }

    return { nodes: nodePositions, edges: edgeList }
  }, [factors])

  if (factors.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        <Term>계보</Term>를 표시할 <Term>팩터</Term>가 없습니다
      </div>
    )
  }

  const nodeMap = new Map(nodes.map((n) => [n.factor.id, n]))
  const svgHeight =
    Math.max(...nodes.map((n) => n.y)) + 60
  const svgWidth = Math.max(
    600,
    Math.max(...nodes.map((n) => n.x)) + 160,
  )

  const getNodeColor = (ic: number | null) => {
    if (ic === null) return "#e5e7eb"
    if (ic >= 0.05) return "#22c55e"
    if (ic >= 0.03) return "#4056F4"
    return "#f59e0b"
  }

  return (
    <div className="overflow-auto rounded-lg border">
      <svg width={svgWidth} height={svgHeight}>
        {/* 엣지 */}
        {edges.map((e, i) => {
          const fromNode = nodeMap.get(e.from)
          const toNode = nodeMap.get(e.to)
          if (!fromNode || !toNode) return null
          return (
            <line
              key={`edge-${i}`}
              x1={fromNode.x + 70}
              y1={fromNode.y + 40}
              x2={toNode.x + 70}
              y2={toNode.y}
              stroke="#d1d5db"
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          )
        })}

        {/* 화살촉 마커 */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#d1d5db" />
          </marker>
        </defs>

        {/* 노드 */}
        {nodes.map((node) => (
          <g
            key={node.factor.id}
            onClick={() => onSelect?.(node.factor)}
            className="cursor-pointer"
          >
            <rect
              x={node.x}
              y={node.y}
              width={140}
              height={40}
              rx={6}
              fill={getNodeColor(node.factor.ic_mean)}
              opacity={0.15}
              stroke={getNodeColor(node.factor.ic_mean)}
              strokeWidth={1.5}
            />
            <text
              x={node.x + 70}
              y={node.y + 16}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#111"
            >
              {node.factor.name.length > 16
                ? node.factor.name.slice(0, 14) + "..."
                : node.factor.name}
            </text>
            <text
              x={node.x + 70}
              y={node.y + 32}
              textAnchor="middle"
              fontSize={10}
              fill="#666"
            >
              IC={node.factor.ic_mean?.toFixed(4) ?? "N/A"} | gen=
              {node.factor.generation}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default FactorLineageTree
