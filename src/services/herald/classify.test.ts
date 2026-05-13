import { describe, it, expect } from 'vitest'
import { classifyEvent } from './classify'
import type { AgentEvent } from './types'

function makeEvent(type: string, overrides: Partial<AgentEvent> = {}): AgentEvent {
  return {
    id: 'test-id',
    emittedAt: new Date().toISOString(),
    source: 'test-agent',
    type,
    payload: {},
    ...overrides,
  }
}

describe('classifyEvent — CRITICAL tier', () => {
  it('quorum.deadlock with requiresOverride: true returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('quorum.deadlock', { requiresOverride: true }))).toBe('CRITICAL')
  })

  it('quorum.deadlock with requiresOverride: false returns SILENT', () => {
    expect(classifyEvent(makeEvent('quorum.deadlock', { requiresOverride: false }))).toBe('SILENT')
  })

  it('quorum.deadlock with requiresOverride omitted returns SILENT', () => {
    expect(classifyEvent(makeEvent('quorum.deadlock'))).toBe('SILENT')
  })

  it('cost.exceeded returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('cost.exceeded'))).toBe('CRITICAL')
  })

  it('cost.exceeded with empty payload object returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('cost.exceeded', { payload: {} }))).toBe('CRITICAL')
  })

  it('cost.exceeded with extra unrecognised payload fields returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('cost.exceeded', { payload: { foo: 'bar', x: 99 } }))).toBe('CRITICAL')
  })

  it('api.auth_failed returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('api.auth_failed'))).toBe('CRITICAL')
  })

  it('error_rate.spike with rate 0.5 returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('error_rate.spike', { rate: 0.5 }))).toBe('CRITICAL')
  })

  it('error_rate.spike with rate exactly 0.1 returns SILENT (not CRITICAL)', () => {
    expect(classifyEvent(makeEvent('error_rate.spike', { rate: 0.1 }))).toBe('SILENT')
  })

  it('error_rate.spike with rate 0.1001 returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('error_rate.spike', { rate: 0.1001 }))).toBe('CRITICAL')
  })

  it('error_rate.spike with rate 0 returns SILENT', () => {
    expect(classifyEvent(makeEvent('error_rate.spike', { rate: 0 }))).toBe('SILENT')
  })

  it('error_rate.spike with rate field omitted returns SILENT', () => {
    expect(classifyEvent(makeEvent('error_rate.spike'))).toBe('SILENT')
  })

  it('safety.flag returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('safety.flag'))).toBe('CRITICAL')
  })

  it('tos.risk_detected returns CRITICAL', () => {
    expect(classifyEvent(makeEvent('tos.risk_detected'))).toBe('CRITICAL')
  })
})

describe('classifyEvent — IMPORTANT tier', () => {
  it('product.published returns IMPORTANT', () => {
    expect(classifyEvent(makeEvent('product.published'))).toBe('IMPORTANT')
  })

  it('video.published returns IMPORTANT', () => {
    expect(classifyEvent(makeEvent('video.published'))).toBe('IMPORTANT')
  })

  it('earnings.milestone returns IMPORTANT', () => {
    expect(classifyEvent(makeEvent('earnings.milestone'))).toBe('IMPORTANT')
  })

  it('gig.high_value_surfaced returns IMPORTANT', () => {
    expect(classifyEvent(makeEvent('gig.high_value_surfaced'))).toBe('IMPORTANT')
  })

  it('proposal.awaiting_approval returns IMPORTANT', () => {
    expect(classifyEvent(makeEvent('proposal.awaiting_approval'))).toBe('IMPORTANT')
  })
})

describe('classifyEvent — DAILY tier', () => {
  it('summary.daily returns DAILY', () => {
    expect(classifyEvent(makeEvent('summary.daily'))).toBe('DAILY')
  })
})

describe('classifyEvent — SILENT (default)', () => {
  it('unknown string event type returns SILENT', () => {
    expect(classifyEvent(makeEvent('unknown.event.xyz'))).toBe('SILENT')
  })

  it('empty string event type returns SILENT', () => {
    expect(classifyEvent(makeEvent(''))).toBe('SILENT')
  })
})

describe('classifyEvent — null-safety', () => {
  it('event with no optional fields (requiresOverride, cost, rate all absent) does not throw', () => {
    expect(() => classifyEvent(makeEvent('unknown.type'))).not.toThrow()
    expect(classifyEvent(makeEvent('unknown.type'))).toBe('SILENT')
  })

  it('error_rate.spike with rate: undefined does not throw', () => {
    const event = makeEvent('error_rate.spike')
    expect(() => classifyEvent(event)).not.toThrow()
    expect(classifyEvent(event)).toBe('SILENT')
  })

  it('quorum.deadlock with requiresOverride: undefined does not throw', () => {
    const event = makeEvent('quorum.deadlock')
    expect(() => classifyEvent(event)).not.toThrow()
    expect(classifyEvent(event)).toBe('SILENT')
  })
})

describe('classifyEvent — determinism', () => {
  it('calling classifyEvent twice with identical input returns identical output', () => {
    const event = makeEvent('error_rate.spike', { rate: 0.5 })
    expect(classifyEvent(event)).toBe(classifyEvent(event))
  })

  it('classifying every EventType twice yields the same tier both times', () => {
    const knownTypes = [
      'quorum.deadlock', 'cost.exceeded', 'api.auth_failed', 'error_rate.spike',
      'safety.flag', 'tos.risk_detected', 'product.published', 'video.published',
      'earnings.milestone', 'gig.high_value_surfaced', 'proposal.awaiting_approval',
      'summary.daily',
    ]
    for (const type of knownTypes) {
      const event = makeEvent(type, { requiresOverride: true, rate: 0.5 })
      const first  = classifyEvent(event)
      const second = classifyEvent(event)
      expect(first).toBe(second)
    }
  })
})
