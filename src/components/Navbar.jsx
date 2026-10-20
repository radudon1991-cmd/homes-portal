import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import { useLang } from '../lib/i18n'
import { fetchUnreadCount } from '../lib/messages'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const { t, lang, setLang } = useLang()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnread(0)
      return
    }
    let alive = true
    fetchUnreadCount(user.id)
      .then((c) => {
        if (alive) setUnread(c)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <img className="brand-mark" src="/logo.svg" alt="TruePin Property logo" />
        <span className="brand-text">
          {t('brand_main')} <em>{t('brand_accent')}</em>
        </span>
      </Link>
      <nav className="nav-links">
        <div className="lang-toggle" role="group" aria-label="Language">
          <button
            type="button"
            className={lang === 'en' ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={lang === 'th' ? 'lang-btn active' : 'lang-btn'}
            onClick={() => setLang('th')}
          >
            ไทย
          </button>
        </div>
        <Link to="/" className="nav-link">{t('nav_search')}</Link>
        {(profile?.is_admin || profile?.is_moderator) && (
          <Link to="/admin" className="nav-link">{t('nav_admin')}</Link>
        )}
        {user ? (
          <>
            <Link to="/post" className="nav-link nav-cta">{t('nav_post')}</Link>
            <Link to="/inbox" className="nav-link">
              {t('nav_inbox')}
              {unread > 0 && <span className="nav-badge">{unread}</span>}
            </Link>
            <Link to="/my-listings" className="nav-link">{t('nav_mylistings')}</Link>
            <Link to="/profile" className="nav-link nav-profile">
              {profile?.avatar_url ? (
                <img className="nav-avatar" src={profile.avatar_url} alt="" />
              ) : (
                <span className="nav-avatar nav-avatar-initial">
                  {(profile?.display_name || user.email || '?').trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span>{profile?.display_name || t('nav_profile')}</span>
            </Link>
            <button className="btn btn-ghost" onClick={handleSignOut}>{t('nav_logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">{t('nav_login')}</Link>
            <Link to="/signup" className="btn btn-primary">{t('nav_signup')}</Link>
          </>
        )}
      </nav>
    </header>
  )
}
