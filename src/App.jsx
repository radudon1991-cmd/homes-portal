import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { useLang } from './lib/i18n'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import ListingDetail from './pages/ListingDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PostListing from './pages/PostListing'
import MyListings from './pages/MyListings'
import Admin from './pages/Admin'
import Inbox from './pages/Inbox'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Contact from './pages/Contact'
import FooterStats from './components/FooterStats'

function Shell() {
  const { t } = useLang()
  const { user } = useAuth()

  // Track account activity for the 2-year inactive-account cleanup
  // (migration8). Touches profiles.last_active_at at most once a day.
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return
    const key = `tre-last-active-${user.id}`
    const last = Number(localStorage.getItem(key) || 0)
    if (Date.now() - last < 24 * 3600 * 1000) return
    localStorage.setItem(key, String(Date.now()))
    supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)
      .then(() => {})
  }, [user])

  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/post"
            element={<ProtectedRoute><PostListing /></ProtectedRoute>}
          />
          <Route
            path="/edit/:id"
            element={<ProtectedRoute><PostListing /></ProtectedRoute>}
          />
          <Route
            path="/my-listings"
            element={<ProtectedRoute><MyListings /></ProtectedRoute>}
          />
          <Route
            path="/inbox"
            element={<ProtectedRoute><Inbox /></ProtectedRoute>}
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<div className="page-center"><p>{t('page_not_found')}</p></div>} />
        </Routes>
      </main>
      <footer className="footer">
        <span>{t('footer')}</span>
        <FooterStats />
        <div className="footer-actions">
          <Link to="/contact" className="btn btn-primary btn-sm">
            ✉️ {t('contact_us')}
          </Link>
          <a
            className="btn btn-line btn-sm"
            href="https://line.me/R/ti/p/@truepinproperty"
            target="_blank"
            rel="noreferrer"
          >
            💬 LINE @truepinproperty
          </a>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
