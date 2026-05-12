import { create } from 'zustand'
import { detectTrend, generateContentBrief, suggestContentTypes } from './engine'
import { hasCredential, setCredential } from './platforms'
import type {
  ApprovalRequest,
  ContentBrief,
  ContentMetrics,
  Platform,
  PlatformRevenue,
  TrendSignal,
} from './types'

let _seq = 0
const nextId = (p: string) => `${p}-${++_seq}`

interface BusinessState {
  trends: TrendSignal[]
  content: ContentBrief[]
  approvals: ApprovalRequest[]
  revenue: PlatformRevenue[]
  credentialStatus: Record<Platform, boolean>

  // Actions
  runTrendScan: (agentId: string) => void
  planContent: (trendId: string, agentId: string) => void
  approveContent: (contentId: string) => void
  rejectContent: (contentId: string) => void
  markPosted: (contentId: string, agentId?: string) => void
  autoPostApproved: (agentId: string) => boolean
  approveSpend: (approvalId: string) => void
  rejectSpend: (approvalId: string) => void
  addRevenue: (platform: Platform, usd: number, views: number) => void
  updateMetrics: (contentId: string, metrics: ContentMetrics) => void
  setCredential: (platform: Platform, key: string) => void
  refreshCredentials: () => void
  reset: () => void
}

const PLATFORMS: Platform[] = ['etsy', 'tiktok', 'tiktok-shop', 'youtube', 'fiverr']

const initialRevenue = (): PlatformRevenue[] =>
  PLATFORMS.map((p) => ({
    platform: p,
    totalRevenueUsd: 0,
    weekRevenueUsd: 0,
    totalViews: 0,
    followers: 0,
  }))

const initialCredStatus = (): Record<Platform, boolean> =>
  Object.fromEntries(PLATFORMS.map((p) => [p, hasCredential(p)])) as Record<Platform, boolean>

// Simulate views + revenue trickling in after a post goes live.
// Three waves: initial buzz (30s), peak (2m), long-tail (5m) in demo time.
function scheduleRevenueDrip(platform: Platform, contentId: string) {
  type Wave = { delayMs: number; views: number; revenueUsd: number }
  const waves: Record<Platform, Wave[]> = {
    tiktok: [
      { delayMs: 30_000,  views: 1_200, revenueUsd: 0.02 },
      { delayMs: 120_000, views: 8_400, revenueUsd: 0.17 },
      { delayMs: 300_000, views: 4_200, revenueUsd: 0.08 },
    ],
    'tiktok-shop': [
      { delayMs: 30_000,  views: 800,  revenueUsd: 14.99 },
      { delayMs: 120_000, views: 2_400, revenueUsd: 44.97 },
      { delayMs: 300_000, views: 1_100, revenueUsd: 29.98 },
    ],
    youtube: [
      { delayMs: 60_000,  views: 340,  revenueUsd: 0.34 },
      { delayMs: 180_000, views: 920,  revenueUsd: 0.92 },
      { delayMs: 360_000, views: 610,  revenueUsd: 0.61 },
    ],
    etsy: [
      { delayMs: 45_000,  views: 28,  revenueUsd: 9.99 },
      { delayMs: 150_000, views: 64,  revenueUsd: 19.98 },
      { delayMs: 360_000, views: 41,  revenueUsd: 9.99 },
    ],
    fiverr: [
      // Fiverr requires manual communication; no auto-revenue
      { delayMs: 90_000,  views: 12, revenueUsd: 0 },
      { delayMs: 240_000, views: 8,  revenueUsd: 0 },
      { delayMs: 480_000, views: 5,  revenueUsd: 0 },
    ],
  }

  let cumulativeViews = 0
  let cumulativeRevenue = 0

  waves[platform].forEach(({ delayMs, views, revenueUsd }) => {
    setTimeout(() => {
      cumulativeViews += views + Math.floor(Math.random() * views * 0.3)
      cumulativeRevenue += revenueUsd

      const store = useBusinessStore.getState()
      store.addRevenue(platform, revenueUsd, views)
      store.updateMetrics(contentId, {
        views: cumulativeViews,
        likes: Math.floor(cumulativeViews * 0.04),
        comments: Math.floor(cumulativeViews * 0.008),
        shares: Math.floor(cumulativeViews * 0.015),
        revenueUsd: cumulativeRevenue,
      })
    }, delayMs)
  })
}

export const useBusinessStore = create<BusinessState>()((set, get) => ({
  trends: [],
  content: [],
  approvals: [],
  revenue: initialRevenue(),
  credentialStatus: initialCredStatus(),

  runTrendScan: (agentId) => {
    const signal = detectTrend(agentId)
    set((s) => ({ trends: [...s.trends.slice(-29), signal] }))

    if (signal.score > 70) {
      setTimeout(() => get().planContent(signal.id, agentId), 1_200)
    }
  },

  planContent: (trendId, agentId) => {
    const trend = get().trends.find((t) => t.id === trendId)
    if (!trend) return

    const types = suggestContentTypes(trend.platform)
    const briefs = types.map((type) => generateContentBrief(trend, type, agentId))

    set((s) => ({ content: [...s.content, ...briefs] }))
  },

  approveContent: (contentId) =>
    set((s) => ({
      content: s.content.map((c) =>
        c.id === contentId ? { ...c, status: 'approved' as const } : c,
      ),
    })),

  rejectContent: (contentId) =>
    set((s) => ({
      content: s.content.map((c) =>
        c.id === contentId ? { ...c, status: 'rejected' as const } : c,
      ),
    })),

  markPosted: (contentId, _agentId) => {
    const content = get().content.find((c) => c.id === contentId)
    if (!content || content.status !== 'approved') return

    set((s) => ({
      content: s.content.map((c) =>
        c.id === contentId
          ? { ...c, status: 'posted' as const, postedAt: Date.now(), metrics: { views: 0, likes: 0, comments: 0, shares: 0, revenueUsd: 0 } }
          : c,
      ),
    }))

    scheduleRevenueDrip(content.platform, contentId)
  },

  // Called by sentience engine — agent autonomously posts the oldest approved piece
  autoPostApproved: (agentId) => {
    const approved = get().content.filter((c) => c.status === 'approved' && c.costUsd === 0)
    if (approved.length === 0) return false

    // Pick oldest
    const target = approved.reduce((a, b) => (a.createdAt < b.createdAt ? a : b))
    get().markPosted(target.id, agentId)
    return true
  },

  approveSpend: (approvalId) => {
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === approvalId ? { ...a, status: 'approved' as const } : a,
      ),
    }))
    const approval = get().approvals.find((a) => a.id === approvalId)
    if (approval?.contentId) get().approveContent(approval.contentId)
  },

  rejectSpend: (approvalId) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === approvalId ? { ...a, status: 'rejected' as const } : a,
      ),
    })),

  addRevenue: (platform, usd, views) =>
    set((s) => ({
      revenue: s.revenue.map((r) =>
        r.platform === platform
          ? {
              ...r,
              totalRevenueUsd: r.totalRevenueUsd + usd,
              weekRevenueUsd: r.weekRevenueUsd + usd,
              totalViews: r.totalViews + views,
            }
          : r,
      ),
    })),

  updateMetrics: (contentId, metrics) =>
    set((s) => ({
      content: s.content.map((c) =>
        c.id === contentId ? { ...c, metrics } : c,
      ),
    })),

  setCredential: (platform, key) => {
    setCredential(platform, key)
    set((s) => ({
      credentialStatus: { ...s.credentialStatus, [platform]: !!key },
    }))
  },

  refreshCredentials: () =>
    set(() => ({ credentialStatus: initialCredStatus() })),

  reset: () =>
    set({
      trends: [],
      content: [],
      approvals: [],
      revenue: initialRevenue(),
      credentialStatus: initialCredStatus(),
    }),
}))

// Request a new approval — used by orchestrator when cost > 0
export function requestApproval(params: {
  description: string
  reason: string
  costUsd: number
  platform: Platform
  contentId: string | null
  requestedBy: string
}) {
  useBusinessStore.setState((s) => ({
    approvals: [
      ...s.approvals,
      {
        id: nextId('approval'),
        status: 'pending' as const,
        requestedAt: Date.now(),
        ...params,
      } satisfies ApprovalRequest,
    ],
  }))
}
