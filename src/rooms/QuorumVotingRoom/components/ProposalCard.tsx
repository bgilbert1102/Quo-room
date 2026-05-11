import type { AgentDecision, DecisionId, VoteChoice } from '../types'
import { VoteList } from './VoteList'
import { ResolutionBanner } from './ResolutionBanner'

interface Props {
  decision: AgentDecision
  onVote: (decisionId: DecisionId, choice: VoteChoice) => void
}

export function ProposalCard({ decision, onVote }: Props) {
  const voteCount = decision.votes.length
  return (
    <article aria-label={`proposal-${decision.id}`}>
      <p>Proposed by {decision.proposedBy}</p>
      <p>
        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
      </p>
      {decision.status === 'pending' && (
        <div>
          <button onClick={() => onVote(decision.id, 'approve')}>Approve</button>
          <button onClick={() => onVote(decision.id, 'reject')}>Reject</button>
        </div>
      )}
      <ResolutionBanner status={decision.status} />
      <VoteList votes={decision.votes} />
    </article>
  )
}
