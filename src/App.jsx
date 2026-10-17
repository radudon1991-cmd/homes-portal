import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
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

function Shell() {
  const { t } = useLang()
  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
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
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<div className="page-center"><p>{t('page_not_found')}</p></div>} />
        </Routes>
      </main>
      <footer className="footer">
        <span>{t('footer')}</span>
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
