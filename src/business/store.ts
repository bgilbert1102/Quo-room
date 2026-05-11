import { create } from 'zustand'
import { detectTrend, generateContentBrief, suggestContentTypes } from './engine'
import { hasCredential, setCredential } from './platforms'
import type {
  ApprovalRequest,
  ContentBrief,
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
  markPosted: (contentId: string) => void
  approveSpend: (approvalId: string) => void
  rejectSpend: (approvalId: string) => void
  setCredential: (platform: Platform, key: string) => void
  refreshCredentials: () => void
  reset: () => void
}

const PLATFORMS: Platform[] = ['etsy', 'tiktok', 'youtube', 'fiverr']

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

export const useBusinessStore = create<BusinessState>()((set, get) => ({
  trends: [],
  content: [],
  approvals: [],
  revenue: initialRevenue(),
  credentialStatus: initialCredStatus(),

  runTrendScan: (agentId) => {
    const signal = detectTrend(agentId)
    set((s) => ({ trends: [...s.trends.slice(-29), signal] }))

    // Auto-plan content if opus has strategic confidence (score > 70)
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

  markPosted: (contentId) =>
    set((s) => ({
      content: s.content.map((c) =>
        c.id === contentId
          ? { ...c, status: 'posted' as const, postedAt: Date.now() }
          : c,
      ),
    })),

  approveSpend: (approvalId) => {
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === approvalId ? { ...a, status: 'approved' as const } : a,
      ),
    }))
    // After approval, proceed with the content
    const approval = get().approvals.find((a) => a.id === approvalId)
    if (approval?.contentId) get().approveContent(approval.contentId)
  },

  rejectSpend: (approvalId) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === approvalId ? { ...a, status: 'rejected' as const } : a,
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

  // Simulate earning (called by sentience when content is performing)
  _addRevenue: (platform: Platform, usd: number, views: number) =>
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
