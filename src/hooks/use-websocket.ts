import { useEffect, useRef, useCallback } from "react"
import { useTickStore } from "@/stores/use-tick-store"
import type { RealtimeOrderBook, RealtimeTick } from "@/types"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8007"

export function useWebSocket(
  path: string,
  onMessage: (data: unknown) => void,
) {
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

export function useTickStream(symbol: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const symbolRef = useRef(symbol)
  symbolRef.current = symbol

  useEffect(() => {
    if (!symbol) return

    let closed = false

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/ticks/${symbol}`)
      ws.onmessage = (event) => {
        const data: RealtimeTick = JSON.parse(event.data)
        useTickStore.getState().addTick(symbolRef.current, data)
      }
      ws.onclose = () => {
        if (!closed) {
          reconnectRef.current = setTimeout(connect, 3000)
        }
      }
      wsRef.current = ws
    }

    connect()

    return () => {
      closed = true
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      useTickStore.getState().clearSymbol(symbol)
    }
  }, [symbol])
}

export function useOrderBookStream(symbol: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const symbolRef = useRef(symbol)
  symbolRef.current = symbol

  useEffect(() => {
    if (!symbol) return

    let closed = false

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/orderbook/${symbol}`)
      ws.onmessage = (event) => {
        const data: RealtimeOrderBook = JSON.parse(event.data)
        useTickStore.getState().setOrderBook(symbolRef.current, {
          currentPrice: data.currentPrice,
          asks: data.asks,
          bids: data.bids,
        })
      }
      ws.onclose = () => {
        if (!closed) {
          reconnectRef.current = setTimeout(connect, 3000)
        }
      }
      wsRef.current = ws
    }

    connect()

    return () => {
      closed = true
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
      useTickStore.getState().clearSymbol(symbol)
    }
  }, [symbol])
}

// ── Alpha Mining / Factory WebSocket ──

export function useAlphaMiningStream(
  runId: string | null,
  onEvent: (data: Record<string, unknown>) => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!runId) return

    let closed = false

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/alpha/${runId}`)
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onEventRef.current(data)
        } catch {
          /* ignore parse errors */
        }
      }
      ws.onclose = () => {
        if (!closed) {
          reconnectRef.current = setTimeout(connect, 3000)
        }
      }
      wsRef.current = ws
    }

    connect()

    return () => {
      closed = true
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [runId])
}

export function useAlphaFactoryStream(
  enabled: boolean,
  onEvent: (data: Record<string, unknown>) => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled) return

    let closed = false

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/alpha/factory`)
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onEventRef.current(data)
        } catch {
          /* ignore parse errors */
        }
      }
      ws.onclose = () => {
        if (!closed) {
          reconnectRef.current = setTimeout(connect, 3000)
        }
      }
      wsRef.current = ws
    }

    connect()

    return () => {
      closed = true
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [enabled])
}
