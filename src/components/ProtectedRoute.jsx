import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, isSupabaseConfigured } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page-center">Loading…</div>
  if (!isSupabaseConfigured) {
    return (
      <div className="page-center">
        <p>Accounts are not set up yet — connect Supabase first (see README).</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
