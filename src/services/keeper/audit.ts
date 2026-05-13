import type { AgentEvent, EventTier } from '../herald/types'

export interface AuditRecord extends AgentEvent {
  tier: EventTier
  dropped?: boolean
  reason?: 'rate-limit' | 'channel-error'
}

// In production: write to persistent store (Obsidian / data/audit.jsonl).
// For now: in-memory ring buffer — last 1000 records.
const _log: AuditRecord[] = []

export async function recordAudit(record: AuditRecord): Promise<void> {
  _log.push(record)
  if (_log.length > 1000) _log.splice(0, _log.length - 1000)
}

export function getAuditLog(): readonly AuditRecord[] {
  return _log
}

// Test helper — never call in production code
export function __clearAuditLog(): void {
  _log.splice(0)
}
