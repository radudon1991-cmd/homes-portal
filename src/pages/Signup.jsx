import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Signup() {
  const { signUp, isSupabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured) {
    return <div className="page-center"><p>Accounts are not set up yet — connect Supabase first (see README).</p></div>
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
          <h1>Check your email</h1>
          <p>We sent a confirmation link to <strong>{email}</strong>. Click it, then log in.</p>
          <Link to="/login" className="btn btn-primary">Go to log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="auth-sub">Free. Post properties in minutes.</p>
        {error && <div className="form-error">{error}</div>}
        <label>Display name<input className="input" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nicha P." /></label>
        <label>Email<input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password (min 6 characters)<input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  )
}
