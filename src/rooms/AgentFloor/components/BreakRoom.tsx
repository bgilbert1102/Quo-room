import { AgentBody } from './AgentBody'
import { useFloorStore } from '../store'
import { AGENT_REGISTRY, WORKERS } from '../../../agents/registry'

export function BreakRoom() {
  const runtimes = useFloorStore((s) => s.runtimes)
  const recall = useFloorStore((s) => s.recallFromBreakRoom)

  const onBreak = WORKERS.filter((a) => runtimes.get(a.id)?.location === 'break-room')

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      borderTop: '1px solid var(--border)',
      background: 'rgba(255 255 255 / 0.02)',
      minHeight: 96,
      flexShrink: 0,
    }}>
      {/* Label */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        color: 'var(--text-muted)',
        fontSize: 11,
        fontWeight: 600,
        minWidth: 64,
      }}>
        <span style={{ fontSize: 20 }}>🛋️</span>
        <span>Break Room</span>
        {onBreak.length === 0 && (
          <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', opacity: 0.6 }}>
            empty
          </span>
        )}
      </div>

      {/* Couch background decoration */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        minHeight: 72,
        borderRadius: 12,
        padding: '8px 12px',
        background: 'rgba(255 255 255 / 0.02)',
        border: '1px dashed rgba(255 255 255 / 0.07)',
        position: 'relative',
      }}>
        {/* Coffee cup decoration */}
        <div style={{
          position: 'absolute',
          right: 16,
          bottom: 8,
          fontSize: 24,
          opacity: 0.25,
        }}>☕</div>

        {onBreak.length === 0 ? (
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            opacity: 0.5,
            margin: 'auto',
          }}>
            All agents are working
          </div>
        ) : (
          onBreak.map((agent) => {
            const runtime = runtimes.get(agent.id)
            if (!runtime) return null
            return (
              <div
                key={agent.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
                title={`Click to recall ${agent.name}`}
                onClick={() => recall(agent.id)}
              >
                <AgentBody
                  avatarType={agent.avatarType}
                  color={agent.color}
                  accentColor={agent.accentColor}
                  status="on-break"
                  size={54}
                />
                <span style={{ fontSize: 10, color: agent.color }}>{agent.name}</span>
                <span style={{
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  background: 'rgba(255 255 255 / 0.05)',
                  padding: '1px 5px',
                  borderRadius: 4,
                }}>
                  recall ↩
                </span>
              </div>
            )
          })
        )}

        {/* Recall all button */}
        {onBreak.length > 1 && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 10, padding: '3px 8px', marginLeft: 'auto', alignSelf: 'center' }}
            onClick={() => onBreak.forEach((a) => recall(a.id))}
          >
            Recall All
          </button>
        )}
      </div>

      {/* Quick send-to-break for all floor workers */}
      <AllBreakMenu />
    </div>
  )
}

function AllBreakMenu() {
  const runtimes = useFloorStore((s) => s.runtimes)
  const sendToBreak = useFloorStore((s) => s.sendToBreakRoom)

  const onFloor = AGENT_REGISTRY.filter(
    (a) => a.role === 'worker' && runtimes.get(a.id)?.location === 'floor',
  )

  if (onFloor.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {onFloor.map((agent) => (
        <button
          key={agent.id}
          className="btn btn-ghost"
          style={{
            fontSize: 9,
            padding: '2px 7px',
            color: agent.color,
            borderColor: `${agent.color}30`,
          }}
          onClick={() => sendToBreak(agent.id)}
        >
          {agent.name} →☕
        </button>
      ))}
    </div>
  )
}
