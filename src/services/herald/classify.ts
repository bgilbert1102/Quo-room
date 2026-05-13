import type { AgentEvent, EventTier } from './types'

// Pure function. Same input → same output. No I/O.
// Order matters: first match wins.
export function classifyEvent(event: AgentEvent): EventTier {
  // CRITICAL — wake Brandon up
  if (event.type === 'quorum.deadlock' && event.requiresOverride) return 'CRITICAL'
  if (event.type === 'cost.exceeded')    return 'CRITICAL'
  if (event.type === 'api.auth_failed')  return 'CRITICAL'
  if (event.type === 'error_rate.spike' && (event.rate ?? 0) > 0.1) return 'CRITICAL'
  if (event.type === 'safety.flag')      return 'CRITICAL'
  if (event.type === 'tos.risk_detected') return 'CRITICAL'

  // IMPORTANT — same-day awareness
  if (event.type === 'product.published')          return 'IMPORTANT'
  if (event.type === 'video.published')            return 'IMPORTANT'
  if (event.type === 'earnings.milestone')         return 'IMPORTANT'
  if (event.type === 'gig.high_value_surfaced')    return 'IMPORTANT'
  if (event.type === 'proposal.awaiting_approval') return 'IMPORTANT'

  // DAILY — batched
  if (event.type === 'summary.daily') return 'DAILY'

  return 'SILENT'
}
