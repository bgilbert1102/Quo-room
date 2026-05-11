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
  personality: string // used for stub discussion messages
}

export type AgentStatus = 'idle' | 'working' | 'voting' | 'on-break' | 'speaking' | 'thinking'

export interface AgentRuntimeState {
  agentId: string
  status: AgentStatus
  location: 'floor' | 'break-room'
  currentTaskId: string | null
  currentMessage: string | null
  vote: 'approve' | 'reject' | null
}

// API integration types — filled in when keys are provided
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
