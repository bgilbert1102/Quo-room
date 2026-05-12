/**
 * Global settings — AI model credentials and app configuration.
 * Keys are never written to disk or git; they live only in this module.
 */
import { create } from 'zustand'

// Module-level key store (never in Zustand state, so it can't be serialised/logged)
let _anthropicKey: string = (import.meta.env['VITE_ANTHROPIC_API_KEY'] as string | undefined) ?? ''
let _googleKey: string    = (import.meta.env['VITE_GOOGLE_AI_KEY']     as string | undefined) ?? ''

export function getAnthropicKey(): string { return _anthropicKey }
export function getGoogleKey():    string { return _googleKey }

interface SettingsState {
  anthropicConnected: boolean
  googleConnected:    boolean
  setAnthropicKey: (key: string) => void
  setGoogleKey:    (key: string) => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  anthropicConnected: !!_anthropicKey,
  googleConnected:    !!_googleKey,

  setAnthropicKey: (key) => {
    _anthropicKey = key.trim()
    set({ anthropicConnected: !!_anthropicKey })
  },

  setGoogleKey: (key) => {
    _googleKey = key.trim()
    set({ googleConnected: !!_googleKey })
  },
}))
