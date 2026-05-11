import { useCallback, useEffect, useRef, useState } from 'react'

export type RawMessageHandler = (data: string) => void

export interface WsOptions {
  rateLimitPerMin?: number
}

export interface WsHandle {
  send: (data: string) => boolean
  subscribe: (handler: RawMessageHandler) => () => void
  droppedCount: number
  connected: boolean
}

const WINDOW_MS = 60_000
const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

interface WsState {
  ws: WebSocket | null
  handlers: Set<RawMessageHandler>
  timestamps: number[]
  attempt: number
  unmounted: boolean
  reconnectTimer: ReturnType<typeof setTimeout> | null
}

export function useWebSocket(url: string, opts: WsOptions = {}): WsHandle {
  const rateLimit = opts.rateLimitPerMin ?? 20

  const stateRef = useRef<WsState>({
    ws: null,
    handlers: new Set(),
    timestamps: [],
    attempt: 0,
    unmounted: false,
    reconnectTimer: null,
  })

  const [connected, setConnected] = useState(false)
  const [droppedCount, setDroppedCount] = useState(0)

  useEffect(() => {
    const state = stateRef.current
    state.unmounted = false

    function connect() {
      if (state.unmounted) return

      const ws = new WebSocket(url)
      state.ws = ws

      ws.onopen = () => {
        state.attempt = 0
        setConnected(true)
      }

      ws.onmessage = (event: MessageEvent<unknown>) => {
        const raw = typeof event.data === 'string' ? event.data : ''
        state.handlers.forEach((h) => h(raw))
      }

      ws.onclose = () => {
        setConnected(false)
        if (state.unmounted) return
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** state.attempt, RECONNECT_MAX_MS)
        state.attempt += 1
        state.reconnectTimer = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      state.unmounted = true
      if (state.reconnectTimer !== null) clearTimeout(state.reconnectTimer)
      state.ws?.close()
    }
  }, [url])

  const send = useCallback(
    (data: string): boolean => {
      const state = stateRef.current
      const now = Date.now()
      const cutoff = now - WINDOW_MS
      state.timestamps = state.timestamps.filter((t) => t > cutoff)

      if (state.timestamps.length >= rateLimit) {
        setDroppedCount((c) => c + 1)
        return false
      }

      state.timestamps.push(now)

      if (state.ws?.readyState === WebSocket.OPEN) {
        state.ws.send(data)
      }
      return true
    },
    [rateLimit],
  )

  const subscribe = useCallback((handler: RawMessageHandler) => {
    stateRef.current.handlers.add(handler)
    return () => {
      stateRef.current.handlers.delete(handler)
    }
  }, [])

  return { send, subscribe, droppedCount, connected }
}
