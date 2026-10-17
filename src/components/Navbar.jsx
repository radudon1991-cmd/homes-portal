import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
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
          Homes <em>Map Portal</em>
        </span>
      </Link>
      <nav className="nav-links">
        <Link to="/" className="nav-link">Search</Link>
        {user ? (
          <>
            <Link to="/post" className="nav-link nav-cta">+ Post property</Link>
            <Link to="/my-listings" className="nav-link">My listings</Link>
            <span className="nav-user">{user.email}</span>
            <button className="btn btn-ghost" onClick={handleSignOut}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Log in</Link>
            <Link to="/signup" className="btn btn-primary">Sign up free</Link>
          </>
        )}
      </nav>
    </header>
  )
}
