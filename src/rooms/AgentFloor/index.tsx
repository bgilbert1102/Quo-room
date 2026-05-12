import { useSentience } from '../../agents/sentience'
import { AgentCard } from './components/AgentCard'
import { TaskBoard } from './components/TaskBoard'
import { DiscussionPanel } from './components/DiscussionPanel'
import { BreakRoom } from './components/BreakRoom'
import { QUEEN, WORKERS } from '../../agents/registry'
import { useFloorStore } from './store'
import { useBusinessStore } from '../../business/store'

interface Props {
  onOpenBusiness: () => void
}

export function AgentFloor({ onOpenBusiness }: Props) {
  // Mount the sentience tick engine — agents gain autonomy
  useSentience()

  const runtimes = useFloorStore((s) => s.runtimes)
  const pendingApprovals = useBusinessStore((s) => s.approvals.filter((a) => a.status === 'pending').length)
  const trendCount = useBusinessStore((s) => s.trends.length)
  const contentCount = useBusinessStore((s) => s.content.length)

  const floorWorkers = WORKERS.filter(
    (a) => runtimes.get(a.id)?.location === 'floor',
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '1fr auto',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        overflow: 'hidden',
      }}>
        {/* Left: agent workspace */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 16px 0 20px',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexShrink: 0, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', color: 'var(--neon)' }}>
                QUOROOM
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                AUTONOMOUS HIVE // {WORKERS.length + 1} NODES // SENTIENCE ACTIVE
              </div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={onOpenBusiness}
              style={{ fontSize: 9, letterSpacing: '0.1em',
                borderColor: pendingApprovals > 0 ? 'var(--warn)' : undefined,
                color: pendingApprovals > 0 ? 'var(--warn)' : undefined }}
            >
              BUSINESS{pendingApprovals > 0 ? ` [${pendingApprovals}]` : ''}
            </button>
            {trendCount > 0 && (
              <span className="badge" style={{ color: 'var(--cold)' }}>
                {trendCount} TRENDS
              </span>
            )}
            {contentCount > 0 && (
              <span className="badge" style={{ color: 'var(--warn)' }}>
                {contentCount} BRIEFS
              </span>
            )}
          </div>

          {/* Commander section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 14px',
            marginBottom: 10,
            background: 'rgba(124 58 237 / 0.04)',
            border: '1px solid rgba(124 58 237 / 0.20)',
            flexShrink: 0,
          }}>
            <AgentCard agent={QUEEN} isQueen />
            <div style={{ flex: 1 }}>
              <EnergyBar agentId={QUEEN.id} color={QUEEN.color} />
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 5, letterSpacing: '0.05em', lineHeight: 1.6 }}>
                {QUEEN.businessRole}
              </div>
            </div>
          </div>

          {/* Workers */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 8 }}>
              WORKER NODES // FLOOR
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingBottom: 12 }}>
              {floorWorkers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '16px 0', width: '100%', textAlign: 'center' }}>
                  All workers are on break — they'll return when ready
                </div>
              ) : (
                floorWorkers.map((a) => (
                  <div key={a.id}>
                    <AgentCard agent={a} />
                    <EnergyBar agentId={a.id} color={a.color} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          borderLeft: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TaskBoard />
          </div>
          <div style={{ padding: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DiscussionPanel />
          </div>
        </div>
      </div>

      {/* Break room */}
      <BreakRoom />
    </div>
  )
}

function EnergyBar({ agentId, color }: { agentId: string; color: string }) {
  const energy = useFloorStore((s) => s.runtimes.get(agentId)?.sentience.energy ?? 100)
  const mood   = useFloorStore((s) => s.runtimes.get(agentId)?.sentience.mood ?? 'content')

  const MOOD_CODE: Record<string, string> = {
    excited: 'EXC', focused: 'FOC', content: 'NOM',
    tired: 'LOW', stressed: 'STR', bored: 'IDLE',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <span style={{ fontSize: 8, color: 'var(--text-muted)', minWidth: 24, letterSpacing: '0.08em' }}>
        {MOOD_CODE[mood] ?? 'NOM'}
      </span>
      <div style={{ flex: 1, height: 2, background: 'rgba(255 255 255 / 0.06)' }}>
        <div style={{
          width: `${energy}%`,
          height: '100%',
          background: energy > 60 ? color : energy > 30 ? 'var(--warn)' : 'var(--danger)',
          transition: 'width 1.5s ease, background 1s ease',
        }} />
      </div>
      <span style={{ fontSize: 8, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>
        {Math.round(energy)}%
      </span>
    </div>
  )
}
