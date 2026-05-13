const TOKEN   = process.env['TELEGRAM_BOT_TOKEN']
const CHAT_ID = process.env['TELEGRAM_CHAT_ID']

if (!TOKEN || !CHAT_ID) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
}

const _token  = TOKEN
const _chatId = CHAT_ID

export async function sendTelegram(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${_token}/sendMessage`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: _chatId,
        text: message.slice(0, 4096),
        parse_mode: 'Markdown',
      }),
    })
  } catch (cause) {
    // Wrap network errors without leaking the token
    const msg = cause instanceof Error ? cause.message : String(cause)
    throw new Error(`Telegram network error: ${msg}`)
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram send failed: ${res.status} ${body}`)
  }
}
