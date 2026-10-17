import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import ListingDetail from './pages/ListingDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PostListing from './pages/PostListing'
import MyListings from './pages/MyListings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
              <Route path="*" element={<div className="page-center"><p>Page not found.</p></div>} />
            </Routes>
          </main>
          <footer className="footer">
            <span>Homes Real Estate Map Portal — find Thai properties on the map.</span>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
