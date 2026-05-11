import { useEffect, useRef } from 'react'
import { useFloorStore } from '../store'
import { AGENT_REGISTRY } from '../../../agents/registry'

export function DiscussionPanel() {
  const messages = useFloorStore((s) => s.messages)
  const activeTopic = useFloorStore((s) => s.activeTopic)
  const topicHistory = useFloorStore((s) => s.topicHistory)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
          💬 Discussion
        </span>
        {activeTopic && (
          <span className="badge" style={{ color: '#FB923C', borderColor: 'rgba(249 115 22 / 0.3)' }}>
            🗳 Voting in progress
          </span>
        )}
      </div>

      {/* Active vote topic banner */}
      {activeTopic && (
        <div style={{
          background: 'rgba(249 115 22 / 0.08)',
          border: '1px solid rgba(249 115 22 / 0.25)',
          borderRadius: 10,
          padding: '8px 10px',
          fontSize: 12,
          color: '#FDBA74',
          flexShrink: 0,
          animation: 'pop-in 0.25s ease-out',
        }}>
          <strong>Vote:</strong> {activeTopic.description}
        </div>
      )}

      {/* Resolved topic results */}
      {topicHistory.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          {topicHistory.slice(-1).map((topic) => (
            <div
              key={topic.id}
              style={{
                background: topic.resolution === 'approved'
                  ? 'rgba(34 197 94 / 0.08)' : 'rgba(239 68 68 / 0.08)',
                border: `1px solid ${topic.resolution === 'approved'
                  ? 'rgba(34 197 94 / 0.25)' : 'rgba(239 68 68 / 0.25)'}`,
                borderRadius: 10,
                padding: '6px 10px',
                fontSize: 11,
                color: topic.resolution === 'approved' ? '#4ADE80' : '#F87171',
              }}
            >
              {topic.resolution === 'approved' ? '✓' : '✗'} {topic.description} —{' '}
              <strong>{topic.resolution?.toUpperCase()}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Message feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        paddingRight: 2,
      }}>
        {messages.length === 0 && (
          <div style={{
            color: 'var(--text-muted)',
            fontSize: 12,
            textAlign: 'center',
            padding: '24px 0',
          }}>
            Waiting for discussion…
          </div>
        )}

        {messages.map((msg) => {
          const agent = AGENT_REGISTRY.find((a) => a.id === msg.agentId)
          const isSystem = msg.type === 'system'

          if (isSystem) {
            return (
              <div key={msg.id} style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '2px 0',
                animation: 'slide-up 0.2s ease-out',
              }}>
                — {msg.content} —
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: 8,
                animation: 'slide-up 0.25s ease-out',
                alignItems: 'flex-start',
              }}
            >
              {/* Avatar dot */}
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: agent?.color ?? '#64748B',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: 'white',
                marginTop: 2,
              }}>
                {agent?.name.slice(0, 1) ?? '?'}
              </div>

              {/* Bubble */}
              <div style={{
                background: `${agent?.color ?? '#64748B'}14`,
                border: `1px solid ${agent?.color ?? '#64748B'}28`,
                borderRadius: '4px 10px 10px 10px',
                padding: '6px 10px',
                flex: 1,
              }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: agent?.color ?? 'var(--text-dim)',
                  marginBottom: 2,
                }}>
                  {agent?.name ?? msg.agentId}
                  {agent?.role === 'queen' && ' 👑'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
