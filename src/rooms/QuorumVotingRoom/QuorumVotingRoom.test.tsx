import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuorumVotingRoom } from './index'
import { useQuorumStore } from './store'
import type { AgentDecision } from './types'

// ---------------------------------------------------------------------------
// MockWebSocket — replaces the global WebSocket in every test
// ---------------------------------------------------------------------------
class MockWS {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances: MockWS[] = []

  readyState = MockWS.CONNECTING
  onopen: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  private _sent: string[] = []

  constructor(readonly url: string) {
    MockWS.instances.push(this)
  }

  send(data: string) {
    this._sent.push(data)
  }

  close() {
    this.readyState = MockWS.CLOSED
    this.onclose?.({ type: 'close', code: 1000, reason: '', wasClean: true } as CloseEvent)
  }

  simulateOpen() {
    this.readyState = MockWS.OPEN
    this.onopen?.({ type: 'open' } as Event)
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data), type: 'message' } as MessageEvent)
  }

  simulateMalformedMessage(raw: string) {
    this.onmessage?.({ data: raw, type: 'message' } as MessageEvent)
  }

  simulateError() {
    this.onerror?.({ type: 'error' } as Event)
    this.close()
  }

  getSent<T = unknown>(): T[] {
    return this._sent.map((s) => JSON.parse(s) as T)
  }

  static reset() {
    this.instances = []
  }

  static latest(): MockWS {
    const ws = this.instances.at(-1)
    if (!ws) throw new Error('No MockWS instance created')
    return ws
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const NOW = 1_700_000_000_000

function makeDecision(overrides?: Partial<AgentDecision>): AgentDecision {
  return {
    id: 'dec-1',
    proposedBy: 'agent-1',
    proposedAt: NOW,
    payload: { action: 'deploy', target: 'prod' },
    eligibleVoters: ['agent-1', 'agent-2', 'agent-3'],
    votes: [],
    status: 'pending',
    ...overrides,
  }
}

const WS_URL = 'ws://test-host/ws'

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  MockWS.reset()
  vi.stubGlobal('WebSocket', MockWS)
  useQuorumStore.getState().reset()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('QuorumVotingRoom', () => {
  // 1. Happy path
  it('renders a proposal, updates vote count, and shows resolution', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    const ws = MockWS.latest()
    act(() => ws.simulateOpen())

    act(() => ws.simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }))
    expect(screen.getByText(/agent-1/i)).toBeInTheDocument()
    expect(screen.getByText(/0 votes/i)).toBeInTheDocument()

    act(() =>
      ws.simulateMessage({
        topic: 'read.quorum.vote',
        data: {
          decisionId: 'dec-1',
          vote: { agentId: 'agent-2', choice: 'approve', votedAt: NOW + 1 },
        },
      }),
    )
    expect(screen.getByText(/1 vote$/i)).toBeInTheDocument()

    act(() =>
      ws.simulateMessage({
        topic: 'read.quorum.resolved',
        data: { decisionId: 'dec-1', status: 'approved', resolvedAt: NOW + 2 },
      }),
    )
    expect(screen.getByText(/approved/i)).toBeInTheDocument()
  })

  // 2. Empty state
  it('shows empty-state message when no proposals exist', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    act(() => MockWS.latest().simulateOpen())
    expect(screen.getByText(/no proposals/i)).toBeInTheDocument()
  })

  // 3a. Malformed: null id — proposal is silently dropped
  it('ignores a proposal with a null id', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    act(() => MockWS.latest().simulateOpen())
    act(() =>
      MockWS.latest().simulateMessage({
        topic: 'read.quorum.proposal',
        data: { ...makeDecision(), id: null },
      }),
    )
    expect(screen.getByText(/no proposals/i)).toBeInTheDocument()
  })

  // 3b. Malformed: missing votes field — treated as empty array
  it('renders a proposal with missing votes as zero votes', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    act(() => MockWS.latest().simulateOpen())
    const { votes: _v, ...rest } = makeDecision()
    act(() =>
      MockWS.latest().simulateMessage({ topic: 'read.quorum.proposal', data: rest }),
    )
    expect(screen.getByText(/0 votes/i)).toBeInTheDocument()
  })

  // 3c. Malformed: invalid status — proposal is silently dropped
  it('ignores a proposal with an invalid status', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    act(() => MockWS.latest().simulateOpen())
    act(() =>
      MockWS.latest().simulateMessage({
        topic: 'read.quorum.proposal',
        data: { ...makeDecision(), status: 'UNKNOWN_STATUS' },
      }),
    )
    expect(screen.getByText(/no proposals/i)).toBeInTheDocument()
  })

  // 3d. Empty votes array
  it('renders a proposal with an empty votes array showing zero votes', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    act(() => MockWS.latest().simulateOpen())
    act(() =>
      MockWS.latest().simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }),
    )
    expect(screen.getByText(/0 votes/i)).toBeInTheDocument()
  })

  // 3e. Malformed JSON — component survives without crash
  it('survives a malformed JSON frame without crashing', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    act(() => MockWS.latest().simulateOpen())
    act(() => MockWS.latest().simulateMalformedMessage('{not valid json'))
    expect(screen.getByText(/no proposals/i)).toBeInTheDocument()
  })

  // 4. Socket closes before resolution — disconnected indicator shown
  it('shows disconnected indicator when the socket closes', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    const ws = MockWS.latest()
    act(() => ws.simulateOpen())
    act(() => ws.close())
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument()
  })

  // 5. Two vote events in the same React tick — both applied, count correct
  it('handles two vote events dispatched in the same tick deterministically', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    const ws = MockWS.latest()
    act(() => ws.simulateOpen())
    act(() => ws.simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }))
    act(() => {
      ws.simulateMessage({
        topic: 'read.quorum.vote',
        data: { decisionId: 'dec-1', vote: { agentId: 'agent-2', choice: 'approve', votedAt: NOW + 1 } },
      })
      ws.simulateMessage({
        topic: 'read.quorum.vote',
        data: { decisionId: 'dec-1', vote: { agentId: 'agent-3', choice: 'reject', votedAt: NOW + 2 } },
      })
    })
    expect(screen.getByText(/2 votes/i)).toBeInTheDocument()
  })

  // 6. Duplicate vote from same agent — deduplicated (last wins)
  it('deduplicates votes from the same agent, keeping the last choice', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    const ws = MockWS.latest()
    act(() => ws.simulateOpen())
    act(() => ws.simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }))
    act(() =>
      ws.simulateMessage({
        topic: 'read.quorum.vote',
        data: { decisionId: 'dec-1', vote: { agentId: 'agent-2', choice: 'approve', votedAt: NOW + 1 } },
      }),
    )
    act(() =>
      ws.simulateMessage({
        topic: 'read.quorum.vote',
        data: { decisionId: 'dec-1', vote: { agentId: 'agent-2', choice: 'reject', votedAt: NOW + 2 } },
      }),
    )
    expect(screen.getByText(/1 vote$/i)).toBeInTheDocument()
    const voteList = screen.getByRole('list', { name: /votes/i })
    expect(within(voteList).getByText(/reject/i)).toBeInTheDocument()
  })

  // 7. Rate limit at N — all messages go through, no counter shown
  it('sends up to the rate limit without dropping', async () => {
    const LIMIT = 3
    render(<QuorumVotingRoom wsUrl={WS_URL} rateLimitPerMin={LIMIT} />)
    const ws = MockWS.latest()
    act(() => ws.simulateOpen())
    act(() => ws.simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }))

    const user = userEvent.setup()
    for (let i = 0; i < LIMIT; i++) {
      await user.click(screen.getByRole('button', { name: /approve/i }))
    }
    expect(ws.getSent()).toHaveLength(LIMIT)
    expect(screen.queryByText(/dropped/i)).not.toBeInTheDocument()
  })

  // 8. Rate limit at N+1 — excess dropped, counter visible
  it('drops the message beyond the rate limit and shows a dropped counter', async () => {
    const LIMIT = 3
    render(<QuorumVotingRoom wsUrl={WS_URL} rateLimitPerMin={LIMIT} />)
    const ws = MockWS.latest()
    act(() => ws.simulateOpen())
    act(() => ws.simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }))

    const user = userEvent.setup()
    for (let i = 0; i < LIMIT + 1; i++) {
      await user.click(screen.getByRole('button', { name: /approve/i }))
    }
    expect(ws.getSent()).toHaveLength(LIMIT)
    expect(screen.getByText(/1 dropped/i)).toBeInTheDocument()
  })

  // 9. Reconnect mid-stream — Zustand state survives the socket drop
  it('retains existing proposals in state after a reconnect', () => {
    vi.useFakeTimers()
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    let ws = MockWS.latest()
    act(() => ws.simulateOpen())
    act(() => ws.simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }))
    expect(screen.getByText(/agent-1/i)).toBeInTheDocument()

    act(() => ws.close())
    // Advance past the first reconnect backoff (1 000 ms)
    act(() => vi.advanceTimersByTime(1_100))
    ws = MockWS.latest()
    act(() => ws.simulateOpen())

    // Zustand store kept the decision — it's still visible
    expect(screen.getByText(/agent-1/i)).toBeInTheDocument()
  })

  // 10. Expired decision
  it('marks a pending decision as expired when the expired event arrives', () => {
    render(<QuorumVotingRoom wsUrl={WS_URL} />)
    const ws = MockWS.latest()
    act(() => ws.simulateOpen())
    act(() => ws.simulateMessage({ topic: 'read.quorum.proposal', data: makeDecision() }))
    act(() =>
      ws.simulateMessage({ topic: 'read.quorum.expired', data: { decisionId: 'dec-1' } }),
    )
    expect(screen.getByText(/expired/i)).toBeInTheDocument()
  })
})
