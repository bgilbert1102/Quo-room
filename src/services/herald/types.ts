export type EventTier = 'CRITICAL' | 'IMPORTANT' | 'DAILY' | 'SILENT'

export type EventType =
  | 'quorum.deadlock'
  | 'cost.exceeded'
  | 'api.auth_failed'
  | 'error_rate.spike'
  | 'safety.flag'
  | 'tos.risk_detected'
  | 'product.published'
  | 'video.published'
  | 'earnings.milestone'
  | 'gig.high_value_surfaced'
  | 'proposal.awaiting_approval'
  | 'summary.daily'
  | string // open for future event types

export interface AgentEvent {
  id: string            // ulid
  emittedAt: string     // ISO 8601
  source: string        // agent id or service name
  type: EventType
  payload: Record<string, unknown>
  // Optional fields the classifier reads:
  requiresOverride?: boolean
  cost?: { usd: number; cap: number }
  rate?: number         // e.g. error rate
}
