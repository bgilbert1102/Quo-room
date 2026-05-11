import { useBusinessStore } from '../../../business/store'
import { AGENT_REGISTRY } from '../../../agents/registry'

export function ApprovalGate() {
  const approvals = useBusinessStore((s) => s.approvals)
  const approveSpend = useBusinessStore((s) => s.approveSpend)
  const rejectSpend = useBusinessStore((s) => s.rejectSpend)

  const pending = approvals.filter((a) => a.status === 'pending')
  const resolved = approvals.filter((a) => a.status !== 'pending').slice(-4)

  if (approvals.length === 0) {
    return (
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 12,
        textAlign: 'center',
        padding: '16px 0',
      }}>
        No spending decisions pending.
        <br />
        <span style={{ fontSize: 10, opacity: 0.7 }}>
          You'll only be notified here when real money is involved.
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {pending.map((req) => {
        const agent = AGENT_REGISTRY.find((a) => a.id === req.requestedBy)
        return (
          <div
            key={req.id}
            style={{
              background: 'rgba(245 158 11 / 0.08)',
              border: '1px solid rgba(245 158 11 / 0.30)',
              borderRadius: 12,
              padding: '12px 14px',
              animation: 'pop-in 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>💰</span>
              <span style={{ fontWeight: 700, color: '#FCD34D', fontSize: 13 }}>
                Spend Approval Required
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>
              {req.description}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              <strong>Reason:</strong> {req.reason}<br />
              <strong>Platform:</strong> {req.platform} · <strong>Cost:</strong>{' '}
              <span style={{ color: '#FCD34D', fontWeight: 700 }}>${req.costUsd.toFixed(2)}</span>
              {agent && (
                <span> · requested by <span style={{ color: agent.color }}>{agent.name}</span></span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-success"
                style={{ flex: 1, fontSize: 12 }}
                onClick={() => approveSpend(req.id)}
              >
                ✓ Approve ${req.costUsd.toFixed(2)}
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, fontSize: 12 }}
                onClick={() => rejectSpend(req.id)}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        )
      })}

      {/* Resolved history */}
      {resolved.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
            Recent decisions
          </div>
          {resolved.map((req) => (
            <div key={req.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}>
              <span>{req.status === 'approved' ? '✓' : '✗'}</span>
              <span style={{ flex: 1 }}>{req.description}</span>
              <span style={{ color: req.status === 'approved' ? '#4ADE80' : '#F87171' }}>
                ${req.costUsd.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
