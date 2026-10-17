import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { t, lang, setLang } = useLang()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">⌂</span>
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
        {user ? (
          <>
            <Link to="/post" className="nav-link nav-cta">{t('nav_post')}</Link>
            <Link to="/my-listings" className="nav-link">{t('nav_mylistings')}</Link>
            <span className="nav-user">{user.email}</span>
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
