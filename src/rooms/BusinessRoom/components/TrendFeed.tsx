import { useBusinessStore } from '../../../business/store'
import { AGENT_REGISTRY } from '../../../agents/registry'

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
  'tiktok-shop': 'TT Shop',
  youtube:       'YouTube',
  fiverr:        'Fiverr',
}

export function TrendFeed() {
  const trends = useBusinessStore((s) => s.trends)
  const planContent = useBusinessStore((s) => s.planContent)

  const sorted = [...trends].sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 12)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
        📡 Trend Feed
        <span className="badge" style={{ marginLeft: 8, fontSize: 9 }}>
          {trends.length} detected
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
            Agents are scanning for trends…
          </div>
        )}
        {sorted.map((trend) => {
          const agent = AGENT_REGISTRY.find((a) => a.id === trend.detectedBy)
          return (
            <div
              key={trend.id}
              className="glass"
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                borderColor: `${PLATFORM_COLOR[trend.platform]}30`,
                animation: 'pop-in 0.25s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                    {trend.topic}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    {trend.keywords.slice(0, 3).map((k) => (
                      <span key={k} className="badge" style={{ fontSize: 9, padding: '0 5px' }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {/* Score bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 48,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255 255 255 / 0.1)',
                    }}>
                      <div style={{
                        width: `${trend.score}%`,
                        height: '100%',
                        borderRadius: 2,
                        background: trend.score > 75 ? '#4ADE80' : trend.score > 50 ? '#FBBF24' : '#F87171',
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 22 }}>
                      {trend.score}
                    </span>
                  </div>
                  <span className="badge" style={{
                    fontSize: 9,
                    padding: '0 5px',
                    color: PLATFORM_COLOR[trend.platform],
                    borderColor: `${PLATFORM_COLOR[trend.platform]}40`,
                  }}>
                    {PLATFORM_LABEL[trend.platform] ?? trend.platform}
                  </span>
                </div>
              </div>
              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                  via {agent?.name ?? trend.detectedBy} · {new Date(trend.detectedAt).toLocaleTimeString()}
                </span>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 9, padding: '2px 7px' }}
                  onClick={() => planContent(trend.id, trend.detectedBy)}
                >
                  Plan content →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
