import { useState } from 'react'
import { useBusinessStore } from '../../../business/store'
import type { Platform } from '../../../business/types'

const PLATFORM_CONFIG: Array<{
  platform: Platform
  label: string
  emoji: string
  color: string
  hint: string
  docsUrl: string
}> = [
  {
    platform: 'etsy',
    label: 'Etsy',
    emoji: '🛍️',
    color: '#F1641E',
    hint: 'API key from developers.etsy.com',
    docsUrl: 'https://developers.etsy.com/documentation',
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    emoji: '🎵',
    color: '#EE1D52',
    hint: 'Access token from TikTok for Business',
    docsUrl: 'https://business-api.tiktok.com/portal/docs',
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    emoji: '▶️',
    color: '#FF0000',
    hint: 'OAuth2 token from Google Cloud Console',
    docsUrl: 'https://developers.google.com/youtube/v3',
  },
  {
    platform: 'fiverr',
    label: 'Fiverr',
    emoji: '💼',
    color: '#1DBF73',
    hint: 'Fiverr gig copy is drafted for manual posting (no public API)',
    docsUrl: '',
  },
]

export function CredentialsPanel() {
  const credStatus = useBusinessStore((s) => s.credentialStatus)
  const storeCred = useBusinessStore((s) => s.setCredential)
  const [inputs, setInputs] = useState<Partial<Record<Platform, string>>>({})
  const [saved, setSaved] = useState<Partial<Record<Platform, boolean>>>({})

  function handleSave(platform: Platform) {
    const key = inputs[platform]?.trim() ?? ''
    if (!key) return
    storeCred(platform, key)
    setSaved((s) => ({ ...s, [platform]: true }))
    setInputs((s) => ({ ...s, [platform]: '' }))
    setTimeout(() => setSaved((s) => ({ ...s, [platform]: false })), 2_000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        API credentials are stored in memory only and never written to disk or git.
        For persistence, add them to <code style={{ color: '#C4B5FD' }}>.env.local</code> instead.
      </div>

      {PLATFORM_CONFIG.map(({ platform, label, emoji, color, hint, docsUrl }) => {
        const connected = credStatus[platform]
        const isManual = platform === 'fiverr'
        return (
          <div
            key={platform}
            className="glass"
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              borderColor: connected ? `${color}40` : 'var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span style={{ fontWeight: 700, fontSize: 12, color }}>
                {label}
              </span>
              <span className="badge" style={{
                fontSize: 9,
                marginLeft: 'auto',
                color: connected ? '#4ADE80' : '#94A3B8',
                borderColor: connected ? 'rgba(74 222 128/0.3)' : 'var(--border)',
              }}>
                {connected ? '● connected' : isManual ? '○ manual' : '○ not connected'}
              </span>
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              {hint}
              {docsUrl && (
                <span style={{ marginLeft: 4, color: '#818CF8' }}>
                  (docs: {docsUrl})
                </span>
              )}
            </div>

            {!isManual && (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="password"
                  value={inputs[platform] ?? ''}
                  onChange={(e) => setInputs((s) => ({ ...s, [platform]: e.target.value }))}
                  placeholder={connected ? '••••••••••••••• (update key)' : 'Paste API key…'}
                  style={{
                    flex: 1,
                    background: 'rgba(255 255 255 / 0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    padding: '5px 9px',
                    color: 'var(--text)',
                    fontSize: 11,
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave(platform)}
                />
                <button
                  className={`btn ${saved[platform] ? 'btn-success' : 'btn-ghost'}`}
                  style={{ fontSize: 11, padding: '5px 10px' }}
                  onClick={() => handleSave(platform)}
                >
                  {saved[platform] ? '✓' : 'Save'}
                </button>
              </div>
            )}
            {isManual && (
              <div style={{ fontSize: 10, color: '#4ADE80' }}>
                Agents draft Fiverr gig copy → you paste it into Fiverr manually
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
