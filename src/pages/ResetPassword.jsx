import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'

// Landing page for the password-reset email link. The link carries a
// recovery session in the URL; once it is picked up, the user types a
// new password and it is saved via updateUser.
export default function ResetPassword() {
  const { t } = useLang()
  const [status, setStatus] = useState('checking') // checking | ready | invalid | done
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setStatus('ready')
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session) setStatus('ready')
    })
    // Give the URL tokens a moment to be parsed before calling it invalid.
    const timer = setTimeout(() => {
      if (!alive) return
      supabase.auth.getSession().then(({ data }) => {
        if (alive && !data.session) {
          setStatus((s) => (s === 'checking' ? 'invalid' : s))
        }
      })
    }, 1500)
    return () => {
      alive = false
      clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(t('password_too_short'))
      return
    }
    if (password !== confirm) {
      setError(t('passwords_no_match'))
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    // Sign out the recovery session so they log in fresh with the new password.
    await supabase.auth.signOut()
    setStatus('done')
  }

  if (status === 'checking') {
    return <div className="page-center">{t('loading')}</div>
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('reset_title')}</h1>
        {status === 'invalid' && (
          <>
            <div className="form-error">{t('reset_link_invalid')}</div>
            <p className="auth-switch">
              <Link to="/forgot-password">{t('request_new_link')}</Link>
              {' · '}
              <Link to="/login">{t('back_to_login')}</Link>
            </p>
          </>
        )}
        {status === 'done' && (
          <>
            <div className="msg-ok">✓ {t('password_updated')}</div>
            <p className="auth-switch">
              <Link to="/login">{t('back_to_login')}</Link>
            </p>
          </>
        )}
        {status === 'ready' && (
          <>
            {error && <div className="form-error">{error}</div>}
            <label>
              {t('new_password')}
              <input
                className="input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              {t('confirm_password')}
              <input
                className="input"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? t('msg_sending') : t('update_password')}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
