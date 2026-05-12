import { useEffect } from 'react'
import { AGENT_REGISTRY } from './registry'
import { useFloorStore } from '../rooms/AgentFloor/store'
import { useBusinessStore } from '../business/store'
import type { AgentMood, SentienceState } from './types'

const TICK_MS = 7_000  // 7 s feels alive without being frenetic

function pickRandom<T>(arr: readonly T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)]
  if (item === undefined) throw new Error('pickRandom called on empty array')
  return item
}

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

// Called once per tick for every agent — runs outside React render
function tickAgent(agentId: string, now: number) {
  const floorState = useFloorStore.getState()
  const businessState = useBusinessStore.getState()
  const runtime = floorState.runtimes.get(agentId)
  const agent = AGENT_REGISTRY.find((a) => a.id === agentId)
  if (!runtime || !agent) return

  const p = agent.sentienceProfile
  const s = runtime.sentience
  const isWorking = runtime.status === 'working' || runtime.status === 'thinking'
  const isOnBreak = runtime.location === 'break-room'

  // ── Energy update ─────────────────────────────────────────────────
  let energyDelta = 0
  if (isOnBreak) {
    energyDelta = p.energyRestoreBreak
  } else if (isWorking) {
    energyDelta = -p.energyDrainWorking
  } else {
    energyDelta = -p.energyDrainIdle
  }

  const newEnergy = clamp(s.energy + energyDelta, 0, 100)
  const newMood = computeMood(newEnergy, s.motivation)
  const newTick = s.tickCount + 1

  const updatedSentience: SentienceState = {
    energy: newEnergy,
    motivation: clamp(s.motivation + (Math.random() * 4 - 2), 10, 100),
    mood: newMood,
    lastBreakAt: s.lastBreakAt,
    tickCount: newTick,
  }

  // ── Autonomous break decision ─────────────────────────────────────
  if (!isOnBreak && newEnergy < p.breakThreshold && runtime.status !== 'voting') {
    const msg = pickRandom(p.breakMessages)
    floorState.autonomousBreak(agentId, msg, now)
    updatedSentience.lastBreakAt = now
    floorState.updateSentience(agentId, { ...updatedSentience, lastBreakAt: now })
    return
  }

  // ── Autonomous return decision ────────────────────────────────────
  if (isOnBreak && newEnergy > p.returnThreshold) {
    const msg = pickRandom(p.returnMessages)
    floorState.autonomousReturn(agentId, msg)
    floorState.updateSentience(agentId, updatedSentience)
    return
  }

  // ── Persist updated sentience ─────────────────────────────────────
  floorState.updateSentience(agentId, updatedSentience)

  // ── Autonomous curiosity / social actions (floor agents only) ────
  if (isOnBreak) return

  // Curiosity: explore a trend
  if (Math.random() < p.curiosityRate && runtime.status === 'idle') {
    const thought = pickRandom(p.idleThoughts)
    floorState.setMessage(agentId, thought.slice(0, 72) + (thought.length > 72 ? '…' : ''))
    floorState.addMessage(agentId, thought, 'analysis')
    // Trigger business trend check for analytical agents
    if (agent.strengths.includes('trend-analysis') || agent.id === 'opus') {
      businessState.runTrendScan(agentId)
    }
    // Clear speech bubble after 4 s
    setTimeout(() => floorState.setMessage(agentId, null), 4_000)
    return
  }

  // Autonomous posting: if there's approved content, post it
  if (runtime.status === 'idle' && Math.random() < 0.15) {
    const posted = businessState.autoPostApproved(agentId)
    if (posted) {
      floorState.addMessage(agentId, '📤 Content approved — posting now!', 'system')
      return
    }
  }

  // Social: react to latest trend
  const latestTrend = businessState.trends.at(-1)
  if (Math.random() < p.socialRate && runtime.status === 'idle' && latestTrend) {
    const reaction = pickRandom(p.trendReactions)
    const full = `Re: "${latestTrend.topic}" — ${reaction}`
    floorState.setMessage(agentId, reaction.slice(0, 68) + '…')
    floorState.addMessage(agentId, full, 'opinion')
    setTimeout(() => floorState.setMessage(agentId, null), 3_500)
  }
}

// ── React hook — mount once at the top of AgentFloor ─────────────────────────
export function useSentience() {
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      AGENT_REGISTRY.forEach((a) => tickAgent(a.id, now))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])
}
