import { create } from 'zustand'
import { AGENT_REGISTRY } from '../../agents/registry'
import { assignBestWorker, generateStubOpinion, opusAnalyzeTask } from '../../agents/orchestrator'
import type { AgentMood, AgentRuntimeState, AgentStatus, SentienceState } from '../../agents/types'
import type { DiscussionMessage, Task, VoteTopic } from './types'

let _taskSeq = 0
let _msgSeq = 0
let _voteSeq = 0

const initialSentience = (): SentienceState => ({
  energy: 85 + Math.floor(Math.random() * 15),
  motivation: 70 + Math.floor(Math.random() * 20),
  mood: 'focused' as AgentMood,
  lastBreakAt: 0,
  tickCount: 0,
})

const initialRuntimes = (): Map<string, AgentRuntimeState> =>
  new Map(
    AGENT_REGISTRY.map((a) => [
      a.id,
      {
        agentId: a.id,
        status: 'idle' as AgentStatus,
        location: 'floor' as const,
        currentTaskId: null,
        currentMessage: null,
        vote: null,
        sentience: initialSentience(),
      },
    ]),
  )

interface FloorState {
  runtimes: Map<string, AgentRuntimeState>
  tasks: Task[]
  messages: DiscussionMessage[]
  activeTopic: VoteTopic | null
  topicHistory: VoteTopic[]

  // Agent status / messaging
  setStatus: (agentId: string, status: AgentStatus) => void
  setMessage: (agentId: string, message: string | null) => void
  addMessage: (agentId: string, content: string, type: DiscussionMessage['type']) => void

  // Sentience
  updateSentience: (agentId: string, s: SentienceState) => void
  autonomousBreak: (agentId: string, message: string, now: number) => void
  autonomousReturn: (agentId: string, message: string) => void

  // Manual break controls
  sendToBreakRoom: (agentId: string) => void
  recallFromBreakRoom: (agentId: string) => void

  // Tasks
  submitTask: (rawInput: string) => void
  completeTask: (taskId: string) => void

  // Voting
  openVote: (description: string) => void
  castVote: (agentId: string, choice: 'approve' | 'reject') => void
  resolveVote: () => void
  startDiscussion: (topicDescription: string) => void

  reset: () => void
}

export const useFloorStore = create<FloorState>()((set, get) => ({
  runtimes: initialRuntimes(),
  tasks: [],
  messages: [],
  activeTopic: null,
  topicHistory: [],

  setStatus: (agentId, status) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return { runtimes: new Map(s.runtimes).set(agentId, { ...prev, status }) }
    }),

  setMessage: (agentId, message) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, {
          ...prev,
          currentMessage: message,
          status: message ? ('speaking' as AgentStatus) : prev.status === 'speaking' ? ('idle' as AgentStatus) : prev.status,
        }),
      }
    }),

  addMessage: (agentId, content, type) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `msg-${++_msgSeq}`,
          agentId,
          content,
          timestamp: Date.now(),
          type,
        } satisfies DiscussionMessage,
      ],
    })),

  // ── Sentience ──────────────────────────────────────────────────────────────
  updateSentience: (agentId, sentience) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, { ...prev, sentience }),
      }
    }),

  autonomousBreak: (agentId, message, now) => {
    const { addMessage } = get()
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, {
          ...prev,
          location: 'break-room',
          status: 'idle',
          currentTaskId: null,
          currentMessage: null,
          sentience: { ...prev.sentience, lastBreakAt: now },
        }),
      }
    })
    addMessage(agentId, `☕ Going on break — "${message}"`, 'system')
  },

  autonomousReturn: (agentId, message) => {
    const { addMessage } = get()
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, {
          ...prev,
          location: 'floor',
          status: 'idle',
          currentMessage: null,
        }),
      }
    })
    addMessage(agentId, `↩ Back from break — "${message}"`, 'system')
  },

  // ── Manual break controls ─────────────────────────────────────────────────
  sendToBreakRoom: (agentId) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, {
          ...prev,
          location: 'break-room',
          status: 'idle',
          currentTaskId: null,
          currentMessage: null,
        }),
      }
    }),

  recallFromBreakRoom: (agentId) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, {
          ...prev,
          location: 'floor',
          status: 'idle',
        }),
      }
    }),

  // ── Tasks ─────────────────────────────────────────────────────────────────
  submitTask: (rawInput) => {
    const { description, requiredStrengths } = opusAnalyzeTask(rawInput)
    const assignedTo = assignBestWorker(requiredStrengths)
    const taskId = `task-${++_taskSeq}`

    const task: Task = {
      id: taskId,
      description,
      requiredStrengths,
      assignedTo,
      status: 'in-progress',
      createdAt: Date.now(),
      completedAt: null,
    }

    set((s) => {
      const prev = s.runtimes.get(assignedTo)
      const updated = prev
        ? new Map(s.runtimes).set(assignedTo, {
            ...prev,
            status: 'working' as AgentStatus,
            currentTaskId: taskId,
          })
        : s.runtimes

      return {
        tasks: [...s.tasks, task],
        runtimes: updated,
        messages: [
          ...s.messages,
          {
            id: `msg-${++_msgSeq}`,
            agentId: 'opus',
            content: `Assigning "${description}" → ${assignedTo} [${requiredStrengths.join(', ')}]`,
            timestamp: Date.now(),
            type: 'system',
          } satisfies DiscussionMessage,
        ],
      }
    })
  },

  completeTask: (taskId) =>
    set((s) => {
      const task = s.tasks.find((t) => t.id === taskId)
      if (!task) return s
      const updatedTasks = s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'done' as const, completedAt: Date.now() } : t,
      )
      let updatedRuntimes = s.runtimes
      if (task.assignedTo) {
        const prev = s.runtimes.get(task.assignedTo)
        if (prev) {
          updatedRuntimes = new Map(s.runtimes).set(task.assignedTo, {
            ...prev,
            status: 'idle',
            currentTaskId: null,
          })
        }
      }
      return { tasks: updatedTasks, runtimes: updatedRuntimes }
    }),

  // ── Voting ────────────────────────────────────────────────────────────────
  startDiscussion: (topicDescription) => {
    const { addMessage, openVote } = get()
    AGENT_REGISTRY.forEach((agent, idx) => {
      const runtime = get().runtimes.get(agent.id)
      if (runtime?.location !== 'floor') return
      setTimeout(() => {
        const opinion = generateStubOpinion(agent.id, topicDescription)
        addMessage(agent.id, opinion, 'opinion')
        set((s) => {
          const prev = s.runtimes.get(agent.id)
          if (!prev) return s
          return {
            runtimes: new Map(s.runtimes).set(agent.id, {
              ...prev,
              status: 'speaking',
              currentMessage: opinion.slice(0, 62) + (opinion.length > 62 ? '…' : ''),
            }),
          }
        })
        setTimeout(() => {
          set((s) => {
            const prev = s.runtimes.get(agent.id)
            if (!prev) return s
            return {
              runtimes: new Map(s.runtimes).set(agent.id, {
                ...prev,
                status: 'idle',
                currentMessage: null,
              }),
            }
          })
        }, 3_200)
      }, idx * 800)
    })
    setTimeout(() => openVote(topicDescription), AGENT_REGISTRY.length * 800 + 500)
  },

  openVote: (description) => {
    const topicId = `vote-${++_voteSeq}`
    const topic: VoteTopic = {
      id: topicId,
      description,
      status: 'voting',
      resolution: null,
      createdAt: Date.now(),
      resolvedAt: null,
    }
    set((s) => {
      const updated = new Map(s.runtimes)
      for (const [id, r] of updated) {
        if (r.location === 'floor') updated.set(id, { ...r, status: 'voting', vote: null })
      }
      return { activeTopic: topic, runtimes: updated }
    })
  },

  castVote: (agentId, choice) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return { runtimes: new Map(s.runtimes).set(agentId, { ...prev, vote: choice }) }
    }),

  resolveVote: () => {
    const { activeTopic, runtimes, addMessage } = get()
    if (!activeTopic || activeTopic.status !== 'voting') return
    const floor = [...runtimes.entries()].filter(([, r]) => r.location === 'floor')
    const approvals = floor.filter(([, r]) => r.vote === 'approve').length
    const rejections = floor.filter(([, r]) => r.vote === 'reject').length
    const pending = floor.filter(([, r]) => r.vote === null).length
    let resolution: 'approved' | 'rejected'
    if (approvals > rejections) {
      resolution = 'approved'
    } else if (rejections > approvals) {
      resolution = 'rejected'
    } else {
      const opusVote = runtimes.get('opus')?.vote
      resolution = opusVote === 'reject' ? 'rejected' : 'approved'
    }
    addMessage('opus', `Vote resolved: ${resolution.toUpperCase()} (${approvals}✓ / ${rejections}✗ / ${pending} abstain)`, 'system')
    const resolved: VoteTopic = { ...activeTopic, status: 'resolved', resolution, resolvedAt: Date.now() }
    set((s) => {
      const updated = new Map(s.runtimes)
      for (const [id, r] of updated) {
        if (r.status === 'voting') updated.set(id, { ...r, status: 'idle', vote: null })
      }
      return { activeTopic: null, topicHistory: [...s.topicHistory, resolved], runtimes: updated }
    })
  },

  reset: () => set({ runtimes: initialRuntimes(), tasks: [], messages: [], activeTopic: null, topicHistory: [] }),
}))
