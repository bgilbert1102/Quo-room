export type ModelId =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5'
  | 'gemini-2.5-flash-thinking'
  | 'gemini-2.5-pro'

export type AvatarType = 'queen' | 'sonnet' | 'haiku' | 'thinker' | 'pro'
export type AgentRole = 'queen' | 'worker'

export type Strength =
  | 'strategy'
  | 'reasoning'
  | 'oversight'
  | 'coding'
  | 'analysis'
  | 'writing'
  | 'speed'
  | 'classification'
  | 'deep-analysis'
  | 'long-context'
  | 'math'
  | 'science'
  | 'multimodal'
  | 'creativity'
  | 'search'
  | 'trend-analysis'
  | 'content-creation'
  | 'copywriting'
  | 'social-media'

export type AgentMood = 'excited' | 'focused' | 'content' | 'tired' | 'stressed' | 'bored'

// Governs how this agent behaves autonomously over time
export interface SentienceProfile {
  energyDrainWorking: number  // energy lost per tick while working
  energyDrainIdle: number     // energy lost per tick while idle on floor
  energyRestoreBreak: number  // energy gained per tick in break room
  breakThreshold: number      // go to break when energy drops below this
  returnThreshold: number     // return when energy exceeds this
  curiosityRate: number       // 0-1: probability of curiosity action per tick
  socialRate: number          // 0-1: probability of spontaneous chat per tick
  breakMessages: readonly string[]
  returnMessages: readonly string[]
  idleThoughts: readonly string[]  // things the agent says when bored/curious
  trendReactions: readonly string[]  // reactions when a new trend appears
}

// Runtime sentience — changes each tick
export interface SentienceState {
  energy: number       // 0-100
  motivation: number   // 0-100
  mood: AgentMood
  lastBreakAt: number  // timestamp
  tickCount: number    // total ticks lived
}

export interface AgentDef {
  id: string
  name: string
  model: ModelId
  role: AgentRole
  strengths: Strength[]
  avatarType: AvatarType
  color: string
  accentColor: string
  description: string
  personality: string
  businessRole: string  // what this agent does in the content pipeline
  sentienceProfile: SentienceProfile
}

export type AgentStatus = 'idle' | 'working' | 'voting' | 'on-break' | 'speaking' | 'thinking'

export interface AgentRuntimeState {
  agentId: string
  status: AgentStatus
  location: 'floor' | 'break-room'
  currentTaskId: string | null
  currentMessage: string | null
  vote: 'approve' | 'reject' | null
  sentience: SentienceState
}

// API integration types
export interface ModelCallParams {
  agentId: string
  prompt: string
  context?: string
}

export interface ModelCallResult {
  agentId: string
  content: string
  modelUsed: ModelId
  tokensUsed: number
}
