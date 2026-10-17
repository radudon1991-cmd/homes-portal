import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'

// One-tap sign-in with an existing account (Google / Facebook).
// The buttons call Supabase's OAuth flow directly; no password is typed.
// NOTE: each provider must be enabled in the Supabase dashboard
// (Authentication -> Providers) with its own OAuth client ID/secret
// before its button will work.
const PROVIDERS = [
  { id: 'google', label: 'Google', className: 'social-google' },
  { id: 'facebook', label: 'Facebook', className: 'social-facebook' },
]

export default function SocialLogin() {
  const { t } = useLang()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const go = async (provider) => {
    setError('')
    setBusy(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    // On success the browser leaves for the provider's login page,
    // so reaching here means something failed.
    if (error) {
      setError(t('oauth_error'))
      setBusy('')
    }
  }

  return (
    <div className="social-login">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`btn btn-block social-btn ${p.className}`}
          disabled={busy === p.id}
          onClick={() => go(p.id)}
        >
          {t('continue_with', { provider: p.label })}
        </button>
      ))}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}
