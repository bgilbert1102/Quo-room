import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── helpers ───────────────────────────────────────────────────────────────────

function setupEnv(token = 'test-token-123', chatId = '99887766') {
  process.env['TELEGRAM_BOT_TOKEN'] = token
  process.env['TELEGRAM_CHAT_ID']   = chatId
}

function clearEnv() {
  delete process.env['TELEGRAM_BOT_TOKEN']
  delete process.env['TELEGRAM_CHAT_ID']
}

// We resolve the module once with valid env vars for most tests,
// then use vi.resetModules() + dynamic import for startup-guard tests.
let sendTelegram: (msg: string) => Promise<void>

beforeEach(async () => {
  setupEnv()
  vi.resetModules()
  const mod = await import('./telegram')
  sendTelegram = mod.sendTelegram
})

afterEach(() => {
  vi.restoreAllMocks()
  clearEnv()
})

// ── happy path ────────────────────────────────────────────────────────────────

describe('sendTelegram — happy path', () => {
  it('sends POST to https://api.telegram.org/bot<TOKEN>/sendMessage with token in path', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    )

    await sendTelegram('hello')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const url = fetchSpy.mock.calls[0]?.[0] as string
    expect(url).toBe('https://api.telegram.org/bottest-token-123/sendMessage')
  })

  it('request body contains chat_id, text, and parse_mode: Markdown', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    )

    await sendTelegram('test message')

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect(body['chat_id']).toBe('99887766')
    expect(body['text']).toBe('test message')
    expect(body['parse_mode']).toBe('Markdown')
  })

  it('message longer than 4096 chars is truncated to exactly 4096 chars in request body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    )

    await sendTelegram('x'.repeat(5000))

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect((body['text'] as string).length).toBe(4096)
  })

  it('message of exactly 4096 chars is not truncated', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    )

    await sendTelegram('y'.repeat(4096))

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect((body['text'] as string).length).toBe(4096)
  })

  it('200 response resolves the returned promise', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    )

    await expect(sendTelegram('hello')).resolves.toBeUndefined()
  })
})

// ── error handling ────────────────────────────────────────────────────────────

describe('sendTelegram — error handling', () => {
  it('400 response throws an error containing the status code and response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Bad Request', { status: 400 }),
    )

    let err: Error | undefined
    try { await sendTelegram('hello') } catch (e) { if (e instanceof Error) err = e }
    expect(err?.message).toContain('400')
    expect(err?.message).toContain('Bad Request')
  })

  it('403 response throws with status and body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Forbidden', { status: 403 }),
    )

    await expect(sendTelegram('hello')).rejects.toThrow('403')
  })

  it('500 response throws with status and body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    )

    let err: Error | undefined
    try { await sendTelegram('hello') } catch (e) { if (e instanceof Error) err = e }
    expect(err?.message).toContain('500')
    expect(err?.message).toContain('Internal Server Error')
  })

  it('503 response throws with status and body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Service Unavailable', { status: 503 }),
    )

    await expect(sendTelegram('hello')).rejects.toThrow('503')
  })

  it('network error (fetch rejects) throws with original error message preserved', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:443'))

    await expect(sendTelegram('hello')).rejects.toThrow('ECONNREFUSED')
  })
})

// ── token safety ──────────────────────────────────────────────────────────────

describe('sendTelegram — token safety', () => {
  it('4xx error message does not contain the bot token string', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Bad Request', { status: 400 }),
    )

    let caughtMessage = ''
    try {
      await sendTelegram('hello')
    } catch (err) {
      if (err instanceof Error) caughtMessage = err.message
    }
    expect(caughtMessage).not.toContain('test-token-123')
  })

  it('network error message does not contain the bot token string', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fetch failed'))

    let caughtMessage = ''
    try {
      await sendTelegram('hello')
    } catch (err) {
      if (err instanceof Error) caughtMessage = err.message
    }
    expect(caughtMessage).not.toContain('test-token-123')
  })
})

// ── module startup ────────────────────────────────────────────────────────────

describe('module startup', () => {
  it('importing telegram.ts with valid TOKEN and CHAT_ID does not throw', async () => {
    setupEnv('valid-token', 'valid-chat')
    vi.resetModules()
    await expect(import('./telegram')).resolves.toBeDefined()
  })

  it('importing telegram.ts with TELEGRAM_BOT_TOKEN set to empty string throws at import, not at first send', async () => {
    process.env['TELEGRAM_BOT_TOKEN'] = ''
    vi.resetModules()
    await expect(import('./telegram')).rejects.toThrow()
  })

  it('importing telegram.ts with TELEGRAM_BOT_TOKEN missing entirely throws at import', async () => {
    delete process.env['TELEGRAM_BOT_TOKEN']
    vi.resetModules()
    await expect(import('./telegram')).rejects.toThrow()
  })

  it('importing telegram.ts with TELEGRAM_CHAT_ID missing throws at import', async () => {
    process.env['TELEGRAM_BOT_TOKEN'] = 'some-token'
    delete process.env['TELEGRAM_CHAT_ID']
    vi.resetModules()
    await expect(import('./telegram')).rejects.toThrow()
  })
})
