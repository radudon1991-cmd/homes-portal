import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { dotIcon } from '../components/MapView'
import { fetchListingById } from '../lib/listings'
import { formatBaht, formatDate, PROPERTY_TYPES } from '../lib/format'

const typeLabel = (v) => PROPERTY_TYPES.find((t) => t.value === v)?.label ?? v

export default function ListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const miniMapRef = useRef(null)

  useEffect(() => {
    fetchListingById(id).then(({ data }) => {
      setListing(data)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!listing || listing.latitude == null || !miniMapRef.current) return
    const map = L.map(miniMapRef.current, { scrollWheelZoom: false }).setView(
      [listing.latitude, listing.longitude],
      14
    )
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    L.marker([listing.latitude, listing.longitude], { icon: dotIcon() }).addTo(map)
    return () => map.remove()
  }, [listing])

  if (loading) return <div className="page-center">Loading…</div>
  if (!listing) {
    return (
      <div className="page-center">
        <p>Listing not found.</p>
        <Link to="/" className="btn btn-primary">Back to search</Link>
      </div>
    )
  }

  const photos = listing.image_urls?.length ? listing.image_urls : []
  const seller = listing.profiles ?? {}

  return (
    <div className="detail">
      <Link to="/" className="back-link">← Back to map</Link>
      <div className="detail-grid">
        <div className="detail-left">
          {photos.length > 0 ? (
            <>
              <img className="detail-main-photo" src={photos[activePhoto]} alt={listing.title} />
              {photos.length > 1 && (
                <div className="detail-thumbs">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      className={`thumb${i === activePhoto ? ' active' : ''}`}
                      onClick={() => setActivePhoto(i)}
                    >
                      <img src={p} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="detail-no-photo">No photos yet</div>
          )}
          <h2 className="detail-desc-title">About this property</h2>
          <p className="detail-desc">{listing.description || 'No description provided.'}</p>
          {listing.latitude != null && <div ref={miniMapRef} className="detail-minimap" />}
        </div>
        <div className="detail-right">
          <span className={`badge ${listing.listing_type}`}>
            {listing.listing_type === 'rent' ? 'For rent' : 'For sale'}
          </span>
          <h1 className="detail-title">{listing.title}</h1>
          <div className="detail-price">{formatBaht(listing.price_thb)}</div>
          <div className="detail-facts">
            <div><span>Type</span><strong>{typeLabel(listing.property_type)}</strong></div>
            {listing.bedrooms > 0 && <div><span>Bedrooms</span><strong>{listing.bedrooms}</strong></div>}
            {listing.bathrooms > 0 && <div><span>Bathrooms</span><strong>{listing.bathrooms}</strong></div>}
            {listing.area_sqm > 0 && <div><span>Floor area</span><strong>{listing.area_sqm} sqm</strong></div>}
            <div><span>Province</span><strong>{listing.province}</strong></div>
            <div><span>Posted</span><strong>{formatDate(listing.created_at)}</strong></div>
          </div>
          {listing.address && <p className="detail-address">📍 {listing.address}</p>}
          <div className="seller-card">
            <h3>Contact seller</h3>
            <p className="seller-name">{seller.display_name || 'Seller'}</p>
            {seller.phone && (
              <a className="btn btn-primary btn-block" href={`tel:${seller.phone}`}>📞 {seller.phone}</a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
