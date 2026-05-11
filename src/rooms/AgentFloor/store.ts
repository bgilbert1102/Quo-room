import { create } from 'zustand'
import { AGENT_REGISTRY } from '../../agents/registry'
import { assignBestWorker, generateStubOpinion, opusAnalyzeTask } from '../../agents/orchestrator'
import type { AgentRuntimeState, AgentStatus } from '../../agents/types'
import type { DiscussionMessage, Task, VoteTopic } from './types'

let _taskSeq = 0
let _msgSeq = 0
let _voteSeq = 0

function nextId(prefix: string, seq: () => number): string {
  return `${prefix}-${seq()}`
}

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
      },
    ]),
  )

interface FloorState {
  runtimes: Map<string, AgentRuntimeState>
  tasks: Task[]
  messages: DiscussionMessage[]
  activeTopic: VoteTopic | null
  topicHistory: VoteTopic[]

  // Actions
  setStatus: (agentId: string, status: AgentStatus) => void
  sendToBreakRoom: (agentId: string) => void
  recallFromBreakRoom: (agentId: string) => void
  setMessage: (agentId: string, message: string | null) => void

  submitTask: (rawInput: string) => void
  completeTask: (taskId: string) => void

  openVote: (description: string) => void
  castVote: (agentId: string, choice: 'approve' | 'reject') => void
  resolveVote: () => void

  addMessage: (agentId: string, content: string, type: DiscussionMessage['type']) => void
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

  setMessage: (agentId, message) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, {
          ...prev,
          currentMessage: message,
          status: message ? 'speaking' : 'idle',
        }),
      }
    }),

  submitTask: (rawInput) => {
    const { description, requiredStrengths } = opusAnalyzeTask(rawInput)
    const assignedTo = assignBestWorker(requiredStrengths)
    const taskId = nextId('task', () => ++_taskSeq)

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

      const sysMsg: DiscussionMessage = {
        id: nextId('msg', () => ++_msgSeq),
        agentId: 'opus',
        content: `Assigning "${description}" → ${assignedTo} (strengths: ${requiredStrengths.join(', ')})`,
        timestamp: Date.now(),
        type: 'system',
      }

      return { tasks: [...s.tasks, task], runtimes: updated, messages: [...s.messages, sysMsg] }
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

  addMessage: (agentId, content, type) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: nextId('msg', () => ++_msgSeq),
          agentId,
          content,
          timestamp: Date.now(),
          type,
        } satisfies DiscussionMessage,
      ],
    })),

  startDiscussion: (topicDescription) => {
    const { addMessage, openVote } = get()

    // Each agent (on the floor) contributes a stub opinion
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
              currentMessage: opinion.slice(0, 60) + (opinion.length > 60 ? '…' : ''),
            }),
          }
        })
        // Clear speech bubble after 3 s
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
        }, 3_000)
      }, idx * 800)
    })

    // Open the formal vote after everyone has spoken
    setTimeout(() => openVote(topicDescription), AGENT_REGISTRY.length * 800 + 500)
  },

  openVote: (description) => {
    const topicId = nextId('vote', () => ++_voteSeq)
    const topic: VoteTopic = {
      id: topicId,
      description,
      status: 'voting',
      resolution: null,
      createdAt: Date.now(),
      resolvedAt: null,
    }

    // Reset all votes and set agents to voting status
    set((s) => {
      const updatedRuntimes = new Map(s.runtimes)
      for (const [id, runtime] of updatedRuntimes) {
        if (runtime.location === 'floor') {
          updatedRuntimes.set(id, { ...runtime, status: 'voting', vote: null })
        }
      }
      return { activeTopic: topic, runtimes: updatedRuntimes }
    })
  },

  castVote: (agentId, choice) =>
    set((s) => {
      const prev = s.runtimes.get(agentId)
      if (!prev) return s
      return {
        runtimes: new Map(s.runtimes).set(agentId, { ...prev, vote: choice }),
      }
    }),

  resolveVote: () => {
    const { activeTopic, runtimes, addMessage } = get()
    if (!activeTopic || activeTopic.status !== 'voting') return

    const floorAgents = [...runtimes.entries()].filter(([, r]) => r.location === 'floor')
    const approvals = floorAgents.filter(([, r]) => r.vote === 'approve').length
    const rejections = floorAgents.filter(([, r]) => r.vote === 'reject').length
    const pending = floorAgents.filter(([, r]) => r.vote === null).length

    // If there's a tie, Opus breaks it — Opus always approves in stub mode
    let resolution: 'approved' | 'rejected'
    if (approvals > rejections) {
      resolution = 'approved'
    } else if (rejections > approvals) {
      resolution = 'rejected'
    } else {
      // Tie — Opus (queen) is tie-breaker
      const opusVote = runtimes.get('opus')?.vote
      resolution = opusVote === 'reject' ? 'rejected' : 'approved'
    }

    const summary = `Vote resolved: ${resolution.toUpperCase()} (${approvals} approve / ${rejections} reject / ${pending} abstain)`
    addMessage('opus', summary, 'system')

    const resolved: VoteTopic = {
      ...activeTopic,
      status: 'resolved',
      resolution,
      resolvedAt: Date.now(),
    }

    set((s) => {
      const updatedRuntimes = new Map(s.runtimes)
      for (const [id, runtime] of updatedRuntimes) {
        if (runtime.status === 'voting') {
          updatedRuntimes.set(id, { ...runtime, status: 'idle', vote: null })
        }
      }
      return {
        activeTopic: null,
        topicHistory: [...s.topicHistory, resolved],
        runtimes: updatedRuntimes,
      }
    })
  },

  reset: () =>
    set({
      runtimes: initialRuntimes(),
      tasks: [],
      messages: [],
      activeTopic: null,
      topicHistory: [],
    }),
}))
