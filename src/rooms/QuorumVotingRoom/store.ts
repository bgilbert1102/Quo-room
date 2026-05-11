import { create } from 'zustand'
import {
  VALID_STATUSES,
  type AgentDecision,
  type AgentId,
  type DecisionId,
  type DecisionStatus,
  type QuorumResolution,
  type Vote,
  type VoteChoice,
} from './types'

interface QuorumState {
  decisions: Map<DecisionId, AgentDecision>
  resolutions: Map<DecisionId, QuorumResolution>
  addDecision: (raw: unknown) => void
  applyVote: (decisionId: DecisionId, rawVote: unknown) => void
  resolveDecision: (raw: unknown) => void
  expireDecision: (decisionId: DecisionId) => void
  reset: () => void
}

function parseDecision(raw: unknown): AgentDecision | null {
  if (typeof raw !== 'object' || raw === null) return null
  const d = raw as Record<string, unknown>
  if (!d['id'] || typeof d['id'] !== 'string') return null
  if (!VALID_STATUSES.includes(d['status'] as DecisionStatus)) return null
  return {
    id: d['id'] as DecisionId,
    proposedBy: typeof d['proposedBy'] === 'string' ? d['proposedBy'] : '',
    proposedAt: typeof d['proposedAt'] === 'number' ? d['proposedAt'] : Date.now(),
    payload: d['payload'],
    eligibleVoters: Array.isArray(d['eligibleVoters']) ? (d['eligibleVoters'] as AgentId[]) : [],
    votes: Array.isArray(d['votes']) ? (d['votes'] as Vote[]) : [],
    status: d['status'] as DecisionStatus,
    ...(typeof d['resolvedAt'] === 'number' ? { resolvedAt: d['resolvedAt'] } : {}),
  }
}

function parseVote(raw: unknown): Vote | null {
  if (typeof raw !== 'object' || raw === null) return null
  const v = raw as Record<string, unknown>
  if (typeof v['agentId'] !== 'string') return null
  if (v['choice'] !== 'approve' && v['choice'] !== 'reject') return null
  return {
    agentId: v['agentId'] as AgentId,
    choice: v['choice'] as VoteChoice,
    votedAt: typeof v['votedAt'] === 'number' ? v['votedAt'] : Date.now(),
  }
}

function parseResolution(raw: unknown): QuorumResolution | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r['decisionId'] !== 'string') return null
  if (r['status'] !== 'approved' && r['status'] !== 'rejected') return null
  if (typeof r['resolvedAt'] !== 'number') return null
  return {
    decisionId: r['decisionId'] as DecisionId,
    status: r['status'] as 'approved' | 'rejected',
    resolvedAt: r['resolvedAt'],
    ...(r['executionResult'] !== undefined ? { executionResult: r['executionResult'] } : {}),
  }
}

const initialState = {
  decisions: new Map<DecisionId, AgentDecision>(),
  resolutions: new Map<DecisionId, QuorumResolution>(),
}

export const useQuorumStore = create<QuorumState>()((set) => ({
  ...initialState,

  addDecision: (raw) => {
    const decision = parseDecision(raw)
    if (!decision) return
    set((state) => ({
      decisions: new Map(state.decisions).set(decision.id, decision),
    }))
  },

  applyVote: (decisionId, rawVote) => {
    const vote = parseVote(rawVote)
    if (!vote) return
    set((state) => {
      const decision = state.decisions.get(decisionId)
      if (!decision) return state
      // Last vote per agent wins
      const votes = [...decision.votes.filter((v) => v.agentId !== vote.agentId), vote]
      return {
        decisions: new Map(state.decisions).set(decisionId, { ...decision, votes }),
      }
    })
  },

  resolveDecision: (raw) => {
    const resolution = parseResolution(raw)
    if (!resolution) return
    set((state) => {
      const decision = state.decisions.get(resolution.decisionId)
      if (!decision) return state
      return {
        decisions: new Map(state.decisions).set(resolution.decisionId, {
          ...decision,
          status: resolution.status,
          resolvedAt: resolution.resolvedAt,
        }),
        resolutions: new Map(state.resolutions).set(resolution.decisionId, resolution),
      }
    })
  },

  expireDecision: (decisionId) => {
    set((state) => {
      const decision = state.decisions.get(decisionId)
      if (!decision) return state
      return {
        decisions: new Map(state.decisions).set(decisionId, { ...decision, status: 'expired' }),
      }
    })
  },

  reset: () => set({ decisions: new Map(), resolutions: new Map() }),
}))
