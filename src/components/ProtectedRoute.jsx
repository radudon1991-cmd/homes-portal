import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

export default function ProtectedRoute({ children }) {
  const { user, loading, isSupabaseConfigured } = useAuth()
  const { t } = useLang()
  const location = useLocation()

  if (loading) return <div className="page-center">{t('loading')}</div>
  if (!isSupabaseConfigured) {
    return (
      <div className="page-center">
        <p>{t('accounts_not_setup')}</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
