import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

export default function Signup() {
  const { signUp, isSupabaseConfigured } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured) {
    return <div className="page-center"><p>{t('accounts_not_setup')}</p></div>
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { data, error } = await signUp(email.trim(), password, name.trim())
    setBusy(false)
    if (error) {
      setError(error.message)
    } else if (data.session) {
      navigate('/', { replace: true })
    } else {
      // Email confirmation is on — ask the user to check their inbox.
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="page-center">
        <div className="auth-card">
          <h1>{t('check_email')}</h1>
          <p>{t('confirm_sent', { email })}</p>
          <Link to="/login" className="btn btn-primary">{t('go_to_login')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('create_account')}</h1>
        <p className="auth-sub">{t('signup_sub')}</p>
        {error && <div className="form-error">{error}</div>}
        <label>{t('display_name')}<input className="input" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name_placeholder')} /></label>
        <label>{t('email')}<input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>{t('password_min')}<input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? t('creating') : t('signup')}</button>
        <p className="auth-switch">{t('have_account')} <Link to="/login">{t('login_link')}</Link></p>
      </form>
    </div>
  )
}
