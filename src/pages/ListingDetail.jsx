import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { dotIcon } from '../components/MapView'
import ReportButton from '../components/ReportButton'
import SellerRating from '../components/SellerRating'
import { fetchListingById } from '../lib/listings'
import { formatBaht, formatDate } from '../lib/format'
import { useLang, TYPE_KEY } from '../lib/i18n'
import { tileConfig } from '../lib/mapTiles'
import { useAuth } from '../lib/AuthContext'

export default function ListingDetail() {
  const { id } = useParams()
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const miniMapRef = useRef(null)

  const typeLabel = (v) => t(TYPE_KEY[v] ?? v)

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
    const tiles = tileConfig(lang)
    L.tileLayer(tiles.url, {
      attribution: tiles.attribution,
    }).addTo(map)
    L.marker([listing.latitude, listing.longitude], { icon: dotIcon() }).addTo(map)
    return () => map.remove()
  }, [listing, lang])

  if (loading) return <div className="page-center">{t('loading')}</div>
  if (!listing) {
    return (
      <div className="page-center">
        <p>{t('listing_not_found')}</p>
        <Link to="/" className="btn btn-primary">{t('back_to_search')}</Link>
      </div>
    )
  }

  const photos = listing.image_urls?.length ? listing.image_urls : []
  const seller = listing.profiles ?? {}

  return (
    <div className="detail">
      <Link to="/" className="back-link">{t('back_to_map')}</Link>
      {listing.status === 'pending' && (
        <div className="notice-banner">{t('detail_pending_notice')}</div>
      )}
      {listing.status === 'rejected' && (
        <div className="notice-banner is-rejected">{t('detail_rejected_notice')}</div>
      )}
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
            <div className="detail-no-photo">{t('no_photos')}</div>
          )}
          <h2 className="detail-desc-title">{t('about')}</h2>
          <p className="detail-desc">{listing.description || t('no_description')}</p>
          {listing.latitude != null && <div ref={miniMapRef} className="detail-minimap" />}
        </div>
        <div className="detail-right">
          <span className={`badge ${listing.listing_type}`}>
            {listing.listing_type === 'rent' ? t('for_rent') : t('for_sale')}
          </span>
          <h1 className="detail-title">{listing.title}</h1>
          <div className="detail-price">{formatBaht(listing.price_thb)}</div>
          <div className="detail-facts">
            <div><span>{t('fact_type')}</span><strong>{typeLabel(listing.property_type)}</strong></div>
            {listing.bedrooms > 0 && <div><span>{t('fact_bedrooms')}</span><strong>{listing.bedrooms}</strong></div>}
            {listing.bathrooms > 0 && <div><span>{t('fact_bathrooms')}</span><strong>{listing.bathrooms}</strong></div>}
            {listing.area_sqm > 0 && <div><span>{t('fact_area')}</span><strong>{listing.area_sqm} {t('sqm')}</strong></div>}
            <div><span>{t('fact_province')}</span><strong>{listing.province}</strong></div>
            <div><span>{t('fact_posted')}</span><strong>{formatDate(listing.created_at, lang)}</strong></div>
          </div>
          {listing.address && <p className="detail-address">📍 {listing.address}</p>}
          <div className="seller-card">
            <h3>{t('contact_seller')}</h3>
            <p className="seller-name">{seller.display_name || t('seller_fallback')}</p>
            {seller.phone && (
              <a className="btn btn-primary btn-block" href={`tel:${seller.phone}`}>📞 {seller.phone}</a>
            )}
          </div>
          <div className="trust-box">
            <SellerRating sellerId={listing.owner_id} />
            {user && user.id !== listing.owner_id && (
              <ReportButton listingId={listing.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
