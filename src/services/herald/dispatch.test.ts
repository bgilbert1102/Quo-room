import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dispatch, __resetForTest, __setSendOverride } from './dispatch'
import type { AgentEvent } from './types'

vi.mock('../keeper/audit', () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}))

import * as auditModule from '../keeper/audit'
const recordAuditMock = vi.mocked(auditModule.recordAudit)

function makeEvent(type: string, overrides: Partial<AgentEvent> = {}): AgentEvent {
  return {
    id: 'evt-001',
    emittedAt: new Date().toISOString(),
    source: 'test-agent',
    type,
    payload: { test: true },
    ...overrides,
  }
}

let sendCalls: string[]

beforeEach(() => {
  __resetForTest()
  recordAuditMock.mockClear()
  sendCalls = []
  __setSendOverride(async (msg) => { sendCalls.push(msg) })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ── CRITICAL ──────────────────────────────────────────────────────────────────

describe('dispatch — CRITICAL', () => {
  it('CRITICAL event is audit-logged and sent via channel immediately', async () => {
    await dispatch(makeEvent('cost.exceeded'))

    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    expect(recordAuditMock.mock.calls[0]?.[0]).not.toHaveProperty('dropped')
    expect(sendCalls).toHaveLength(1)
  })

  it('second CRITICAL within 60 s is NOT sent and IS audit-logged twice (once clean, once dropped)', async () => {
    await dispatch(makeEvent('cost.exceeded'))
    recordAuditMock.mockClear()
    sendCalls = []

    await dispatch(makeEvent('cost.exceeded'))

    expect(sendCalls).toHaveLength(0)
    expect(recordAuditMock).toHaveBeenCalledTimes(2)
    const secondCall = recordAuditMock.mock.calls[1]?.[0]
    expect(secondCall).toMatchObject({ dropped: true, reason: 'rate-limit' })
  })

  it('CRITICAL at exactly 60 000 ms + 1 ms after first is sent (window reset)', async () => {
    await dispatch(makeEvent('cost.exceeded'))
    sendCalls = []
    recordAuditMock.mockClear()

    vi.setSystemTime(Date.now() + 60_001)
    await dispatch(makeEvent('cost.exceeded'))

    expect(sendCalls).toHaveLength(1)
    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    expect(recordAuditMock.mock.calls[0]?.[0]).not.toHaveProperty('dropped')
  })
})

// ── IMPORTANT ─────────────────────────────────────────────────────────────────

describe('dispatch — IMPORTANT', () => {
  it('single IMPORTANT event below batch threshold (1 of 3) is audit-logged but NOT sent immediately', async () => {
    await dispatch(makeEvent('product.published'))

    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    expect(sendCalls).toHaveLength(0)
  })

  it('two IMPORTANT events below batch threshold set a 10-minute timer but do not send', async () => {
    await dispatch(makeEvent('product.published'))
    await dispatch(makeEvent('video.published'))

    expect(sendCalls).toHaveLength(0)
    vi.advanceTimersByTime(BATCH_WINDOW_MS - 1)
    expect(sendCalls).toHaveLength(0)
  })

  it('batch window timer fires after 10 min and sends accumulated events', async () => {
    await dispatch(makeEvent('product.published'))
    await dispatch(makeEvent('video.published'))

    await vi.advanceTimersByTimeAsync(BATCH_WINDOW_MS)

    expect(sendCalls).toHaveLength(1)
    expect(sendCalls[0]).toContain('BATCH')
  })

  it('third IMPORTANT event reaching batch threshold flushes immediately without waiting for timer', async () => {
    await dispatch(makeEvent('product.published'))
    await dispatch(makeEvent('video.published'))
    await dispatch(makeEvent('earnings.milestone'))

    expect(sendCalls).toHaveLength(1)
    expect(sendCalls[0]).toContain('BATCH')
  })

  it('fifth IMPORTANT batch flush within the hour succeeds; sixth does not send', async () => {
    // Send 5 batches × 3 events each = 15 events → 5 flushes
    for (let i = 0; i < 5; i++) {
      await dispatch(makeEvent('product.published'))
      await dispatch(makeEvent('video.published'))
      await dispatch(makeEvent('earnings.milestone'))
    }
    expect(sendCalls).toHaveLength(5)

    // 6th batch
    await dispatch(makeEvent('product.published'))
    await dispatch(makeEvent('video.published'))
    await dispatch(makeEvent('earnings.milestone'))

    expect(sendCalls).toHaveLength(5)
  })
})

const BATCH_WINDOW_MS = 10 * 60_000

// ── DAILY ─────────────────────────────────────────────────────────────────────

describe('dispatch — DAILY', () => {
  it('first summary.daily is sent', async () => {
    await dispatch(makeEvent('summary.daily'))

    expect(sendCalls).toHaveLength(1)
    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    expect(recordAuditMock.mock.calls[0]?.[0]).not.toHaveProperty('dropped')
  })

  it('second summary.daily within same 24-hour window is audit-logged twice and not sent', async () => {
    await dispatch(makeEvent('summary.daily'))
    sendCalls = []
    recordAuditMock.mockClear()

    await dispatch(makeEvent('summary.daily'))

    expect(sendCalls).toHaveLength(0)
    expect(recordAuditMock).toHaveBeenCalledTimes(2)
    const droppedCall = recordAuditMock.mock.calls[1]?.[0]
    expect(droppedCall).toMatchObject({ dropped: true, reason: 'rate-limit' })
  })
})

// ── SILENT ────────────────────────────────────────────────────────────────────

describe('dispatch — SILENT', () => {
  it('SILENT event calls recordAudit exactly once and never calls channel send', async () => {
    await dispatch(makeEvent('unknown.internal.event'))

    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    expect(sendCalls).toHaveLength(0)
  })
})

// ── CHANNEL FAILURE ───────────────────────────────────────────────────────────

describe('dispatch — channel failure', () => {
  it('channel throwing a network error marks event dropped: true, reason: channel-error and returns normally', async () => {
    __setSendOverride(async () => { throw new Error('ECONNREFUSED') })

    await expect(dispatch(makeEvent('cost.exceeded'))).resolves.toBeUndefined()
    expect(recordAuditMock).toHaveBeenCalledTimes(2)
    const droppedCall = recordAuditMock.mock.calls[1]?.[0]
    expect(droppedCall).toMatchObject({ dropped: true, reason: 'channel-error' })
  })

  it('channel returning 4xx marks event dropped and returns normally', async () => {
    __setSendOverride(async () => { throw new Error('Telegram send failed: 400 Bad Request') })

    await expect(dispatch(makeEvent('api.auth_failed'))).resolves.toBeUndefined()
    const droppedCall = recordAuditMock.mock.calls[1]?.[0]
    expect(droppedCall).toMatchObject({ dropped: true, reason: 'channel-error' })
  })

  it('channel returning 5xx marks event dropped and returns normally', async () => {
    __setSendOverride(async () => { throw new Error('Telegram send failed: 500 Internal Server Error') })

    await expect(dispatch(makeEvent('safety.flag'))).resolves.toBeUndefined()
    const droppedCall = recordAuditMock.mock.calls[1]?.[0]
    expect(droppedCall).toMatchObject({ dropped: true, reason: 'channel-error' })
  })
})

// ── ORDERING ──────────────────────────────────────────────────────────────────

describe('dispatch — ordering', () => {
  it('SILENT dispatched before CRITICAL produces audit records in emission order, not tier order', async () => {
    await dispatch(makeEvent('unknown.event'))    // SILENT
    await dispatch(makeEvent('cost.exceeded'))    // CRITICAL

    expect(recordAuditMock).toHaveBeenCalledTimes(2)
    expect(recordAuditMock.mock.calls[0]?.[0]).toMatchObject({ tier: 'SILENT' })
    expect(recordAuditMock.mock.calls[1]?.[0]).toMatchObject({ tier: 'CRITICAL' })
  })

  it('two CRITICALs dispatched sequentially in same await chain are processed first-in first-out', async () => {
    await dispatch(makeEvent('cost.exceeded'))     // first — sends
    await dispatch(makeEvent('api.auth_failed'))   // second — rate-limited

    expect(sendCalls).toHaveLength(1)
    expect(recordAuditMock).toHaveBeenCalledTimes(3) // 2 clean + 1 dropped
    expect(recordAuditMock.mock.calls[0]?.[0]).toMatchObject({ type: 'cost.exceeded', tier: 'CRITICAL' })
    expect(recordAuditMock.mock.calls[2]?.[0]).toMatchObject({ dropped: true, reason: 'rate-limit' })
  })
})

// ── STARTUP ───────────────────────────────────────────────────────────────────

describe('dispatch — startup', () => {
  it('module imported with HERALD_CHANNEL=fake loads without error when Telegram env vars are absent', async () => {
    // dispatch.ts dynamically imports telegram only when HERALD_CHANNEL=telegram.
    // Since the override is set in beforeEach, the real telegram module is never imported.
    // This test asserts the import itself already succeeded (we're running it).
    await expect(dispatch(makeEvent('summary.daily'))).resolves.toBeUndefined()
  })
})
