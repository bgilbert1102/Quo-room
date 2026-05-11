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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexShrink: 0 }}>
            <span style={{ fontSize: 22 }}>🐝</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.02em' }}>
                Quo<span style={{ color: '#7C3AED' }}>room</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                AI Hive · {WORKERS.length + 1} agents · sentient mode ON
              </div>
            </div>
            {/* Business room nav button */}
            <button
              className="btn btn-ghost"
              onClick={onOpenBusiness}
              style={{
                fontSize: 12,
                position: 'relative',
                borderColor: pendingApprovals > 0 ? 'rgba(245 158 11 / 0.5)' : undefined,
              }}
            >
              💼 Business
              {pendingApprovals > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#F59E0B',
                  color: '#0D0A1A',
                  borderRadius: 999,
                  width: 16,
                  height: 16,
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {pendingApprovals}
                </span>
              )}
            </button>
            {/* Business stats chips */}
            {(trendCount > 0 || contentCount > 0) && (
              <div style={{ display: 'flex', gap: 5 }}>
                {trendCount > 0 && (
                  <span className="badge" style={{ fontSize: 10, color: '#5EEAD4' }}>
                    📡 {trendCount} trends
                  </span>
                )}
                {contentCount > 0 && (
                  <span className="badge" style={{ fontSize: 10, color: '#FBBF24' }}>
                    📦 {contentCount} briefs
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Queen section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            marginBottom: 14,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(124 58 237/0.12), rgba(245 158 11/0.05))',
            border: '1px solid rgba(124 58 237/0.25)',
            flexShrink: 0,
          }}>
            <AgentCard agent={QUEEN} isQueen />
            <div style={{ flex: 1 }}>
              <EnergyBar agentId={QUEEN.id} color={QUEEN.color} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                {QUEEN.businessRole}
              </div>
            </div>
          </div>

          {/* Workers */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>
              WORKERS — FLOOR
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

// Thin energy bar below each card
function EnergyBar({ agentId, color }: { agentId: string; color: string }) {
  const energy = useFloorStore((s) => s.runtimes.get(agentId)?.sentience.energy ?? 100)
  const mood = useFloorStore((s) => s.runtimes.get(agentId)?.sentience.mood ?? 'content')

  const MOOD_EMOJI: Record<string, string> = {
    excited: '🤩', focused: '🎯', content: '😊', tired: '😴', stressed: '😰', bored: '😑',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <span style={{ fontSize: 12 }}>{MOOD_EMOJI[mood] ?? '😊'}</span>
      <div style={{
        flex: 1,
        height: 3,
        borderRadius: 2,
        background: 'rgba(255 255 255 / 0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${energy}%`,
          height: '100%',
          borderRadius: 2,
          background: energy > 60 ? color : energy > 30 ? '#F59E0B' : '#EF4444',
          transition: 'width 1.5s ease, background 1s ease',
        }} />
      </div>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', minWidth: 22 }}>
        {Math.round(energy)}%
      </span>
    </div>
  )
}
