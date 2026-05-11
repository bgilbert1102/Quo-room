import { useCallback, useEffect } from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useQuorumStore } from './store'
import type { ReadTopic, WriteTopic } from './ws-topics'
import type { DecisionId, VoteChoice } from './types'

export interface QuorumOptions {
  wsUrl?: string
  rateLimitPerMin?: number
}

const DEFAULT_WS_URL = import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:3000/ws'

export function useQuorum(opts: QuorumOptions = {}) {
  const url = typeof opts.wsUrl === 'string' ? opts.wsUrl : (DEFAULT_WS_URL as string)
  const { send, subscribe, droppedCount, connected } = useWebSocket(
    url,
    opts.rateLimitPerMin !== undefined ? { rateLimitPerMin: opts.rateLimitPerMin } : {},
  )

  const addDecision = useQuorumStore((s) => s.addDecision)
  const applyVote = useQuorumStore((s) => s.applyVote)
  const resolveDecision = useQuorumStore((s) => s.resolveDecision)
  const expireDecision = useQuorumStore((s) => s.expireDecision)

  useEffect(() => {
    return subscribe((raw) => {
      let msg: ReadTopic
      try {
        msg = JSON.parse(raw) as ReadTopic
      } catch {
        return
      }
      switch (msg.topic) {
        case 'read.quorum.proposal':
          addDecision(msg.data)
          break
        case 'read.quorum.vote':
          applyVote(msg.data.decisionId, msg.data.vote)
          break
        case 'read.quorum.resolved':
          resolveDecision(msg.data)
          break
        case 'read.quorum.expired':
          expireDecision(msg.data.decisionId)
          break
        default:
          break
      }
    })
  }, [subscribe, addDecision, applyVote, resolveDecision, expireDecision])

  const decisions = useQuorumStore((s) => s.decisions)
  const resolutions = useQuorumStore((s) => s.resolutions)

  const propose = useCallback(
    (payload: unknown) =>
      send(
        JSON.stringify({
          topic: 'write.quorum.propose',
          data: { payload },
        } satisfies WriteTopic),
      ),
    [send],
  )

  const vote = useCallback(
    (decisionId: DecisionId, choice: VoteChoice) =>
      send(
        JSON.stringify({
          topic: 'write.quorum.vote',
          data: { decisionId, choice },
        } satisfies WriteTopic),
      ),
    [send],
  )

  return { decisions, resolutions, droppedCount, connected, propose, vote }
}
