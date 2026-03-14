import { useRef, useEffect } from "react"
import type { CorrelationMatrix } from "@/types/alpha"
import { Term } from "@/components/ui/term"

interface FactorCorrelationHeatmapProps {
  data: CorrelationMatrix
}

function FactorCorrelationHeatmap({ data }: FactorCorrelationHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const n = data.matrix.length
  const cellSize = Math.min(60, Math.max(30, 400 / n))
  const labelWidth = 100
  const labelHeight = 40
  const width = labelWidth + n * cellSize
  const height = labelHeight + n * cellSize

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    // 셀 그리기
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const val = data.matrix[i][j]
        ctx.fillStyle = correlationColor(val)
        ctx.fillRect(
          labelWidth + j * cellSize,
          labelHeight + i * cellSize,
          cellSize - 1,
          cellSize - 1,
        )

        // 값 표시
        if (cellSize >= 35) {
          ctx.fillStyle = Math.abs(val) > 0.5 ? "#fff" : "#333"
          ctx.font = `${Math.max(9, cellSize / 5)}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(
            val.toFixed(2),
            labelWidth + j * cellSize + cellSize / 2,
            labelHeight + i * cellSize + cellSize / 2,
          )
        }
      }
    }

    // 열 라벨 (상단)
    ctx.fillStyle = "#333"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "center"
    for (let j = 0; j < n; j++) {
      const name = data.factor_names[j]
      const label = name.length > 10 ? name.slice(0, 8) + ".." : name
      ctx.save()
      ctx.translate(labelWidth + j * cellSize + cellSize / 2, labelHeight - 4)
      ctx.rotate(-Math.PI / 4)
      ctx.fillText(label, 0, 0)
      ctx.restore()
    }

    // 행 라벨 (좌측)
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    for (let i = 0; i < n; i++) {
      const name = data.factor_names[i]
      const label = name.length > 12 ? name.slice(0, 10) + ".." : name
      ctx.fillText(
        label,
        labelWidth - 6,
        labelHeight + i * cellSize + cellSize / 2,
      )
    }
  }, [data, n, cellSize, width, height])

  if (n === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        <Term>상관행렬</Term>을 계산할 <Term>팩터</Term>를 선택하세요
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-lg border p-2">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="block"
      />
      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-500">
        <span className="inline-block h-3 w-3 rounded" style={{ background: correlationColor(-1) }} />
        <span>-1</span>
        <span className="inline-block h-3 w-3 rounded" style={{ background: correlationColor(0) }} />
        <span>0</span>
        <span className="inline-block h-3 w-3 rounded" style={{ background: correlationColor(1) }} />
        <span>+1</span>
      </div>
    </div>
  )
}

function correlationColor(val: number): string {
  // -1: 빨강, 0: 흰색, +1: 초록
  const clamped = Math.max(-1, Math.min(1, val))
  if (clamped >= 0) {
    const t = clamped
    const r = Math.round(255 * (1 - t))
    const g = 255
    const b = Math.round(255 * (1 - t))
    return `rgb(${r},${g},${b})`
  } else {
    const t = -clamped
    const r = 255
    const g = Math.round(255 * (1 - t))
    const b = Math.round(255 * (1 - t))
    return `rgb(${r},${g},${b})`
  }
}

export default FactorCorrelationHeatmap
