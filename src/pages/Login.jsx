import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { signIn, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured) {
    return <div className="page-center"><p>Accounts are not set up yet — connect Supabase first (see README).</p></div>
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
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to post and manage your properties.</p>
        {error && <div className="form-error">{error}</div>}
        <label>Email<input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="auth-switch">No account yet? <Link to="/signup">Sign up free</Link></p>
      </form>
    </div>
  )
}
