/**
 * Platform API stubs — one per platform.
 *
 * Each stub checks for an env variable (or runtime credential).
 * When the credential is absent → stub mode (returns mock data, logs intent).
 * When present → TODO marker shows where the real HTTP call goes.
 *
 * VERIFIED APIs:
 *   Etsy Open API v3   — https://developers.etsy.com/documentation
 *   YouTube Data API v3 — https://developers.google.com/youtube/v3
 *   TikTok for Business — https://business-api.tiktok.com/portal/docs  (requires approval)
 *   Fiverr             — No public REST API for sellers; will use browser automation stub
 *
 * All credentials live in .env.local — never in this file or in git.
 */

import type { ContentBrief, ContentMetrics, Platform } from './types'

// ── Credential helpers ────────────────────────────────────────────────────────
// Runtime credentials set via the UI CredentialsPanel
const _runtimeCreds: Partial<Record<Platform, string>> = {}

export function setCredential(platform: Platform, key: string) {
  _runtimeCreds[platform] = key
}

export function hasCredential(platform: Platform): boolean {
  const envKey: Record<Platform, string> = {
    etsy:    'VITE_ETSY_API_KEY',
    tiktok:  'VITE_TIKTOK_ACCESS_TOKEN',
    youtube: 'VITE_YOUTUBE_API_KEY',
    fiverr:  'VITE_FIVERR_TOKEN',
  }
  return !!(import.meta.env[envKey[platform]] ?? _runtimeCreds[platform])
}

function getKey(platform: Platform): string | undefined {
  const envKey: Record<Platform, string> = {
    etsy:    'VITE_ETSY_API_KEY',
    tiktok:  'VITE_TIKTOK_ACCESS_TOKEN',
    youtube: 'VITE_YOUTUBE_API_KEY',
    fiverr:  'VITE_FIVERR_TOKEN',
  }
  return (import.meta.env[envKey[platform]] as string | undefined) ?? _runtimeCreds[platform]
}

// ── Etsy ──────────────────────────────────────────────────────────────────────
// Docs: https://developers.etsy.com/documentation/reference#operation/createDraftListing
export async function etsyPostListing(brief: ContentBrief): Promise<{ listingId: string }> {
  const key = getKey('etsy')
  if (!key) {
    console.info('[Etsy STUB] Would post listing:', brief.title)
    return { listingId: `stub-etsy-${Date.now()}` }
  }
  // TODO: real call
  // POST https://openapi.etsy.com/v3/application/shops/{shop_id}/listings
  // Headers: { 'x-api-key': key, 'Content-Type': 'application/json' }
  // Body: { title, description, price, quantity, taxonomy_id, tags: brief.hashtags }
  throw new Error('Etsy real API not yet wired — provide VITE_ETSY_API_KEY in .env.local')
}

export async function etsyGetMetrics(listingId: string): Promise<ContentMetrics> {
  const key = getKey('etsy')
  if (!key) {
    return { views: Math.floor(Math.random() * 200), likes: Math.floor(Math.random() * 30), comments: 0, shares: 0, revenueUsd: 0 }
  }
  // TODO: GET https://openapi.etsy.com/v3/application/listings/{listing_id}/stats
  void listingId
  throw new Error('Etsy metrics API not yet wired')
}

// ── TikTok ────────────────────────────────────────────────────────────────────
// Docs: https://business-api.tiktok.com/portal/docs?id=1740302848100353
export async function tiktokPostVideo(brief: ContentBrief): Promise<{ videoId: string }> {
  const key = getKey('tiktok')
  if (!key) {
    console.info('[TikTok STUB] Would post video:', brief.title)
    return { videoId: `stub-tt-${Date.now()}` }
  }
  // TODO: real call
  // POST https://business-api.tiktok.com/open_api/v1.3/video/upload/
  // Headers: { 'Access-Token': key }
  // Then: POST /open_api/v1.3/post/publish/video/init/ with caption + hashtags
  throw new Error('TikTok API not yet wired — provide VITE_TIKTOK_ACCESS_TOKEN in .env.local')
}

export async function tiktokGetMetrics(videoId: string): Promise<ContentMetrics> {
  const key = getKey('tiktok')
  if (!key) {
    return { views: Math.floor(Math.random() * 5000), likes: Math.floor(Math.random() * 400), comments: Math.floor(Math.random() * 50), shares: Math.floor(Math.random() * 100), revenueUsd: 0 }
  }
  // TODO: GET https://business-api.tiktok.com/open_api/v1.3/research/video/query/
  void videoId
  throw new Error('TikTok metrics API not yet wired')
}

// ── YouTube ───────────────────────────────────────────────────────────────────
// Docs: https://developers.google.com/youtube/v3/docs/videos/insert
export async function youtubeUploadVideo(brief: ContentBrief): Promise<{ videoId: string }> {
  const key = getKey('youtube')
  if (!key) {
    console.info('[YouTube STUB] Would upload video:', brief.title)
    return { videoId: `stub-yt-${Date.now()}` }
  }
  // TODO: real call — requires OAuth2, not just an API key for uploads
  // POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
  // Headers: { 'Authorization': `Bearer ${oauthToken}` }
  // Body: { snippet: { title, description, tags }, status: { privacyStatus: 'public' } }
  throw new Error('YouTube upload not yet wired — provide OAuth token via CredentialsPanel')
}

export async function youtubeGetMetrics(videoId: string): Promise<ContentMetrics> {
  const key = getKey('youtube')
  if (!key) {
    return { views: Math.floor(Math.random() * 1200), likes: Math.floor(Math.random() * 80), comments: Math.floor(Math.random() * 20), shares: 0, revenueUsd: 0 }
  }
  // TODO: GET https://www.googleapis.com/youtube/v3/videos?part=statistics&id={videoId}&key={key}
  void videoId
  throw new Error('YouTube metrics not yet wired')
}

// ── Fiverr ────────────────────────────────────────────────────────────────────
// Note: Fiverr has no public REST API for creating gigs programmatically.
// Strategy: generate the gig copy and present it for manual posting,
// OR use browser automation (Playwright) once the user approves that approach.
export async function fiverrPrepareGig(brief: ContentBrief): Promise<{ gigDraft: string }> {
  void getKey('fiverr')
  console.info('[Fiverr STUB] Preparing gig draft:', brief.title)
  // Always returns a draft for manual review — no automated posting until automation approved
  const draft = [
    `GIG TITLE: ${brief.title}`,
    ``,
    `DESCRIPTION:`,
    brief.description,
    ``,
    `TAGS: ${brief.keywords.join(', ')}`,
    ``,
    `PACKAGES:`,
    `  Basic ($25): Starter package — 1 revision`,
    `  Standard ($75): Professional package — 3 revisions`,
    `  Premium ($150): Full-service — unlimited revisions + source files`,
  ].join('\n')
  return { gigDraft: draft }
}
