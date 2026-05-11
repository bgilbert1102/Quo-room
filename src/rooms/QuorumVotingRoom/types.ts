export type AgentId = string
export type DecisionId = string
export type VoteChoice = 'approve' | 'reject'

export const VALID_STATUSES = ['pending', 'approved', 'rejected', 'expired'] as const
export type DecisionStatus = (typeof VALID_STATUSES)[number]

export interface Vote {
  agentId: AgentId
  choice: VoteChoice
  votedAt: number
}

export interface AgentDecision {
  id: DecisionId
  proposedBy: AgentId
  proposedAt: number
  payload: unknown
  eligibleVoters: AgentId[]
  votes: Vote[]
  status: DecisionStatus
  resolvedAt?: number
}

export interface QuorumResolution {
  decisionId: DecisionId
  status: 'approved' | 'rejected'
  executionResult?: unknown
  resolvedAt: number
}
