import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'
import SocialLogin from '../components/SocialLogin'

export default function Login() {
  const { signIn, isSupabaseConfigured } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured) {
    return <div className="page-center"><p>{t('accounts_not_setup')}</p></div>
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(error.message)
    else navigate(location.state?.from || '/', { replace: true })
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('welcome')}</h1>
        <p className="auth-sub">{t('login_sub')}</p>
        {error && <div className="form-error">{error}</div>}
        <SocialLogin />
        <div className="auth-divider">{t('or_divider')}</div>
        <label>{t('email')}<input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>{t('password')}<input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? t('logging_in') : t('login')}</button>
        <p className="auth-switch">{t('no_account')} <Link to="/signup">{t('signup_free_link')}</Link></p>
      </form>
    </div>
  )
}
