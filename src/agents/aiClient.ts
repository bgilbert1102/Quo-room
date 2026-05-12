/**
 * Thin AI client — routes generation to the correct model based on agentId.
 * Falls back gracefully to null when keys are absent.
 *
 * Anthropic models (Opus, Sonnet, Haiku):
 *   POST https://api.anthropic.com/v1/messages
 *
 * Google Gemini models (Gemini Think, Gemini Pro):
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */
import { getAnthropicKey, getGoogleKey } from '../settings/store'
import { AGENT_REGISTRY } from './registry'

const AGENT_MODEL: Record<string, 'anthropic' | 'google'> = {
  opus:          'anthropic',
  sonnet:        'anthropic',
  haiku:         'anthropic',
  'gemini-think': 'google',
  'gemini-pro':   'google',
}

// Keep a small in-flight cache to avoid hammering APIs during fast ticks
const _inFlight = new Set<string>()

/**
 * Generate a short message for an agent given a prompt.
 * Returns null if no API key is configured or a request is already in-flight.
 */
export async function generateAgentMessage(
  agentId: string,
  system: string,
  user: string,
  maxTokens = 80,
): Promise<string | null> {
  const cacheKey = `${agentId}:${user.slice(0, 40)}`
  if (_inFlight.has(cacheKey)) return null
  _inFlight.add(cacheKey)

  try {
    const provider = AGENT_MODEL[agentId]
    if (!provider) return null

    if (provider === 'anthropic') {
      return await callAnthropic(agentId, system, user, maxTokens)
    } else {
      return await callGoogle(agentId, system, user, maxTokens)
    }
  } catch {
    return null
  } finally {
    _inFlight.delete(cacheKey)
  }
}

async function callAnthropic(
  agentId: string,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string | null> {
  const key = getAnthropicKey()
  if (!key) return null

  const agent = AGENT_REGISTRY.find((a) => a.id === agentId)
  if (!agent) return null

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         key,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      agent.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })

  if (!res.ok) return null
  const data = (await res.json()) as { content?: Array<{ text: string }> }
  return data.content?.[0]?.text?.trim() ?? null
}

async function callGoogle(
  agentId: string,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string | null> {
  const key = getGoogleKey()
  if (!key) return null

  const agent = AGENT_REGISTRY.find((a) => a.id === agentId)
  if (!agent) return null

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${agent.model}:generateContent?key=${key}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.9 },
    }),
  })

  if (!res.ok) return null
  type GeminiResp = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const data = (await res.json()) as GeminiResp
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null
}
