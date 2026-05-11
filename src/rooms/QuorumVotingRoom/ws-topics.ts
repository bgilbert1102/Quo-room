import type { AgentDecision, DecisionId, Vote, VoteChoice, QuorumResolution } from './types'

export type ReadTopic =
  | { topic: 'read.quorum.proposal'; data: AgentDecision }
  | { topic: 'read.quorum.vote'; data: { decisionId: DecisionId; vote: Vote } }
  | { topic: 'read.quorum.resolved'; data: QuorumResolution }
  | { topic: 'read.quorum.expired'; data: { decisionId: DecisionId } }

export type WriteTopic =
  | { topic: 'write.quorum.propose'; data: { payload: unknown } }
  | { topic: 'write.quorum.vote'; data: { decisionId: DecisionId; choice: VoteChoice } }
