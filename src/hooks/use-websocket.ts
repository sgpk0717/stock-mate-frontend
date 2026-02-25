import { useEffect, useRef, useCallback } from "react"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8007"

export function useWebSocket(path: string, onMessage: (data: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    const ws = new WebSocket(`${WS_URL}${path}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessage(data)
    }
    ws.onclose = () => {
      setTimeout(connect, 3000)
    }
    wsRef.current = ws
  }, [path, onMessage])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  return wsRef
}
