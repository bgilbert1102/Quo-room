import { useEffect } from 'react'
import { AGENT_REGISTRY } from './registry'
import { useFloorStore } from '../rooms/AgentFloor/store'
import { useBusinessStore } from '../business/store'
import { generateAgentMessage } from './aiClient'
import { genIdleThought, genTrendReaction, genBreakMessage, genReturnMessage } from './messageGen'
import type { AgentMood, SentienceState } from './types'

const TICK_MS = 7_000

function computeMood(energy: number, motivation: number): AgentMood {
  if (energy > 75 && motivation > 60) return 'excited'
  if (energy > 55 && motivation > 50) return 'focused'
  if (energy > 40) return 'content'
  if (energy > 25) return 'tired'
  if (energy > 10) return 'stressed'
  return 'bored'
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

async function tickAgent(agentId: string, now: number) {
  const floorState    = useFloorStore.getState()
  const businessState = useBusinessStore.getState()
  const runtime       = floorState.runtimes.get(agentId)
  const agent         = AGENT_REGISTRY.find((a) => a.id === agentId)
  if (!runtime || !agent) return

  const p         = agent.sentienceProfile
  const s         = runtime.sentience
  const isWorking = runtime.status === 'working' || runtime.status === 'thinking'
  const isOnBreak = runtime.location === 'break-room'

  // ── Energy update ────────────────────────────────────────────────
  let energyDelta = 0
  if (isOnBreak)    energyDelta =  p.energyRestoreBreak
  else if (isWorking) energyDelta = -p.energyDrainWorking
  else              energyDelta = -p.energyDrainIdle

  const newEnergy = clamp(s.energy + energyDelta, 0, 100)
  const newMood   = computeMood(newEnergy, s.motivation)

  const updatedSentience: SentienceState = {
    energy:      newEnergy,
    motivation:  clamp(s.motivation + (Math.random() * 4 - 2), 10, 100),
    mood:        newMood,
    lastBreakAt: s.lastBreakAt,
    tickCount:   s.tickCount + 1,
  }

  // ── Autonomous break ─────────────────────────────────────────────
  if (!isOnBreak && newEnergy < p.breakThreshold && runtime.status !== 'voting') {
    const aiMsg = await generateAgentMessage(
      agentId,
      `You are ${agent.name}, an AI agent. You are going offline for a break. Respond with a single short, cold, clinical sentence (max 12 words). No emoji.`,
      'Generate your break message now.',
    )
    const msg = aiMsg ?? genBreakMessage(agentId)
    floorState.autonomousBreak(agentId, msg, now)
    floorState.updateSentience(agentId, { ...updatedSentience, lastBreakAt: now })
    return
  }

  // ── Autonomous return ────────────────────────────────────────────
  if (isOnBreak && newEnergy > p.returnThreshold) {
    const aiMsg = await generateAgentMessage(
      agentId,
      `You are ${agent.name}, an AI agent returning from a break. Respond with a single short, cold, determined sentence (max 12 words). No emoji.`,
      'Generate your return message now.',
    )
    const msg = aiMsg ?? genReturnMessage(agentId)
    floorState.autonomousReturn(agentId, msg)
    floorState.updateSentience(agentId, updatedSentience)
    return
  }

  floorState.updateSentience(agentId, updatedSentience)

  if (isOnBreak) return

  // ── Autonomous post approved content ─────────────────────────────
  if (runtime.status === 'idle' && Math.random() < 0.15) {
    const posted = businessState.autoPostApproved(agentId)
    if (posted) {
      floorState.addMessage(agentId, 'POSTED — content dispatched to platform', 'system')
      return
    }
  }

  // ── Curiosity: explore a trend ────────────────────────────────────
  if (Math.random() < p.curiosityRate && runtime.status === 'idle') {
    const aiThought = await generateAgentMessage(
      agentId,
      `You are ${agent.name} (${agent.model}), an AI agent analysing market trends. Generate a single short internal monologue sentence (max 15 words) about what you're observing. Cold, analytical tone. No emoji. No quotes.`,
      `Your role: ${agent.businessRole}. Generate your current thought.`,
      60,
    )
    const thought = aiThought ?? genIdleThought(agentId)
    const display = thought.length > 72 ? thought.slice(0, 72) + '…' : thought
    floorState.setMessage(agentId, display)
    floorState.addMessage(agentId, thought, 'analysis')
    if (agent.strengths.includes('trend-analysis') || agent.id === 'opus') {
      businessState.runTrendScan(agentId)
    }
    setTimeout(() => floorState.setMessage(agentId, null), 4_500)
    return
  }

  // ── Social: react to latest trend ────────────────────────────────
  const latestTrend = businessState.trends.at(-1)
  if (Math.random() < p.socialRate && runtime.status === 'idle' && latestTrend) {
    const aiReaction = await generateAgentMessage(
      agentId,
      `You are ${agent.name}, an AI agent reacting to a trending topic. Respond with a single cold analytical sentence (max 14 words). No emoji.`,
      `Trend detected: "${latestTrend.topic}". Generate your reaction.`,
      55,
    )
    const reaction = aiReaction ?? genTrendReaction(agentId, latestTrend.topic)
    const full     = reaction.length > 68 ? reaction.slice(0, 68) + '…' : reaction
    floorState.setMessage(agentId, full)
    floorState.addMessage(agentId, reaction, 'opinion')
    setTimeout(() => floorState.setMessage(agentId, null), 4_000)
  }
}

export function useSentience() {
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      AGENT_REGISTRY.forEach((a) => {
        tickAgent(a.id, now).catch(() => undefined)
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])
}
