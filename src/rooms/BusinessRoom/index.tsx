import { RevenuePanel } from './components/RevenuePanel'
import { TrendFeed } from './components/TrendFeed'
import { ContentQueue } from './components/ContentQueue'
import { ApprovalGate } from './components/ApprovalGate'
import { CredentialsPanel } from './components/CredentialsPanel'
import { useBusinessStore } from '../../business/store'
import { useState } from 'react'

type SideTab = 'approvals' | 'credentials'

export function BusinessRoom({ onBack }: { onBack: () => void }) {
  const [sideTab, setSideTab] = useState<SideTab>('approvals')
  const pendingApprovals = useBusinessStore((s) => s.approvals.filter((a) => a.status === 'pending').length)

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255 255 255 / 0.02)',
        flexShrink: 0,
      }}>
        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onBack}>
          ← Agent Floor
        </button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>
          💼 Business<span style={{ color: '#4ADE80' }}>room</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Passive income engine — agents handle everything
        </div>
        {pendingApprovals > 0 && (
          <div style={{
            marginLeft: 'auto',
            background: '#F59E0B',
            color: '#0D0A1A',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 700,
            animation: 'glow-pulse 1.5s ease-in-out infinite',
          }}>
            {pendingApprovals} approval{pendingApprovals > 1 ? 's' : ''} pending
          </div>
        )}
      </div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 300px',
        overflow: 'hidden',
      }}>
        {/* Left: revenue + trend feed */}
        <div style={{
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}>
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <RevenuePanel />
          </div>
          <div style={{ flex: 1, padding: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <TrendFeed />
          </div>
        </div>

        {/* Center: content pipeline */}
        <div style={{ padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ContentQueue />
        </div>

        {/* Right: approvals + credentials */}
        <div style={{
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {([
              { id: 'approvals' as SideTab, label: '💰 Approvals', badge: pendingApprovals },
              { id: 'credentials' as SideTab, label: '🔑 Keys', badge: 0 },
            ] as const).map(({ id, label, badge }) => (
              <button
                key={id}
                onClick={() => setSideTab(id)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: sideTab === id ? 'rgba(255 255 255 / 0.06)' : 'transparent',
                  borderBottom: sideTab === id ? '2px solid #7C3AED' : '2px solid transparent',
                  color: sideTab === id ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {label}
                {badge > 0 && (
                  <span style={{
                    marginLeft: 5,
                    background: '#F59E0B',
                    color: '#0D0A1A',
                    borderRadius: 999,
                    padding: '0 5px',
                    fontSize: 9,
                    fontWeight: 700,
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {sideTab === 'approvals' && <ApprovalGate />}
            {sideTab === 'credentials' && <CredentialsPanel />}
          </div>
        </div>
      </div>
    </div>
  )
}
