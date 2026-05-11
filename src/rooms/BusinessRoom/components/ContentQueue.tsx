import { useBusinessStore } from '../../../business/store'
import { AGENT_REGISTRY } from '../../../agents/registry'
import type { ContentBrief } from '../../../business/types'

const TYPE_EMOJI: Record<string, string> = {
  'tiktok-video': '🎵',
  'youtube-short': '▶️',
  'youtube-video': '📹',
  'etsy-listing': '🛍️',
  'fiverr-gig': '💼',
}

const STATUS_COLOR: Record<string, string> = {
  draft:    '#94A3B8',
  review:   '#FBBF24',
  approved: '#34D399',
  posted:   '#60A5FA',
  rejected: '#F87171',
}

function ContentCard({ brief }: { brief: ContentBrief }) {
  const approve = useBusinessStore((s) => s.approveContent)
  const reject = useBusinessStore((s) => s.rejectContent)
  const markPosted = useBusinessStore((s) => s.markPosted)
  const agent = AGENT_REGISTRY.find((a) => a.id === brief.createdBy)

  return (
    <div
      className="glass"
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        borderLeft: `3px solid ${STATUS_COLOR[brief.status] ?? '#64748B'}`,
        animation: 'slide-up 0.25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 3 }}>
            <span>{TYPE_EMOJI[brief.type] ?? '📄'}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{brief.title}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {brief.hook}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
            <span className="badge" style={{ fontSize: 9, color: STATUS_COLOR[brief.status] }}>
              {brief.status}
            </span>
            {agent && (
              <span className="badge" style={{
                fontSize: 9,
                color: agent.color,
                borderColor: `${agent.color}30`,
              }}>
                {agent.name}
              </span>
            )}
            {brief.costUsd > 0 && (
              <span className="badge" style={{ fontSize: 9, color: '#F59E0B', borderColor: 'rgba(245 158 11/0.3)' }}>
                💰 ${brief.costUsd}
              </span>
            )}
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          {brief.status === 'draft' && (
            <>
              <button className="btn btn-success" style={{ fontSize: 9, padding: '2px 7px' }} onClick={() => approve(brief.id)}>Approve</button>
              <button className="btn btn-danger" style={{ fontSize: 9, padding: '2px 7px' }} onClick={() => reject(brief.id)}>Reject</button>
            </>
          )}
          {brief.status === 'approved' && (
            <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 8px' }} onClick={() => markPosted(brief.id)}>
              Mark Posted
            </button>
          )}
          {brief.status === 'posted' && brief.postedAt && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              {new Date(brief.postedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ContentQueue() {
  const content = useBusinessStore((s) => s.content)

  const draft = content.filter((c) => c.status === 'draft')
  const approved = content.filter((c) => c.status === 'approved')
  const posted = content.filter((c) => c.status === 'posted').slice(-5)
  const rejected = content.filter((c) => c.status === 'rejected')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
        📦 Content Pipeline
        <span className="badge" style={{ marginLeft: 8, fontSize: 9 }}>
          {content.length} pieces
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Awaiting review */}
        {draft.length > 0 && (
          <Section label="⏳ Awaiting Review" count={draft.length}>
            {draft.map((c) => <ContentCard key={c.id} brief={c} />)}
          </Section>
        )}

        {/* Approved — ready to post */}
        {approved.length > 0 && (
          <Section label="✅ Ready to Post" count={approved.length}>
            {approved.map((c) => <ContentCard key={c.id} brief={c} />)}
          </Section>
        )}

        {/* Posted */}
        {posted.length > 0 && (
          <Section label="🚀 Recently Posted" count={posted.length}>
            {posted.map((c) => <ContentCard key={c.id} brief={c} />)}
          </Section>
        )}

        {/* Rejected */}
        {rejected.length > 0 && (
          <Section label="❌ Rejected" count={rejected.length}>
            {rejected.slice(-2).map((c) => <ContentCard key={c.id} brief={c} />)}
          </Section>
        )}

        {content.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '30px 0' }}>
            Agents will generate content briefs as trends are detected.
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'flex', gap: 6, alignItems: 'center' }}>
        {label}
        <span className="badge" style={{ fontSize: 9 }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  )
}
