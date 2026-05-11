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
        ) : (
          <WorkerBody color={color} accentColor={accentColor} avatarType={avatarType} status={status} />
        )}
      </svg>
    </div>
  )
}

// ── Shared face ──────────────────────────────────────────────────────────────
function Face({ cx, cy, status, color }: { cx: number; cy: number; status: AgentStatus; color: string }) {
  const happy = status !== 'on-break'
  return (
    <>
      {/* Eyes */}
      <ellipse cx={cx - 6} cy={cy - 2} rx={3.5} ry={status === 'working' ? 2 : 3.5} fill="white" />
      <ellipse cx={cx + 6} cy={cy - 2} rx={3.5} ry={status === 'working' ? 2 : 3.5} fill="white" />
      <circle cx={cx - 5.5} cy={cy - 2} r={1.8} fill="#1a1a2e" />
      <circle cx={cx + 6.5} cy={cy - 2} r={1.8} fill="#1a1a2e" />
      {/* Pupil shine */}
      <circle cx={cx - 4.5} cy={cy - 3} r={0.6} fill="white" />
      <circle cx={cx + 7.5} cy={cy - 3} r={0.6} fill="white" />
      {/* Mouth */}
      {happy ? (
        <path d={`M${cx - 5} ${cy + 6} Q${cx} ${cy + 10} ${cx + 5} ${cy + 6}`}
          stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : (
        <path d={`M${cx - 4} ${cy + 9} Q${cx} ${cy + 6} ${cx + 4} ${cy + 9}`}
          stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      {/* Thinking dots */}
      {status === 'thinking' && (
        <>
          <circle cx={cx - 4} cy={cy + 13} r={1.5} fill={color} style={{ animation: 'typing 1.2s 0s infinite' }} />
          <circle cx={cx}     cy={cy + 13} r={1.5} fill={color} style={{ animation: 'typing 1.2s 0.2s infinite' }} />
          <circle cx={cx + 4} cy={cy + 13} r={1.5} fill={color} style={{ animation: 'typing 1.2s 0.4s infinite' }} />
        </>
      )}
    </>
  )
}

// ── Queen (Opus) body ────────────────────────────────────────────────────────
function QueenBody({ color, accentColor, status }: { color: string; accentColor: string; status: AgentStatus }) {
  return (
    <>
      {/* Glow ring */}
      <circle cx="40" cy="34" r="26" fill="none" stroke={color} strokeWidth="2"
        opacity="0.35" style={{ animation: 'pulse-ring 2.5s ease-in-out infinite' }} />

      {/* Crown */}
      <polygon points="22,22 28,10 34,20 40,6 46,20 52,10 58,22" fill={accentColor} />
      <rect x="22" y="19" width="36" height="6" rx="2" fill={accentColor} />
      {/* Crown jewels */}
      <circle cx="28" cy="18" r="2.5" fill="#EF4444" />
      <circle cx="40" cy="12" r="3"   fill={color} />
      <circle cx="52" cy="18" r="2.5" fill="#3B82F6" />

      {/* Head */}
      <circle cx="40" cy="37" r="18" fill={color} />

      {/* Face */}
      <Face cx={40} cy={35} status={status} color={color} />

      {/* Body */}
      <rect x="28" y="56" width="24" height="18" rx="10" fill={color} />

      {/* Chest star */}
      <polygon points="40,60 41.5,64.5 46,64.5 42.5,67 44,71.5 40,69 36,71.5 37.5,67 34,64.5 38.5,64.5"
        fill={accentColor} transform="scale(0.7) translate(17,22)" />

      {/* Arms */}
      <rect x="14" y="57" width="13" height="7" rx="3.5" fill={color} />
      <rect x="53" y="57" width="13" height="7" rx="3.5" fill={color} />

      {/* Hands */}
      <circle cx="14" cy="60" r="3.5" fill={color} />
      <circle cx="66" cy="60" r="3.5" fill={color} />

      {/* Legs */}
      <rect x="32" y="73" width="7" height="7" rx="3" fill={color} />
      <rect x="41" y="73" width="7" height="7" rx="3" fill={color} />
    </>
  )
}

// ── Worker body ──────────────────────────────────────────────────────────────
function WorkerBody({ color, accentColor, avatarType, status }: {
  color: string
  accentColor: string
  avatarType: AvatarType
  status: AgentStatus
}) {
  return (
    <>
      {/* Head */}
      <circle cx="40" cy="30" r="16" fill={color} />

      {/* Accessory overlay */}
      <AvatarAccessory type={avatarType} color={color} accentColor={accentColor} />

      {/* Face */}
      <Face cx={40} cy={28} status={status} color={color} />

      {/* Body */}
      <rect x="29" y="47" width="22" height="18" rx="9" fill={color} />

      {/* Chest icon */}
      <ChestIcon type={avatarType} color={accentColor} />

      {/* Arms */}
      <rect x="16" y="49" width="12" height="6" rx="3" fill={color} />
      <rect x="52" y="49" width="12" height="6" rx="3" fill={color} />

      {/* Hands */}
      <circle cx="16" cy="52" r="3" fill={color} />
      <circle cx="64" cy="52" r="3" fill={color} />

      {/* Legs */}
      <rect x="33" y="64" width="6" height="8" rx="3" fill={color} />
      <rect x="41" y="64" width="6" height="8" rx="3" fill={color} />
    </>
  )
}

// ── Avatar accessories (head ornaments) ──────────────────────────────────────
function AvatarAccessory({ type, color: _color, accentColor }: {
  type: AvatarType
  color: string
  accentColor: string
}) {
  switch (type) {
    case 'sonnet':
      // Headphones
      return (
        <>
          <path d="M24,30 Q24,14 40,14 Q56,14 56,30" stroke={accentColor} strokeWidth="3" fill="none" />
          <rect x="21" y="28" width="6" height="8" rx="3" fill={accentColor} />
          <rect x="53" y="28" width="6" height="8" rx="3" fill={accentColor} />
        </>
      )
    case 'haiku':
      // Cherry blossom petals
      return (
        <>
          <circle cx="40" cy="13" r="4" fill="#FECDD3" opacity="0.9" />
          <ellipse cx="34" cy="16" rx="3.5" ry="2.5" fill="#FDA4AF" opacity="0.8" transform="rotate(-30 34 16)" />
          <ellipse cx="46" cy="16" rx="3.5" ry="2.5" fill="#FDA4AF" opacity="0.8" transform="rotate(30 46 16)" />
          <circle cx="40" cy="13" r="1.5" fill="#F43F5E" />
        </>
      )
    case 'thinker':
      // Spinning thought orbits
      return (
        <>
          <circle cx="40" cy="12" r="3.5" fill={accentColor} opacity="0.85"
            style={{ animation: 'thinking-spin 4s linear infinite', transformOrigin: '40px 25px' }} />
          <circle cx="26" cy="22" r="2.5" fill={accentColor} opacity="0.6"
            style={{ animation: 'thinking-spin 4s linear infinite reverse', transformOrigin: '40px 30px' }} />
        </>
      )
    case 'pro':
      // Gem / diamond
      return (
        <>
          <polygon points="40,8 46,14 40,20 34,14" fill={accentColor} opacity="0.9" />
          <polygon points="40,8 46,14 40,14" fill="white" opacity="0.3" />
        </>
      )
    default:
      return null
  }
}

// ── Chest icons ───────────────────────────────────────────────────────────────
function ChestIcon({ type, color }: { type: AvatarType; color: string }) {
  switch (type) {
    case 'sonnet':
      // Musical note
      return (
        <g fill={color} transform="translate(36,50)">
          <rect x="3" y="0" width="2" height="8" rx="1" />
          <ellipse cx="2.5" cy="8.5" rx="2.5" ry="1.8" />
          <rect x="3" y="0" width="5" height="2" rx="1" />
        </g>
      )
    case 'haiku':
      // Leaf / petal
      return (
        <ellipse cx="40" cy="56" rx="4" ry="6" fill={color} opacity="0.9"
          transform="rotate(-20 40 56)" />
      )
    case 'thinker':
      // Infinity symbol
      return (
        <text x="40" y="60" textAnchor="middle" fontSize="10" fill={color} fontWeight="bold">∞</text>
      )
    case 'pro':
      // Star
      return (
        <polygon points="40,50 41.5,54.5 46,54.5 42.5,57 44,61.5 40,59 36,61.5 37.5,57 34,54.5 38.5,54.5"
          fill={color} />
      )
    default:
      return null
  }
}
