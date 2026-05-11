import type { Strength } from '../../agents/types'

export interface Task {
  id: string
  description: string
  requiredStrengths: Strength[]
  assignedTo: string | null
  status: 'pending' | 'in-progress' | 'review' | 'done'
  createdAt: number
  completedAt: number | null
}

export interface DiscussionMessage {
  id: string
  agentId: string
  content: string
  timestamp: number
  type: 'analysis' | 'opinion' | 'system'
}

export interface VoteTopic {
  id: string
  description: string
  status: 'discussing' | 'voting' | 'resolved'
  resolution: string | null
  createdAt: number
  resolvedAt: number | null
}
