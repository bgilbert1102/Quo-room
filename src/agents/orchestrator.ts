import { AGENT_REGISTRY, WORKERS } from './registry'
import { generateAgentMessage } from './aiClient'
import { genOpinion } from './messageGen'
import type { Strength } from './types'

export function assignBestWorker(requiredStrengths: Strength[]): string {
  if (requiredStrengths.length === 0) return WORKERS[0]?.id ?? 'sonnet'
  const scored = WORKERS.map((a) => ({
    id: a.id,
    score: requiredStrengths.filter((s) => a.strengths.includes(s)).length,
  })).sort((a, b) => b.score - a.score)
  return scored[0]?.id ?? WORKERS[0]?.id ?? 'sonnet'
}

export async function generateOpinion(agentId: string, topicDescription: string): Promise<string> {
  const agent = AGENT_REGISTRY.find((a) => a.id === agentId)
  if (!agent) return genOpinion(agentId, topicDescription)

  const aiMsg = await generateAgentMessage(
    agentId,
    `You are ${agent.name} (${agent.model}), an AI agent in an autonomous hive. Personality: ${agent.personality}. Express a brief opinion in 1–2 cold analytical sentences (max 20 words). No emoji.`,
    `Topic under discussion: "${topicDescription}"`,
    80,
  )
  return aiMsg ?? genOpinion(agentId, topicDescription)
}

/** Synchronous fallback — used where async context is unavailable */
export function generateStubOpinion(agentId: string, topicDescription: string): string {
  return genOpinion(agentId, topicDescription)
}

export function opusAnalyzeTask(rawInput: string): { description: string; requiredStrengths: Strength[] } {
  const lower = rawInput.toLowerCase()
  const strengths: Strength[] = []
  if (/code|implement|build|fix|debug|refactor/.test(lower))       strengths.push('coding')
  if (/analyz|review|evaluat|assess/.test(lower))                   strengths.push('analysis')
  if (/write|draft|document|explain/.test(lower))                   strengths.push('writing')
  if (/fast|quick|urgent|classif/.test(lower))                      strengths.push('speed', 'classification')
  if (/math|formula|calculat|science|research/.test(lower))         strengths.push('math', 'science')
  if (/image|video|multimodal|creative|design/.test(lower))         strengths.push('multimodal', 'creativity')
  if (/search|find|lookup|discover/.test(lower))                    strengths.push('search')
  if (/long|context|document|large/.test(lower))                    strengths.push('long-context')
  if (/trend|market|social|tiktok|etsy|youtube|fiverr/.test(lower)) strengths.push('trend-analysis')
  if (/content|post|caption|hashtag/.test(lower))                   strengths.push('content-creation', 'social-media')
  return {
    description: rawInput,
    requiredStrengths: strengths.length > 0 ? strengths : ['analysis'],
  }
}
