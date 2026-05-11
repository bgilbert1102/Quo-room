export type Platform = 'etsy' | 'tiktok' | 'youtube' | 'fiverr'

export type ContentType =
  | 'tiktok-video'
  | 'youtube-short'
  | 'youtube-video'
  | 'etsy-listing'
  | 'fiverr-gig'

export interface TrendSignal {
  id: string
  topic: string
  platform: Platform
  score: number        // 0-100 relevance/virality estimate
  keywords: string[]
  detectedAt: number
  detectedBy: string  // agentId
}

export interface ContentBrief {
  id: string
  type: ContentType
  title: string
  description: string
  hook: string         // first line / headline
  keywords: string[]
  hashtags: string[]
  platform: Platform
  trendId: string | null
  createdBy: string    // agentId
  status: 'draft' | 'review' | 'approved' | 'posted' | 'rejected'
  costUsd: number      // 0 = free to post
  postedAt: number | null
  metrics: ContentMetrics | null
  createdAt: number
}

export interface ContentMetrics {
  views: number
  likes: number
  comments: number
  shares: number
  revenueUsd: number
}

// Requires human approval before proceeding
export interface ApprovalRequest {
  id: string
  description: string
  reason: string       // why this costs money
  costUsd: number
  platform: Platform
  contentId: string | null
  requestedBy: string  // agentId
  requestedAt: number
  status: 'pending' | 'approved' | 'rejected'
}

export interface PlatformCredentials {
  platform: Platform
  connected: boolean
  // Keys are stored in .env.local — never in this store or in git
  // This object only tracks whether a connection is active
  label: string        // display label
}

export interface PlatformRevenue {
  platform: Platform
  totalRevenueUsd: number
  weekRevenueUsd: number
  totalViews: number
  followers: number
}
