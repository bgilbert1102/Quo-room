import { AgentBody } from './AgentBody'
import { useFloorStore } from '../store'
import { AGENT_REGISTRY } from '../../../agents/registry'
import type { AgentDef } from '../../../agents/types'

const STATUS_LABEL: Record<string, string> = {
  idle: 'Idle',
  working: 'Working…',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  voting: 'Voting',
  'on-break': 'On Break',
}

const STATUS_COLOR: Record<string, string> = {
  idle: '#64748B',
  working: '#F59E0B',
  thinking: '#818CF8',
  speaking: '#34D399',
  voting: '#FB923C',
  'on-break': '#94A3B8',
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

  const cardSize = isQueen ? 116 : 90

  return (
    <div
      className="glass glass-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: isQueen ? '20px 24px' : '14px 16px',
        position: 'relative',
        minWidth: isQueen ? 200 : 148,
        border: `1px solid ${agent.color}30`,
        boxShadow: `0 0 ${isQueen ? 24 : 12}px ${agent.color}22`,
        transition: 'box-shadow 0.2s',
        animation: 'pop-in 0.3s ease-out',
      }}
    >
      {/* Status dot */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: STATUS_COLOR[runtime.status] ?? '#64748B',
        boxShadow: `0 0 6px ${STATUS_COLOR[runtime.status] ?? '#64748B'}`,
      }} />

      {/* Break indicator */}
      {isOnBreak && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          fontSize: 14,
        }}>☕</div>
      )}

      {/* Body */}
      <AgentBody
        avatarType={agent.avatarType}
        color={agent.color}
        accentColor={agent.accentColor}
        status={runtime.status}
        size={cardSize}
      />

      {/* Speech bubble */}
      {runtime.currentMessage && (
        <div style={{
          position: 'absolute',
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15 10 26 / 0.95)',
          border: `1px solid ${agent.color}60`,
          borderRadius: 10,
          padding: '5px 10px',
          fontSize: 11,
          color: agent.accentColor,
          whiteSpace: 'nowrap',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          zIndex: 10,
          animation: 'pop-in 0.2s ease-out',
          boxShadow: `0 2px 12px ${agent.color}40`,
        }}>
          {runtime.currentMessage}
          <div style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${agent.color}60`,
          }} />
        </div>
      )}

      {/* Name + model */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontWeight: 700,
          fontSize: isQueen ? 17 : 14,
          color: agent.color,
          letterSpacing: '0.01em',
        }}>
          {isQueen ? '👑 ' : ''}{agent.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
          {agent.model}
        </div>
      </div>

      {/* Status badge */}
      <div className="badge" style={{ color: STATUS_COLOR[runtime.status], fontSize: 10 }}>
        {STATUS_LABEL[runtime.status] ?? runtime.status}
      </div>

      {/* Current task */}
      {currentTask && (
        <div style={{
          fontSize: 10,
          color: 'var(--text-dim)',
          textAlign: 'center',
          maxWidth: 130,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          📋 {currentTask.description}
        </div>
      )}

      {/* Strength tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', maxWidth: 160 }}>
        {agent.strengths.slice(0, isQueen ? 4 : 3).map((s) => (
          <span key={s} className="badge" style={{
            fontSize: 9,
            padding: '1px 6px',
            background: `${agent.color}18`,
            borderColor: `${agent.color}30`,
            color: agent.accentColor,
          }}>
            {s}
          </span>
        ))}
      </div>

      {/* Vote buttons (only during active vote) */}
      {isVoting && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            className="btn btn-success"
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => castVote(agent.id, 'approve')}
            disabled={runtime.vote !== null}
          >
            {runtime.vote === 'approve' ? '✓ Yes' : 'Approve'}
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => castVote(agent.id, 'reject')}
            disabled={runtime.vote !== null}
          >
            {runtime.vote === 'reject' ? '✓ No' : 'Reject'}
          </button>
        </div>
      )}

      {/* Queen: resolve vote button */}
      {isQueen && activeTopic?.status === 'voting' && (
        <button className="btn btn-primary" style={{ marginTop: 4, fontSize: 11 }} onClick={resolveVote}>
          Resolve Vote
        </button>
      )}

      {/* Break room controls (non-queen workers only) */}
      {!isQueen && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 2, fontSize: 10, padding: '3px 8px' }}
          onClick={() => isOnBreak ? recall(agent.id) : sendToBreak(agent.id)}
        >
          {isOnBreak ? '↩ Recall' : '☕ Break'}
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
