import { useQuorum, type QuorumOptions } from './useQuorum'
import { ProposalCard } from './components/ProposalCard'

export type QuorumVotingRoomProps = QuorumOptions

export function QuorumVotingRoom(props: QuorumVotingRoomProps) {
  const { decisions, droppedCount, connected, vote } = useQuorum(props)

  return (
    <div>
      {!connected && <div>Disconnected</div>}
      {droppedCount > 0 && <div>{droppedCount} dropped</div>}
      {decisions.size === 0 ? (
        <p>No proposals</p>
      ) : (
        Array.from(decisions.values()).map((d) => (
          <ProposalCard key={d.id} decision={d} onVote={vote} />
        ))
      )}
    </div>
  )
}
