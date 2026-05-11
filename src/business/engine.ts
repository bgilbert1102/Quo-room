/**
 * Trend detection and content generation stubs.
 * Every function here has a clear TODO marker showing where the real API call
 * plugs in. The stub returns plausible-looking data so the UI is fully exercisable
 * before any key is provided.
 */

import type { ContentBrief, ContentType, Platform, TrendSignal } from './types'

// ── Trend data pool (stub) ────────────────────────────────────────────────────
const TREND_POOL: Array<{
  topic: string
  keywords: string[]
  platforms: Platform[]
  score: number
}> = [
  { topic: 'AI productivity setup', keywords: ['AI', 'productivity', 'automation', 'tools'], platforms: ['tiktok', 'youtube'], score: 88 },
  { topic: 'Digital art prints', keywords: ['digital art', 'wall art', 'printable', 'aesthetic'], platforms: ['etsy', 'tiktok'], score: 72 },
  { topic: 'Notion template packs', keywords: ['Notion', 'templates', 'organization', 'planner'], platforms: ['etsy', 'tiktok', 'youtube'], score: 81 },
  { topic: 'Minimalist home office', keywords: ['desk setup', 'minimalist', 'home office', 'aesthetic'], platforms: ['tiktok', 'youtube', 'etsy'], score: 76 },
  { topic: 'Prompt engineering guide', keywords: ['ChatGPT', 'prompts', 'AI writing', 'automation'], platforms: ['tiktok', 'youtube', 'fiverr'], score: 85 },
  { topic: 'Faceless YouTube automation', keywords: ['passive income', 'YouTube', 'automation', 'AI voiceover'], platforms: ['youtube', 'tiktok'], score: 79 },
  { topic: 'Custom Etsy digital downloads', keywords: ['digital download', 'SVG', 'Etsy', 'instant download'], platforms: ['etsy'], score: 68 },
  { topic: 'AI content creation service', keywords: ['AI', 'content creation', 'social media', 'freelance'], platforms: ['fiverr', 'tiktok'], score: 83 },
  { topic: 'Cozy reading aesthetic', keywords: ['bookshelf', 'cozy', 'aesthetic', 'reading nook'], platforms: ['tiktok', 'etsy'], score: 65 },
  { topic: 'Personal finance tracker', keywords: ['budget', 'finance', 'spreadsheet', 'money'], platforms: ['etsy', 'youtube', 'tiktok'], score: 74 },
  { topic: 'Vintage poster collection', keywords: ['vintage', 'retro', 'poster', 'wall decor'], platforms: ['etsy'], score: 62 },
  { topic: 'Short-form video editing tips', keywords: ['video editing', 'CapCut', 'TikTok', 'reels'], platforms: ['tiktok', 'youtube', 'fiverr'], score: 77 },
]

let _trendUsed = new Set<number>()

// TODO: Replace with real API calls:
//   - Google Trends API (unofficial: pytrends or SerpAPI)
//   - TikTok Research API (requires TikTok for Business approval)
//   - Etsy Trending Searches API (v3: GET /v3/application/trending)
export function detectTrend(detectedBy: string): TrendSignal {
  if (_trendUsed.size >= TREND_POOL.length) _trendUsed = new Set()

  let idx = Math.floor(Math.random() * TREND_POOL.length)
  while (_trendUsed.has(idx)) idx = (idx + 1) % TREND_POOL.length
  _trendUsed.add(idx)

  const trend = TREND_POOL[idx]!
  const platform = trend.platforms[Math.floor(Math.random() * trend.platforms.length)]!

  return {
    id: `trend-${Date.now()}-${idx}`,
    topic: trend.topic,
    platform,
    score: trend.score + Math.floor(Math.random() * 10 - 5),
    keywords: trend.keywords,
    detectedAt: Date.now(),
    detectedBy,
  }
}

// ── Content brief generator (stub) ───────────────────────────────────────────
// TODO: Replace body with a real model API call (e.g. Gemini Pro or Claude Sonnet)
//   POST /v1/messages with a structured prompt to generate the content brief.
export function generateContentBrief(
  trend: TrendSignal,
  contentType: ContentType,
  createdBy: string,
): ContentBrief {
  const templates: Record<ContentType, (t: TrendSignal) => Pick<ContentBrief, 'title' | 'hook' | 'description' | 'hashtags'>> = {
    'tiktok-video': (t) => ({
      title: `POV: ${t.topic}`,
      hook: `You've been sleeping on ${t.topic} and it's costing you 💸`,
      description: `60-second TikTok covering ${t.topic}. Hook → 3 quick tips → CTA to follow. Trending audio recommended.`,
      hashtags: ['#fyp', '#foryou', ...t.keywords.map((k) => `#${k.replace(/\s+/g, '')}`), '#viral'],
    }),
    'youtube-short': (t) => ({
      title: `${t.topic} in 60 seconds`,
      hook: `Everything you need to know about ${t.topic}`,
      description: `60s YouTube Short: rapid-fire breakdown of ${t.topic}. Optimized for mobile vertical viewing.`,
      hashtags: ['#Shorts', '#YouTube', ...t.keywords.map((k) => `#${k.replace(/\s+/g, '')}`)],
    }),
    'youtube-video': (t) => ({
      title: `The Complete Guide to ${t.topic} (${new Date().getFullYear()})`,
      hook: `By the end of this video you'll know exactly how to ${t.topic.toLowerCase()} — and make money doing it`,
      description: `10-15 minute deep-dive tutorial on ${t.topic}. Chapters, screen recording, value-packed. SEO title targets "${t.keywords[0]}" keyword cluster.`,
      hashtags: t.keywords.map((k) => `#${k.replace(/\s+/g, '')}`),
    }),
    'etsy-listing': (t) => ({
      title: `${t.topic} — Digital Download | Instant Access | Printable`,
      hook: `Get instant access to our premium ${t.topic} collection`,
      description: `Digital product listing for ${t.topic}. Includes: high-res files, multiple formats (PDF/PNG/SVG), commercial license. Keywords optimized for Etsy search.`,
      hashtags: t.keywords,
    }),
    'fiverr-gig': (t) => ({
      title: `I will create professional ${t.topic} for your brand`,
      hook: `Premium ${t.topic} service — fast delivery, unlimited revisions`,
      description: `Fiverr gig offering ${t.topic} services. Three tiers: Basic ($25), Standard ($75), Premium ($150). Deliverables clearly defined per tier. SEO-optimized gig description.`,
      hashtags: t.keywords,
    }),
  }

  const template = templates[contentType](trend)

  return {
    id: `content-${Date.now()}`,
    type: contentType,
    platform: trend.platform,
    trendId: trend.id,
    createdBy,
    createdAt: Date.now(),
    postedAt: null,
    metrics: null,
    costUsd: 0,   // digital content = free to create; set > 0 for physical products
    status: 'draft',
    keywords: trend.keywords,
    ...template,
  }
}

// Map trend → best content type(s) for that platform
export function suggestContentTypes(platform: Platform): ContentType[] {
  const map: Record<Platform, ContentType[]> = {
    tiktok:  ['tiktok-video'],
    youtube: ['youtube-short', 'youtube-video'],
    etsy:    ['etsy-listing'],
    fiverr:  ['fiverr-gig'],
  }
  return map[platform]
}
