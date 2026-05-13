import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dispatch, __resetForTest, __setSendOverride } from './dispatch'
import type { AgentEvent } from './types'

vi.mock('../keeper/audit', () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}))

import * as auditModule from '../keeper/audit'
const recordAuditMock = vi.mocked(auditModule.recordAudit)

function makeCostEvent(): AgentEvent {
  return {
    id: 'integ-001',
    emittedAt: new Date().toISOString(),
    source: 'strategist',
    type: 'cost.exceeded',
    payload: { usd: 12.50, cap: 10.00 },
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

describe('integration — cost.exceeded full flow', () => {
  it('cost.exceeded event: classify → CRITICAL → rate-check pass → channel send → single audit record present', async () => {
    await dispatch(makeCostEvent())

    expect(sendCalls).toHaveLength(1)
    expect(recordAuditMock).toHaveBeenCalledTimes(1)
    const auditRecord = recordAuditMock.mock.calls[0]?.[0]
    expect(auditRecord).toMatchObject({ tier: 'CRITICAL', type: 'cost.exceeded' })
    expect(auditRecord).not.toHaveProperty('dropped')
  })
})

describe('integration — cost.exceeded rate-limited flow', () => {
  it('second cost.exceeded within 60 s: classify → CRITICAL → rate-check fail → no channel send → audit record with dropped: true', async () => {
    await dispatch(makeCostEvent())

    const firstSendCount = sendCalls.length
    const firstAuditCount = recordAuditMock.mock.calls.length

    await dispatch(makeCostEvent())

    expect(sendCalls).toHaveLength(firstSendCount)  // no new sends
    expect(recordAuditMock).toHaveBeenCalledTimes(firstAuditCount + 2) // clean + dropped
    const droppedRecord = recordAuditMock.mock.calls[firstAuditCount + 1]?.[0]
    expect(droppedRecord).toMatchObject({ dropped: true, reason: 'rate-limit', tier: 'CRITICAL' })
  })
})
