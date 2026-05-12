import type { AgentStatus, AvatarType } from '../../../agents/types'

interface Props {
  avatarType: AvatarType
  color: string
  accentColor: string
  status: AgentStatus
  size?: number
}

export function AgentBody({ avatarType, color, accentColor, status, size = 96 }: Props) {
  const cls = `agent-${status === 'on-break' ? 'on-break' : status}`
  return (
    <div className={cls} style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" width={size} height={size} style={{ overflow: 'visible' }}>
        {avatarType === 'queen' ? (
          <QueenBody color={color} accentColor={accentColor} status={status} />
        ) : avatarType === 'sonnet' ? (
          <SonnetBody color={color} accentColor={accentColor} status={status} />
        ) : avatarType === 'haiku' ? (
          <HaikuBody color={color} accentColor={accentColor} status={status} />
        ) : avatarType === 'thinker' ? (
          <ThinkerBody color={color} accentColor={accentColor} status={status} />
        ) : (
          <ProBody color={color} accentColor={accentColor} status={status} />
        )}
      </svg>
    </div>
  )
}

// ── Queen: Hexagonal command node ─────────────────────────────────────────────
function QueenBody({ color, accentColor, status }: { color: string; accentColor: string; status: AgentStatus }) {
  // Hex points helper: flat-top hex centered at cx,cy with radius r
  const hex = (cx: number, cy: number, r: number): string => {
    const pts: string[] = []
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`)
    }
    return pts.join(' ')
  }

  // Six spoke endpoints (same angles as hex vertices)
  const spokeNodes = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    const r = 28
    return { x: 40 + r * Math.cos(a), y: 38 + r * Math.sin(a) }
  })

  const statusText = status === 'voting' ? 'VOTE' : 'EXEC'

  return (
    <>
      {/* Outer hex ring — pulsing */}
      <polygon
        points={hex(40, 38, 34)}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
        style={{ animation: 'pulse-ring 2.5s ease-in-out infinite' }}
      />

      {/* Spokes to outer nodes */}
      {spokeNodes.map((n, i) => (
        <line
          key={i}
          x1="40" y1="38"
          x2={n.x} y2={n.y}
          stroke={color}
          strokeWidth="0.75"
          opacity="0.5"
        />
      ))}

      {/* Outer spoke nodes */}
      {spokeNodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x} cy={n.y} r="2.5"
          fill={accentColor}
          opacity="0.8"
          style={{ animation: `data-blink ${1.2 + i * 0.15}s ${i * 0.1}s ease-in-out infinite` }}
        />
      ))}

      {/* Inner hex body */}
      <polygon
        points={hex(40, 38, 20)}
        fill={`${color}22`}
        stroke={color}
        strokeWidth="1.5"
      />

      {/* Inner hex fill highlight */}
      <polygon
        points={hex(40, 38, 14)}
        fill={`${color}18`}
        stroke={accentColor}
        strokeWidth="0.75"
        opacity="0.6"
      />

      {/* Central glowing core */}
      <circle
        cx="40" cy="38" r="6"
        fill={color}
        style={{ animation: 'core-pulse 1.8s ease-in-out infinite' }}
      />
      <circle cx="40" cy="38" r="3" fill={accentColor} opacity="0.9" />

      {/* Status text */}
      <text
        x="40" y="72"
        textAnchor="middle"
        fontSize="7"
        fontFamily="monospace"
        fill={accentColor}
        letterSpacing="2"
        opacity="0.9"
      >
        {statusText}
      </text>
    </>
  )
}

// ── Sonnet: Terminal window ───────────────────────────────────────────────────
function SonnetBody({ color, accentColor, status }: { color: string; accentColor: string; status: AgentStatus }) {
  const isActive = status !== 'on-break'
  const progressWidth = status === 'working' ? 52 : status === 'thinking' ? 30 : 18

  return (
    <>
      {/* Terminal frame */}
      <rect x="8" y="10" width="64" height="58" rx="1"
        fill="rgba(0,0,0,0.6)"
        stroke={color}
        strokeWidth="1.5"
      />

      {/* Title bar */}
      <rect x="8" y="10" width="64" height="12" rx="1"
        fill={`${color}30`}
        stroke="none"
      />

      {/* Title bar dots */}
      <circle cx="17" cy="16" r="2.5" fill={`${color}80`} />
      <circle cx="25" cy="16" r="2.5" fill={`${accentColor}60`} />

      {/* Title bar label */}
      <text x="40" y="19" textAnchor="middle" fontSize="5.5" fontFamily="monospace"
        fill={accentColor} opacity="0.7" letterSpacing="1">
        TERM
      </text>

      {/* Content lines — simulate text */}
      <rect x="14" y="28" width="36" height="2" rx="0.5" fill={color} opacity="0.5" />
      <rect x="14" y="33" width="48" height="2" rx="0.5" fill={color} opacity="0.35" />
      <rect x="14" y="38" width="28" height="2" rx="0.5" fill={color} opacity="0.4" />
      <rect x="14" y="43" width="42" height="2" rx="0.5" fill={color} opacity="0.3" />
      <rect x="14" y="48" width="20" height="2" rx="0.5" fill={accentColor} opacity="0.5" />

      {/* Blinking cursor */}
      {isActive && (
        <rect
          x="35" y="48" width="5" height="2"
          fill={accentColor}
          style={{ animation: 'cursor-blink 1s step-end infinite' }}
        />
      )}

      {/* Progress bar track */}
      <rect x="14" y="58" width="52" height="3" rx="0.5"
        fill="rgba(255,255,255,0.05)"
        stroke={`${color}40`}
        strokeWidth="0.5"
      />
      {/* Progress bar fill */}
      <rect x="14" y="58" width={progressWidth} height="3" rx="0.5"
        fill={accentColor}
        opacity="0.8"
        style={{ transition: 'width 0.4s ease' }}
      />
    </>
  )
}

// ── Haiku: 5-7-5 syllable block pattern ──────────────────────────────────────
function HaikuBody({ color, accentColor, status }: { color: string; accentColor: string; status: AgentStatus }) {
  const pulse = status === 'working' || status === 'thinking'

  // Row definitions: [count, y, blockW, blockH]
  const rows: Array<{ count: number; y: number; bw: number; bh: number }> = [
    { count: 5, y: 14, bw: 9,  bh: 10 },
    { count: 7, y: 30, bw: 7,  bh: 9  },
    { count: 5, y: 45, bw: 9,  bh: 10 },
  ]

  return (
    <>
      {rows.map((row, ri) => {
        const totalW = row.count * row.bw + (row.count - 1) * 2
        const startX = 40 - totalW / 2
        return row.count > 0 && Array.from({ length: row.count }, (_, ci) => {
          const delay = (ri * row.count + ci) * 0.07
          return (
            <rect
              key={`${ri}-${ci}`}
              x={startX + ci * (row.bw + 2)}
              y={row.y}
              width={row.bw}
              height={row.bh}
              rx="0.5"
              fill={ci % 2 === 0 ? color : accentColor}
              opacity={pulse ? 0.85 : 0.55}
              style={pulse ? { animation: `data-blink 0.6s ${delay.toFixed(2)}s ease-in-out infinite` } : undefined}
            />
          )
        })
      })}

      {/* Separator lines between rows */}
      <line x1="12" y1="27" x2="68" y2="27" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="12" y1="42" x2="68" y2="42" stroke={color} strokeWidth="0.5" opacity="0.3" />

      {/* Signal dot below */}
      <circle
        cx="40" cy="64" r="3"
        fill={accentColor}
        style={{ animation: 'core-pulse 0.8s ease-in-out infinite' }}
      />
      <circle cx="40" cy="64" r="1.2" fill={color} opacity="0.9" />
    </>
  )
}

// ── Thinker: Dual orbital rings ───────────────────────────────────────────────
function ThinkerBody({ color, accentColor, status }: { color: string; accentColor: string; status: AgentStatus }) {
  const isThinking = status === 'thinking'

  return (
    <>
      {/* Dashed outer analysis ring */}
      <circle cx="40" cy="38" r="30"
        fill="none"
        stroke={color}
        strokeWidth="0.75"
        strokeDasharray="4 3"
        opacity="0.3"
      />

      {/* Horizontal orbital ellipse */}
      <ellipse cx="40" cy="38" rx="26" ry="10"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Vertical orbital ellipse */}
      <ellipse cx="40" cy="38" rx="10" ry="26"
        fill="none"
        stroke={accentColor}
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Orbiting node — horizontal orbit */}
      <circle cx="66" cy="38" r="4"
        fill={color}
        style={{ animation: 'orbit 3s linear infinite', transformOrigin: '40px 38px' }}
      />

      {/* Orbiting node — vertical orbit (reverse) */}
      <circle cx="40" cy="12" r="3"
        fill={accentColor}
        style={{ animation: 'orbit-rev 4s linear infinite', transformOrigin: '40px 38px' }}
      />

      {/* Central core */}
      <circle cx="40" cy="38" r="6"
        fill={`${color}30`}
        stroke={color}
        strokeWidth="1.5"
        style={{ animation: 'core-pulse 2s ease-in-out infinite' }}
      />
      <circle cx="40" cy="38" r="2.5" fill={accentColor} opacity="0.9" />

      {/* SCAN label when thinking */}
      {isThinking && (
        <text
          x="40" y="72"
          textAnchor="middle"
          fontSize="6.5"
          fontFamily="monospace"
          fill={accentColor}
          letterSpacing="2"
          opacity="0.9"
          style={{ animation: 'cursor-blink 1s step-end infinite' }}
        >
          SCAN
        </text>
      )}
    </>
  )
}

// ── Pro: Diamond with internal facets ─────────────────────────────────────────
function ProBody({ color, accentColor, status }: { color: string; accentColor: string; status: AgentStatus }) {
  // Main rhombus: top, right, bottom, left vertices
  const top    = '40,8'
  const right  = '68,38'
  const bottom = '40,68'
  const left   = '12,38'
  const center = '40,38'

  const isActive = status !== 'on-break'

  return (
    <>
      {/* Outer glow ring */}
      {isActive && (
        <polygon
          points={`${top} ${right} ${bottom} ${left}`}
          fill="none"
          stroke={color}
          strokeWidth="0.75"
          opacity="0.25"
          style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
        />
      )}

      {/* Four triangular facets */}
      {/* Top-left facet */}
      <polygon points={`${top} ${center} ${left}`}
        fill={`${color}35`} stroke={color} strokeWidth="0.75" />
      {/* Top-right facet */}
      <polygon points={`${top} ${right} ${center}`}
        fill={`${color}20`} stroke={color} strokeWidth="0.75" />
      {/* Bottom-right facet */}
      <polygon points={`${center} ${right} ${bottom}`}
        fill={`${accentColor}20`} stroke={accentColor} strokeWidth="0.75" opacity="0.7" />
      {/* Bottom-left facet */}
      <polygon points={`${left} ${center} ${bottom}`}
        fill={`${accentColor}12`} stroke={color} strokeWidth="0.75" opacity="0.6" />

      {/* Diagonal light lines (highlight sheen) */}
      <line x1="40" y1="8"  x2="68" y2="38" stroke="white" strokeWidth="0.5" opacity="0.12" />
      <line x1="12" y1="38" x2="40" y2="8"  stroke="white" strokeWidth="0.5" opacity="0.08" />

      {/* Inner diamond */}
      <polygon
        points="40,22 52,38 40,54 28,38"
        fill={`${color}25`}
        stroke={color}
        strokeWidth="1"
        style={isActive ? { animation: 'core-pulse 2.2s ease-in-out infinite' } : undefined}
      />

      {/* Central highlight circle */}
      <circle cx="40" cy="38" r="4"
        fill={accentColor}
        opacity="0.85"
      />
      <circle cx="38" cy="35" r="1.5" fill="white" opacity="0.4" />
    </>
  )
}
