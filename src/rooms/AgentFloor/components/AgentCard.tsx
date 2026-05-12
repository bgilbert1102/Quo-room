import { AgentBody } from './AgentBody'
import { useFloorStore } from '../store'
import { AGENT_REGISTRY } from '../../../agents/registry'
import type { AgentDef } from '../../../agents/types'

const STATUS_ABBR: Record<string, string> = {
  idle: 'IDLE',
  working: 'EXEC',
  thinking: 'PROC',
  speaking: 'SPKNG',
  voting: 'VOTE',
  'on-break': 'BRK',
}

const STATUS_COLOR: Record<string, string> = {
  idle: '#344A5E',
  working: '#FF6A00',
  thinking: '#00C8FF',
  speaking: '#00FF87',
  voting: '#FFAA00',
  'on-break': '#1E2D3A',
}

interface Props {
  agent: AgentDef
  isQueen?: boolean
}

export function AgentCard({ agent, isQueen = false }: Props) {
  const runtime = useFloorStore((s) => s.runtimes.get(agent.id))
  const tasks = useFloorStore((s) => s.tasks)
  const sendToBreak = useFloorStore((s) => s.sendToBreakRoom)
  const recall = useFloorStore((s) => s.recallFromBreakRoom)
  const castVote = useFloorStore((s) => s.castVote)
  const resolveVote = useFloorStore((s) => s.resolveVote)
  const activeTopic = useFloorStore((s) => s.activeTopic)

  if (!runtime) return null

  const currentTask = runtime.currentTaskId
    ? tasks.find((t) => t.id === runtime.currentTaskId)
    : null

  const isOnBreak = runtime.location === 'break-room'
  const isVoting = runtime.status === 'voting' && activeTopic?.status === 'voting'
  const statusColor = STATUS_COLOR[runtime.status] ?? '#344A5E'
  const statusAbbr = STATUS_ABBR[runtime.status] ?? runtime.status.toUpperCase()

  const cardSize = isQueen ? 116 : 90

  return (
    <div
      className="agent-card-terminal"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 0,
        position: 'relative',
        minWidth: isQueen ? 200 : 148,
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${agent.color}20`,
        borderRadius: 2,
        boxShadow: `0 0 ${isQueen ? 20 : 10}px ${agent.color}18`,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        animation: 'pop-in 0.3s ease-out',
        cursor: 'default',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${agent.color}50`
        el.style.boxShadow = `0 0 ${isQueen ? 28 : 16}px ${agent.color}30`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${agent.color}20`
        el.style.boxShadow = `0 0 ${isQueen ? 20 : 10}px ${agent.color}18`
      }}
    >
      {/* Top-mounted status bar */}
      <div style={{
        width: '100%',
        height: isQueen ? 22 : 18,
        background: statusColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: isQueen ? 8 : 7,
          fontWeight: 700,
          color: 'rgba(0,0,0,0.85)',
          letterSpacing: '0.12em',
        }}>
          {statusAbbr}
        </span>
        {/* Agent role tag */}
        <span style={{
          fontFamily: 'monospace',
          fontSize: 6,
          fontWeight: 700,
          color: 'rgba(0,0,0,0.6)',
          letterSpacing: '0.1em',
        }}>
          {isQueen ? 'QUEEN' : agent.avatarType.toUpperCase()}
        </span>
      </div>

      {/* Current message strip — replaces speech bubble */}
      {runtime.currentMessage && (
        <div style={{
          width: '100%',
          background: `${agent.color}12`,
          borderBottom: `1px solid ${agent.color}25`,
          padding: '3px 8px',
          boxSizing: 'border-box',
          fontFamily: 'monospace',
          fontSize: 9,
          color: agent.accentColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '0.04em',
        }}>
          &gt; {runtime.currentMessage}
        </div>
      )}

      {/* Body area */}
      <div style={{ padding: `${isQueen ? 12 : 8}px ${isQueen ? 20 : 14}px 0` }}>
        <AgentBody
          avatarType={agent.avatarType}
          color={agent.color}
          accentColor={agent.accentColor}
          status={runtime.status}
          size={cardSize}
        />
      </div>

      {/* Name + model */}
      <div style={{ textAlign: 'center', padding: '0 12px' }}>
        <div style={{
          fontFamily: 'monospace',
          fontWeight: 700,
          fontSize: isQueen ? 13 : 11,
          color: agent.color,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {agent.name}
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: 8,
          color: 'var(--text-muted)',
          marginTop: 2,
          letterSpacing: '0.04em',
          opacity: 0.7,
        }}>
          {agent.model}
        </div>
      </div>

      {/* Status badge */}
      <div className="badge" style={{
        color: statusColor,
        fontSize: 9,
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
        borderColor: `${statusColor}40`,
        background: `${statusColor}15`,
      }}>
        {statusAbbr}
      </div>

      {/* Current task */}
      {currentTask && (
        <div style={{
          fontFamily: 'monospace',
          fontSize: 9,
          color: 'var(--text-dim)',
          textAlign: 'center',
          maxWidth: 130,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '0.03em',
          opacity: 0.75,
          padding: '0 8px',
        }}>
          {currentTask.description}
        </div>
      )}

      {/* Strength tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', maxWidth: 160, padding: '0 8px' }}>
        {agent.strengths.slice(0, isQueen ? 4 : 3).map((s) => (
          <span key={s} className="badge" style={{
            fontSize: 8,
            padding: '1px 5px',
            background: `${agent.color}15`,
            borderColor: `${agent.color}28`,
            color: agent.accentColor,
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderRadius: 1,
          }}>
            {s}
          </span>
        ))}
      </div>

      {/* Vote buttons — only during active vote */}
      {isVoting && (
        <div style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
          <button
            className="btn btn-success"
            style={{ padding: '4px 10px', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.06em', borderRadius: 1 }}
            onClick={() => castVote(agent.id, 'approve')}
            disabled={runtime.vote !== null}
          >
            {runtime.vote === 'approve' ? 'YES [v]' : 'APPROVE'}
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '4px 10px', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.06em', borderRadius: 1 }}
            onClick={() => castVote(agent.id, 'reject')}
            disabled={runtime.vote !== null}
          >
            {runtime.vote === 'reject' ? 'NO [v]' : 'REJECT'}
          </button>
        </div>
      )}

      {/* Queen: RESOLVE button during vote */}
      {isQueen && activeTopic?.status === 'voting' && (
        <button
          className="btn btn-primary"
          style={{ marginBottom: 8, fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.08em', borderRadius: 1 }}
          onClick={resolveVote}
        >
          RESOLVE
        </button>
      )}

      {/* Break controls — non-queen workers only */}
      {!isQueen && (
        <button
          className="btn btn-ghost"
          style={{
            marginBottom: 8,
            fontSize: 9,
            padding: '3px 10px',
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
            borderRadius: 1,
            textTransform: 'uppercase',
          }}
          onClick={() => isOnBreak ? recall(agent.id) : sendToBreak(agent.id)}
        >
          {isOnBreak ? 'RECALL' : 'BREAK'}
        </button>
      )}
    </div>
  )
}

// Re-export a version that takes only an agentId (convenience)
export function AgentCardById({ agentId, isQueen }: { agentId: string; isQueen?: boolean }) {
  const agent = AGENT_REGISTRY.find((a) => a.id === agentId)
  if (!agent) return null
  return <AgentCard agent={agent} isQueen={isQueen ?? false} />
}
