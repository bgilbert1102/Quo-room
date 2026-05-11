import { useState } from 'react'
import { useFloorStore } from '../store'
import { AGENT_REGISTRY } from '../../../agents/registry'

const STATUS_COLOR = {
  pending: '#F59E0B',
  'in-progress': '#60A5FA',
  review: '#A78BFA',
  done: '#34D399',
}

const STATUS_ICON = {
  pending: '⏳',
  'in-progress': '⚡',
  review: '👁',
  done: '✓',
}

export function TaskBoard() {
  const [input, setInput] = useState('')
  const tasks = useFloorStore((s) => s.tasks)
  const submitTask = useFloorStore((s) => s.submitTask)
  const completeTask = useFloorStore((s) => s.completeTask)
  const startDiscussion = useFloorStore((s) => s.startDiscussion)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    submitTask(trimmed)
    setInput('')
  }

  const active = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
          📋 Task Board
        </span>
        <span className="badge">{tasks.length} total</span>
      </div>

      {/* New task input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a task for Opus to assign…"
          style={{
            flex: 1,
            background: 'rgba(255 255 255 / 0.05)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            color: 'var(--text)',
            fontSize: 12,
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
          Assign
        </button>
      </form>

      {/* Vote trigger */}
      <form onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem('vote') as HTMLInputElement).value.trim(); if (v) { startDiscussion(v); (e.currentTarget.elements.namedItem('vote') as HTMLInputElement).value = '' } }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            name="vote"
            placeholder="Major decision to put to a vote…"
            style={{
              flex: 1,
              background: 'rgba(255 255 255 / 0.05)',
              border: '1px solid rgba(249 115 22 / 0.3)',
              borderRadius: 8,
              padding: '6px 10px',
              color: 'var(--text)',
              fontSize: 12,
            }}
          />
          <button type="submit" className="btn" style={{
            padding: '6px 12px',
            fontSize: 12,
            background: 'rgba(249 115 22 / 0.15)',
            color: '#FB923C',
            border: '1px solid rgba(249 115 22 / 0.3)',
          }}>
            🗳 Vote
          </button>
        </div>
      </form>

      {/* Active tasks */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {active.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
            No active tasks — assign one above
          </div>
        )}
        {active.map((task) => {
          const agent = task.assignedTo
            ? AGENT_REGISTRY.find((a) => a.id === task.assignedTo)
            : null
          return (
            <div
              key={task.id}
              className="glass"
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                borderColor: `${STATUS_COLOR[task.status]}30`,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                animation: 'slide-up 0.25s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>
                  {STATUS_ICON[task.status]} {task.description}
                </span>
                {task.status === 'in-progress' && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 10, padding: '2px 6px', flexShrink: 0 }}
                    onClick={() => completeTask(task.id)}
                  >
                    Done
                  </button>
                )}
              </div>
              {agent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: agent.color,
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {agent.name} · {task.requiredStrengths.slice(0, 2).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {/* Completed tasks (collapsed) */}
        {done.length > 0 && (
          <div style={{ marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              ✓ {done.length} completed
            </div>
            {done.slice(-3).map((task) => (
              <div key={task.id} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 0' }}>
                {task.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
