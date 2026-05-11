import { AGENT_REGISTRY, WORKERS } from './registry'
import type { Strength } from './types'

// Assigns the best-matching worker to a task based on required strengths.
// Opus (the queen) never gets assigned worker tasks — she orchestrates.
export function assignBestWorker(requiredStrengths: Strength[]): string {
  if (requiredStrengths.length === 0) {
    return WORKERS[0]?.id ?? 'sonnet'
  }

  const scored = WORKERS.map((agent) => ({
    id: agent.id,
    score: requiredStrengths.filter((s) => agent.strengths.includes(s)).length,
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.id ?? WORKERS[0]?.id ?? 'sonnet'
}

// Generates a stub discussion message for an agent given a vote topic.
// Replace the body with a real model API call once keys are provided.
export function generateStubOpinion(agentId: string, topicDescription: string): string {
  const agent = AGENT_REGISTRY.find((a) => a.id === agentId)
  if (!agent) return 'No opinion available.'

  const opinionsByPersonality: Record<string, (topic: string) => string> = {
    'authoritative and strategic': (t) =>
      `After reviewing "${t}", I believe we should proceed carefully. My recommendation carries final weight if we split.`,
    'methodical and precise': (t) =>
      `Analyzing "${t}": the data suggests a measured approach. I'll support whichever path has the stronger evidence base.`,
    'swift and concise': (t) => `"${t}" — quick take: yes if time-sensitive, no if we can wait.`,
    'analytical and thorough': (t) =>
      `Deep analysis of "${t}" reveals multiple dimensions worth considering. I need more context before committing.`,
    'versatile and imaginative': (t) =>
      `"${t}" opens interesting possibilities. I see both creative and practical angles worth exploring.`,
  }

  const fn = opinionsByPersonality[agent.personality]
  return fn ? fn(topicDescription) : `My take on "${topicDescription}": I'll follow the group.`
}

// Stub: in a real implementation this calls the Opus model API.
// Returns a task description and inferred strengths.
export function opusAnalyzeTask(rawInput: string): {
  description: string
  requiredStrengths: Strength[]
} {
  const lower = rawInput.toLowerCase()
  const strengths: Strength[] = []

  if (/code|implement|build|fix|debug|refactor/.test(lower)) strengths.push('coding')
  if (/analyze|review|evaluate|assess/.test(lower)) strengths.push('analysis')
  if (/write|draft|document|explain/.test(lower)) strengths.push('writing')
  if (/fast|quick|urgent|classify/.test(lower)) strengths.push('speed', 'classification')
  if (/math|formula|calculate|science|research/.test(lower)) strengths.push('math', 'science')
  if (/image|video|multimodal|creative|design/.test(lower))
    strengths.push('multimodal', 'creativity')
  if (/search|find|lookup|discover/.test(lower)) strengths.push('search')
  if (/long|context|document|large/.test(lower)) strengths.push('long-context')

  return {
    description: rawInput,
    requiredStrengths: strengths.length > 0 ? strengths : ['analysis'],
  }
}
