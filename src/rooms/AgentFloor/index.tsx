import { AgentCard } from './components/AgentCard'
import { TaskBoard } from './components/TaskBoard'
import { DiscussionPanel } from './components/DiscussionPanel'
import { BreakRoom } from './components/BreakRoom'
import { QUEEN, WORKERS } from '../../agents/registry'
import { useFloorStore } from './store'

export function AgentFloor() {
  const runtimes = useFloorStore((s) => s.runtimes)

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
      {/* ── Main area ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        overflow: 'hidden',
        gap: 0,
      }}>
        {/* Left: agent workspace */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          overflow: 'hidden',
          padding: '20px 16px 0 20px',
        }}>
          {/* Hive header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 22 }}>🐝</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.02em' }}>
                Quo<span style={{ color: '#7C3AED' }}>room</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                AI Hive — {WORKERS.length + 1} agents online
              </div>
            </div>
          </div>

          {/* Queen section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(124 58 237 / 0.12), rgba(245 158 11 / 0.06))',
            border: '1px solid rgba(124 58 237 / 0.25)',
            flexShrink: 0,
          }}>
            <AgentCard agent={QUEEN} isQueen />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#C4B5FD', marginBottom: 6 }}>
                Queen's Orders
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}>
                Opus assigns tasks to the best-matched worker based on strengths.
                Major decisions go to a group vote — Opus breaks ties.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <ApiStatusBadge />
              </div>
            </div>
          </div>

          {/* Worker grid */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>
              WORKERS — FLOOR
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              paddingBottom: 16,
            }}>
              {floorWorkers.length === 0 ? (
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  padding: '20px 0',
                  width: '100%',
                  textAlign: 'center',
                }}>
                  All workers are on break — recall them below
                </div>
              ) : (
                floorWorkers.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          borderLeft: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {/* Task board */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TaskBoard />
          </div>

          {/* Discussion */}
          <div style={{ padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DiscussionPanel />
          </div>
        </div>
      </div>

      {/* ── Break room (footer strip) ────────────────────────────── */}
      <BreakRoom />
    </div>
  )
}

function ApiStatusBadge() {
  return (
    <div className="badge" style={{ fontSize: 10, color: '#F59E0B', borderColor: 'rgba(245 158 11 / 0.3)' }}>
      ⚠️ API keys pending — stub mode
    </div>
  )
}
