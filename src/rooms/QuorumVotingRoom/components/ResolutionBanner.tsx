import type { DecisionStatus } from '../types'

interface Props {
  status: DecisionStatus
}

export function ResolutionBanner({ status }: Props) {
  if (status === 'pending') return null
  return <div role="status">{status}</div>
}
