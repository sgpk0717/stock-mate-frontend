import { useEffect, useRef, useState } from "react"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8007"

interface ProgressData {
  type: string
  current?: number
  total?: number
  percent?: number
  message?: string
  error?: string
}

interface BacktestProgressProps {
  runId: string | null
  status: string | null
  onCompleted?: () => void
}

function BacktestProgress({ runId, status, onCompleted }: BacktestProgressProps) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!runId || status === "COMPLETED" || status === "FAILED") return

    let closed = false

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/backtest/${runId}`)
      ws.onmessage = (event) => {
        const data: ProgressData = JSON.parse(event.data)
        if (data.type === "progress") {
          setProgress(data.percent ?? 0)
          setMessage(data.message ?? "")
        } else if (data.type === "completed") {
          setProgress(100)
          setMessage("완료")
          onCompleted?.()
        } else if (data.type === "failed") {
          setMessage(`실패: ${data.error ?? ""}`)
        }
      }
      ws.onclose = () => {
        if (!closed && status === "RUNNING") {
          setTimeout(connect, 3000)
        }
      }
      wsRef.current = ws
    }

    connect()

    return () => {
      closed = true
      wsRef.current?.close()
    }
  }, [runId, status, onCompleted])

  if (!runId || status === "COMPLETED" || status === "FAILED") return null

  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {message || "백테스트 실행 중..."}
        </span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default BacktestProgress
