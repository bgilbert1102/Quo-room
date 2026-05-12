import { useState } from 'react'
import { useBusinessStore } from '../../../business/store'
import { useSettingsStore } from '../../../settings/store'
import type { Platform } from '../../../business/types'

// ── AI model credentials ──────────────────────────────────────────────────────
function AICredentials() {
  const { anthropicConnected, googleConnected, setAnthropicKey, setGoogleKey } = useSettingsStore()
  const [aKey, setAKey] = useState('')
  const [gKey, setGKey] = useState('')
  const [savedA, setSavedA] = useState(false)
  const [savedG, setSavedG] = useState(false)

  const saveA = () => {
    if (!aKey.trim()) return
    setAnthropicKey(aKey.trim())
    setAKey('')
    setSavedA(true)
    setTimeout(() => setSavedA(false), 2_000)
  }

  const saveG = () => {
    if (!gKey.trim()) return
    setGoogleKey(gKey.trim())
    setGKey('')
    setSavedG(true)
    setTimeout(() => setSavedG(false), 2_000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 2 }}>
        MODEL KEYS — enables real AI responses
      </div>

      {/* Anthropic */}
      <div style={{ padding: '8px 10px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700 }}>ANTHROPIC</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Opus · Sonnet · Haiku</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: anthropicConnected ? 'var(--neon)' : 'var(--text-muted)' }}>
            {anthropicConnected ? '● LIVE' : '○ STUB'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <input type="password" value={aKey}
            onChange={(e) => setAKey(e.target.value)}
            placeholder={anthropicConnected ? 'sk-ant-••• (update key)' : 'sk-ant-…'}
            onKeyDown={(e) => e.key === 'Enter' && saveA()}
            style={inputStyle} />
          <button className={`btn ${savedA ? 'btn-success' : 'btn-ghost'}`}
            style={{ fontSize: 9 }} onClick={saveA}>
            {savedA ? 'OK' : 'SAVE'}
          </button>
        </div>
      </div>

      {/* Google */}
      <div style={{ padding: '8px 10px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: '#0D9488', fontWeight: 700 }}>GOOGLE AI</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Gemini Think · Gemini Pro</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: googleConnected ? 'var(--neon)' : 'var(--text-muted)' }}>
            {googleConnected ? '● LIVE' : '○ STUB'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <input type="password" value={gKey}
            onChange={(e) => setGKey(e.target.value)}
            placeholder={googleConnected ? 'AIza••• (update key)' : 'AIza…'}
            onKeyDown={(e) => e.key === 'Enter' && saveG()}
            style={inputStyle} />
          <button className={`btn ${savedG ? 'btn-success' : 'btn-ghost'}`}
            style={{ fontSize: 9 }} onClick={saveG}>
            {savedG ? 'OK' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Platform credentials ──────────────────────────────────────────────────────
const PLATFORM_CONFIG: Array<{
  platform: Platform
  label: string
  color: string
  hint: string
  envKey: string
  oauthUrl?: string
  manual?: string
}> = [
  {
    platform: 'etsy',
    label: 'ETSY',
    color: '#F1641E',
    hint: 'API key — developers.etsy.com → Apps → Create new app',
    envKey: 'VITE_ETSY_API_KEY',
    oauthUrl: 'https://www.etsy.com/developers/register',
  },
  {
    platform: 'tiktok',
    label: 'TIKTOK',
    color: '#EE1D52',
    hint: 'Access token — TikTok for Business portal → Apps',
    envKey: 'VITE_TIKTOK_ACCESS_TOKEN',
    oauthUrl: 'https://business-api.tiktok.com/portal/docs',
  },
  {
    platform: 'tiktok-shop',
    label: 'TIKTOK SHOP',
    color: '#FF6550',
    hint: 'Seller access token — TikTok Shop Open Platform → seller account required',
    envKey: 'VITE_TIKTOK_SHOP_ACCESS_TOKEN',
    oauthUrl: 'https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9',
  },
  {
    platform: 'youtube',
    label: 'YOUTUBE',
    color: '#FF0000',
    hint: 'OAuth2 token — Google Cloud Console → YouTube Data API v3',
    envKey: 'VITE_YOUTUBE_API_KEY',
    oauthUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
  },
  {
    platform: 'fiverr',
    label: 'FIVERR',
    color: '#1DBF73',
    hint: 'No API — agents draft gig copy for manual posting',
    envKey: 'VITE_FIVERR_TOKEN',
    manual: 'Agents draft Fiverr gig copy. Copy the output and paste into Fiverr manually.',
  },
]

export function CredentialsPanel() {
  const credStatus = useBusinessStore((s) => s.credentialStatus)
  const storeCred  = useBusinessStore((s) => s.setCredential)
  const [inputs, setInputs] = useState<Partial<Record<Platform, string>>>({})
  const [saved,  setSaved]  = useState<Partial<Record<Platform, boolean>>>({})

  function handleSave(platform: Platform) {
    const key = inputs[platform]?.trim() ?? ''
    if (!key) return
    storeCred(platform, key)
    setSaved((s) => ({ ...s, [platform]: true }))
    setInputs((s) => ({ ...s, [platform]: '' }))
    setTimeout(() => setSaved((s) => ({ ...s, [platform]: false })), 2_000)
  }

  function openOAuth(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 9, color: 'var(--warn)', letterSpacing: '0.1em', marginBottom: 4 }}>
        ALL CREDENTIALS STORED IN MEMORY ONLY — never written to disk or git.<br />
        For persistence use .env.local (VITE_* prefix).
      </div>

      <AICredentials />

      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4 }}>
        PLATFORM CREDENTIALS
      </div>

      {PLATFORM_CONFIG.map(({ platform, label, color, hint, oauthUrl, manual }) => {
        const connected = credStatus[platform]
        return (
          <div key={platform} style={{
            padding: '8px 10px',
            border: `1px solid ${connected ? `${color}35` : 'var(--border)'}`,
            background: 'var(--bg-surface)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.06em' }}>
                {label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 9,
                color: connected ? 'var(--neon)' : manual ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                {connected ? '● CONNECTED' : manual ? '○ MANUAL' : '○ NO KEY'}
              </span>
            </div>

            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 }}>
              {hint}
            </div>

            {!manual && (
              <div style={{ display: 'flex', gap: 5 }}>
                <input
                  type="password"
                  value={inputs[platform] ?? ''}
                  onChange={(e) => setInputs((s) => ({ ...s, [platform]: e.target.value }))}
                  placeholder={connected ? '••••••••• (update)' : 'Paste key…'}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave(platform)}
                  style={inputStyle}
                />
                <button className={`btn ${saved[platform] ? 'btn-success' : 'btn-ghost'}`}
                  style={{ fontSize: 9 }} onClick={() => handleSave(platform)}>
                  {saved[platform] ? 'OK' : 'SAVE'}
                </button>
                {oauthUrl && (
                  <button className="btn btn-ghost" style={{ fontSize: 9 }}
                    onClick={() => openOAuth(oauthUrl)}>
                    GET KEY ↗
                  </button>
                )}
              </div>
            )}

            {manual && (
              <div style={{ fontSize: 9, color: 'var(--neon)', lineHeight: 1.5 }}>
                {manual}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  padding: '4px 8px',
  color: 'var(--text)',
  fontSize: 10,
  fontFamily: 'inherit',
}
