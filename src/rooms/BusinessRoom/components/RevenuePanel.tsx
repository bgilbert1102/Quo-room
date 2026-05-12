import { useBusinessStore } from '../../../business/store'

const PLATFORM_EMOJI: Record<string, string> = {
  etsy:          '🛍️',
  tiktok:        '🎵',
  'tiktok-shop': '🛒',
  youtube:       '▶️',
  fiverr:        '💼',
}

const PLATFORM_COLOR: Record<string, string> = {
  etsy:          '#F1641E',
  tiktok:        '#EE1D52',
  'tiktok-shop': '#FF6550',
  youtube:       '#FF0000',
  fiverr:        '#1DBF73',
}

const PLATFORM_LABEL: Record<string, string> = {
  etsy:          'Etsy',
  tiktok:        'TikTok',
  'tiktok-shop': 'TikTok Shop',
  youtube:       'YouTube',
  fiverr:        'Fiverr',
}

export function RevenuePanel() {
  const revenue = useBusinessStore((s) => s.revenue)
  const credStatus = useBusinessStore((s) => s.credentialStatus)
  const content = useBusinessStore((s) => s.content)

  const totalRevenue = revenue.reduce((acc, r) => acc + r.totalRevenueUsd, 0)
  const totalViews = revenue.reduce((acc, r) => acc + r.totalViews, 0)
  const postedCount = content.filter((c) => c.status === 'posted').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Total */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
      }}>
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#4ADE80' },
          { label: 'Total Views', value: totalViews.toLocaleString(), color: '#60A5FA' },
          { label: 'Content Posted', value: String(postedCount), color: '#FBBF24' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass" style={{ padding: '10px 12px', borderRadius: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Per-platform */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {revenue.map((r) => {
          const connected = credStatus[r.platform]
          return (
            <div key={r.platform} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 10,
              background: `${PLATFORM_COLOR[r.platform]}10`,
              border: `1px solid ${PLATFORM_COLOR[r.platform]}25`,
            }}>
              <span style={{ fontSize: 18 }}>{PLATFORM_EMOJI[r.platform]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>
                    {PLATFORM_LABEL[r.platform] ?? r.platform}
                  </span>
                  <span className="badge" style={{
                    fontSize: 9,
                    color: connected ? '#4ADE80' : '#F59E0B',
                    borderColor: connected ? 'rgba(74 222 128/0.3)' : 'rgba(245 158 11/0.3)',
                    padding: '0 5px',
                  }}>
                    {connected ? '● connected' : '○ stub'}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {r.totalViews.toLocaleString()} views · {r.followers.toLocaleString()} followers
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#4ADE80', fontSize: 13 }}>
                  ${r.totalRevenueUsd.toFixed(2)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                  ${r.weekRevenueUsd.toFixed(2)} this week
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
