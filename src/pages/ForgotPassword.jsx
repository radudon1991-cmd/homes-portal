import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useLang } from '../lib/i18n'

// "Forgot password" page: the user enters their email and Supabase
// sends them a reset link that lands on /reset-password.
export default function ForgotPassword() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div className="page-center">
        <p>{t('accounts_not_setup')}</p>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('forgot_title')}</h1>
        <p className="auth-sub">{t('forgot_sub')}</p>
        {sent ? (
          <>
            <div className="msg-ok">✓ {t('reset_email_sent')}</div>
            <p className="auth-switch">
              <Link to="/login">{t('back_to_login')}</Link>
            </p>
          </>
        ) : (
          <>
            {error && <div className="form-error">{error}</div>}
            <label>
              {t('email')}
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? t('msg_sending') : t('send_reset_link')}
            </button>
            <p className="auth-switch">
              <Link to="/login">{t('back_to_login')}</Link>
            </p>
          </>
        )}
      </form>
    </div>
  )
}
