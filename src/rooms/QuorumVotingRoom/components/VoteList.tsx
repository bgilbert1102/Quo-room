import type { Vote } from '../types'

interface Props {
  votes: Vote[]
}

export function VoteList({ votes }: Props) {
  if (votes.length === 0) return null
  return (
    <ul aria-label="votes">
      {votes.map((v) => (
        <li key={v.agentId}>
          {v.agentId}: {v.choice}
        </li>
      ))}
    </ul>
  )
}
