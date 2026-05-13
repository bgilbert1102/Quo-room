import type { AgentEvent, EventTier } from './types'
import { classifyEvent } from './classify'
import { recordAudit } from '../keeper/audit'

const BATCH_WINDOW_MS = 10 * 60_000
const BATCH_MIN_COUNT = 3

interface RateState {
  windowStart: number
  count: number
}

const RATE_LIMITS: Record<EventTier, { count: number; perMs: number }> = {
  CRITICAL:  { count: 1, perMs: 60_000 },
  IMPORTANT: { count: 5, perMs: 60 * 60_000 },
  DAILY:     { count: 1, perMs: 24 * 60 * 60_000 },
  SILENT:    { count: 0, perMs: 0 },
}

const rateState: Record<EventTier, RateState> = {
  CRITICAL:  { windowStart: 0, count: 0 },
  IMPORTANT: { windowStart: 0, count: 0 },
  DAILY:     { windowStart: 0, count: 0 },
  SILENT:    { windowStart: 0, count: 0 },
}

const importantBatch: AgentEvent[] = []
let _batchTimer: ReturnType<typeof setTimeout> | null = null

// Injectable send function — set by tests; production falls through to activeSend
type Sender = (msg: string) => Promise<void>
let _sendOverride: Sender | null = null

export function __setSendOverride(fn: Sender | null): void {
  _sendOverride = fn
}

// Reset all module-level state between tests
export function __resetForTest(): void {
  rateState.CRITICAL  = { windowStart: 0, count: 0 }
  rateState.IMPORTANT = { windowStart: 0, count: 0 }
  rateState.DAILY     = { windowStart: 0, count: 0 }
  rateState.SILENT    = { windowStart: 0, count: 0 }
  importantBatch.splice(0)
  if (_batchTimer !== null) {
    clearTimeout(_batchTimer)
    _batchTimer = null
  }
  _sendOverride = null
}

async function activeSend(msg: string): Promise<void> {
  const channel = process.env['HERALD_CHANNEL'] ?? 'fake'
  if (channel === 'telegram') {
    const { sendTelegram } = await import('./channels/telegram')
    return sendTelegram(msg)
  }
  // fake channel: no-op
}

async function send(msg: string): Promise<void> {
  return (_sendOverride ?? activeSend)(msg)
}

function checkAndIncrementRate(tier: EventTier): boolean {
  const limit = RATE_LIMITS[tier]
  const state = rateState[tier]
  const now = Date.now()
  if (now - state.windowStart > limit.perMs) {
    state.windowStart = now
    state.count = 0
  }
  if (state.count >= limit.count) return false
  state.count += 1
  return true
}

function formatEvent(event: AgentEvent, tier: EventTier): string {
  return `*[${tier}]* ${event.type}\n${JSON.stringify(event.payload, null, 2)}`
}

function formatBatch(batch: AgentEvent[]): string {
  return `*[BATCH ×${batch.length}]*\n` +
    batch.map((e) => `• ${e.type} — ${e.source}`).join('\n')
}

async function flushImportantBatch(): Promise<void> {
  _batchTimer = null
  if (importantBatch.length === 0) return
  const batch = importantBatch.splice(0)
  if (!checkAndIncrementRate('IMPORTANT')) return
  try {
    await send(formatBatch(batch))
  } catch (err) {
    console.error('[herald] batch flush failed:', err)
  }
}

export async function dispatch(event: AgentEvent): Promise<void> {
  const tier = classifyEvent(event)
  await recordAudit({ ...event, tier })

  if (tier === 'SILENT') return

  if (tier === 'IMPORTANT') {
    importantBatch.push(event)
    if (importantBatch.length >= BATCH_MIN_COUNT) {
      await flushImportantBatch()
    } else if (_batchTimer === null) {
      _batchTimer = setTimeout(() => { void flushImportantBatch() }, BATCH_WINDOW_MS)
    }
    return
  }

  // CRITICAL and DAILY: rate-check before send
  if (!checkAndIncrementRate(tier)) {
    await recordAudit({ ...event, tier, dropped: true, reason: 'rate-limit' })
    return
  }

  try {
    await send(formatEvent(event, tier))
  } catch {
    await recordAudit({ ...event, tier, dropped: true, reason: 'channel-error' })
  }
}
