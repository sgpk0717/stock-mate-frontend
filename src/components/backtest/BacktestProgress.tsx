import { useEffect, useRef, useState } from "react"
import { formatKRW } from "@/lib/format"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8007"

interface ProgressData {
  type: string
  current?: number
  total?: number
  percent?: number
  message?: string
  error?: string
}

interface LogEntry {
  time: string
  msg: string
}

interface BacktestProgressConfig {
  strategyName: string
  startDate: string
  endDate: string
  initialCapital: string
  maxPositions: string
  positionSizePct: string
}

interface BacktestProgressProps {
  runId: string | null
  status: string | null
  onCompleted?: () => void
  config?: BacktestProgressConfig
}

function BacktestProgress({ runId, status, onCompleted, config }: BacktestProgressProps) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  // 자동 하단 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  // runId 변경 시 로그 초기화
  useEffect(() => {
    setLogs([])
    setProgress(0)
    setMessage("")
  }, [runId])

  useEffect(() => {
    if (!runId || status === "COMPLETED" || status === "FAILED") return

    let closed = false

    function addLog(msg: string) {
      const time = new Date().toLocaleTimeString("ko-KR", { hour12: false })
      setLogs(prev => [...prev, { time, msg }])
    }

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/backtest/${runId}`)
      ws.onmessage = (event) => {
        const data: ProgressData = JSON.parse(event.data)
        if (data.type === "progress") {
          setProgress(data.percent ?? 0)
          setMessage(data.message ?? "")
          if (data.message) addLog(data.message)
        } else if (data.type === "log") {
          if (data.message) addLog(data.message)
        } else if (data.type === "completed") {
          setProgress(100)
          setMessage("완료")
          addLog("백테스트 완료")
          onCompleted?.()
        } else if (data.type === "failed") {
          setMessage(`실패: ${data.error ?? ""}`)
          addLog(`실패: ${data.error ?? "알 수 없는 오류"}`)
        }
      }
      ws.onopen = () => {
        addLog("서버 연결됨 — 백테스트 대기 중...")
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
    <div className="space-y-3 rounded-md border p-4">
      {/* 파라미터 요약 */}
      {config && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-b pb-2">
          {config.strategyName && (
            <span><span className="font-medium text-foreground">{config.strategyName}</span></span>
          )}
          <span>{config.startDate} ~ {config.endDate}</span>
          <span>자본금 {formatKRW(Number(config.initialCapital))}</span>
          <span>최대 {config.maxPositions}종목</span>
          <span>종목당 {config.positionSizePct}%</span>
        </div>
      )}

      {/* 진행률 바 */}
      <div className="space-y-1.5">
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

      {/* 실시간 로그 패널 */}
      <div className="max-h-48 overflow-y-auto rounded bg-gray-950 p-3 font-mono text-xs leading-relaxed text-gray-400">
        {logs.length === 0 && (
          <span className="text-gray-600">대기 중...</span>
        )}
        {logs.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 text-gray-600">{entry.time}</span>
            <span className="text-gray-300">{entry.msg}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

export default BacktestProgress
