import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchMyListings, deleteListing } from '../lib/listings'
import { formatBaht, formatDate } from '../lib/format'

export default function MyListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetchMyListings(user.id).then(({ data, error }) => {
      if (error) setError(error.message)
      else setListings(data)
      setLoading(false)
    })
  }

  useEffect(load, [user.id])

  const remove = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    const { error } = await deleteListing(id)
    if (error) setError(error.message)
    else setListings((ls) => ls.filter((l) => l.id !== id))
  }

  if (loading) return <div className="page-center">Loading…</div>

  return (
    <div className="dashboard">
      <div className="dash-head">
        <h1>My listings</h1>
        <Link to="/post" className="btn btn-primary">+ Post new property</Link>
      </div>
      {error && <div className="form-error">{error}</div>}
      {listings.length === 0 ? (
        <div className="empty-state">
          <p>You haven't posted any properties yet.</p>
          <Link to="/post" className="btn btn-primary">Post your first property</Link>
        </div>
      ) : (
        <div className="dash-list">
          {listings.map((l) => (
            <div key={l.id} className="dash-row">
              <img
                className="dash-thumb"
                src={l.image_urls?.[0] || 'https://picsum.photos/seed/placeholder/200/150'}
                alt=""
              />
              <div className="dash-info">
                <div className="dash-title">{l.title}</div>
                <div className="dash-meta">
                  {formatBaht(l.price_thb)} · {l.listing_type === 'rent' ? 'For rent' : 'For sale'} · {l.province} · {formatDate(l.created_at)}
                </div>
              </div>
              <div className="dash-actions">
                <Link to={`/listing/${l.id}`} className="btn btn-ghost btn-sm">View</Link>
                <Link to={`/edit/${l.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                <button className="btn btn-danger btn-sm" onClick={() => remove(l.id, l.title)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
