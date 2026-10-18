import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { dotIcon } from '../components/MapView'
import ReportButton from '../components/ReportButton'
import ListingChat from '../components/ListingChat'
import SellerRating from '../components/SellerRating'
import { fetchListingById, isExpired } from '../lib/listings'
import { sendMessage } from '../lib/messages'
import { formatBaht, formatDate, formatPrice, provinceLabel } from '../lib/format'
import { useLang, TYPE_KEY } from '../lib/i18n'
import { createBaseLayer } from '../lib/mapTiles'
import { useAuth } from '../lib/AuthContext'

// Build the LINE chat link from whatever the seller entered:
// a full URL, an @official-account ID, or a plain LINE ID.
function lineUrl(id) {
  const v = (id || '').trim()
  if (!v) return '#'
  if (v.includes('line.me')) return v.startsWith('http') ? v : `https://${v}`
  if (v.startsWith('@')) return `https://line.me/R/ti/p/${v}`
  return `https://line.me/ti/p/~${v}`
}

export default function ListingDetail() {
  const { id } = useParams()
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [msgBody, setMsgBody] = useState('')
  const [msgState, setMsgState] = useState('') // '' | 'sending' | 'sent' | 'error'
  const [copied, setCopied] = useState(false)
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
    createBaseLayer(lang).addTo(map)
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
  const expired = listing.status === 'approved' && isExpired(listing)
  const isOwner = Boolean(user && user.id === listing.owner_id)
  // Share bar (owner's feature, 2026-10-18): direct link to this post.
  const shareUrl = `${window.location.origin}/listing/${listing.id}`
  const shareEnc = encodeURIComponent(shareUrl)
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="detail">
      <Link to="/" className="back-link">{t('back_to_map')}</Link>
      {listing.status === 'pending' && (
        <div className="notice-banner">{t('detail_pending_notice')}</div>
      )}
      {listing.status === 'rejected' && (
        <div className="notice-banner is-rejected">{t('detail_rejected_notice')}</div>
      )}
      {listing.status === 'rejected' && listing.rejection_reason && (
        <div className="admin-note"><strong>{t('admin_note')}:</strong> {listing.rejection_reason}</div>
      )}
      {expired && (
        <div className="notice-banner is-rejected">
          ⛔ {t('expired_banner')}{' '}
          {isOwner && <Link to="/my-listings" className="btn btn-primary btn-sm">{t('renew')}</Link>}
        </div>
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
          <div className="detail-price">{formatPrice(listing, t)}</div>
          <div className="detail-facts">
            <div><span>{t('fact_type')}</span><strong>{typeLabel(listing.property_type)}</strong></div>
            {listing.bedrooms > 0 && <div><span>{t('fact_bedrooms')}</span><strong>{listing.bedrooms}</strong></div>}
            {listing.bathrooms > 0 && <div><span>{t('fact_bathrooms')}</span><strong>{listing.bathrooms}</strong></div>}
            {listing.area_sqm > 0 && <div><span>{t('fact_area')}</span><strong>{listing.area_sqm} {t('sqm')}</strong></div>}
            <div><span>{t('fact_province')}</span><strong>{provinceLabel(listing.province, lang)}</strong></div>
            <div><span>{t('fact_posted')}</span><strong>{formatDate(listing.created_at, lang)}</strong></div>
          </div>
          {listing.address && <p className="detail-address">📍 {listing.address}</p>}
          <div className="share-box">
            <div className="share-label">🔗 {t('share_label')}</div>
            <div className="share-btns">
              <a
                className="share-btn fb"
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareEnc}`}
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
              <a className="share-btn msgr" href={`fb-messenger://share?link=${shareEnc}`}>
                Messenger
              </a>
              <a
                className="share-btn line"
                href={`https://social-plugins.line.me/lineit/share?url=${shareEnc}`}
                target="_blank"
                rel="noreferrer"
              >
                LINE
              </a>
              {canNativeShare && (
                <button
                  type="button"
                  className="share-btn more"
                  onClick={() => navigator.share({ title: listing.title, url: shareUrl }).catch(() => {})}
                >
                  {t('share_more')}
                </button>
              )}
            </div>
            <div className="copy-bar">
              <input
                className="input"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                aria-label={t('share_label')}
              />
              <button type="button" className="btn btn-primary" onClick={copyLink}>
                {copied ? t('copied') : t('copy_link')}
              </button>
            </div>
          </div>
          <div className="seller-card">
            <h3>{t('contact_seller')}</h3>
            <p className="seller-name">{seller.display_name || t('seller_fallback')}</p>
            {seller.phone && (
              <a className="btn btn-primary btn-block" href={`tel:${seller.phone}`}>📞 {seller.phone}</a>
            )}
            {seller.line_id && (
              <a className="btn btn-line btn-block" href={lineUrl(seller.line_id)} target="_blank" rel="noreferrer">💬 {t('chat_line')}: {seller.line_id}</a>
            )}
            {user && user.id !== listing.owner_id && (
              <div className="msg-form">
                {msgState === 'sent' ? (
                  <p className="msg-ok">✓ {t('msg_sent_ok')}</p>
                ) : (
                  <>
                    <textarea
                      className="input"
                      rows={3}
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      placeholder={t('msg_placeholder')}
                    />
                    {msgState === 'error' && <p className="error-text">{t('msg_error')}</p>}
                    <button
                      className="btn btn-primary btn-block"
                      disabled={msgState === 'sending' || !msgBody.trim()}
                      onClick={async () => {
                        if (!msgBody.trim()) return
                        setMsgState('sending')
                        const { error } = await sendMessage({
                          senderId: user.id,
                          recipientId: listing.owner_id,
                          listingId: listing.id,
                          body: msgBody.trim(),
                        })
                        if (error) {
                          setMsgState('error')
                        } else {
                          setMsgState('sent')
                          setMsgBody('')
                        }
                      }}
                    >
                      {msgState === 'sending' ? t('msg_sending') : t('msg_send')}
                    </button>
                  </>
                )}
              </div>
            )}
            {!user && (
              <Link to="/login" className="btn btn-ghost btn-block">
                {t('msg_login_prompt')}
              </Link>
            )}
          </div>
          <ListingChat listing={listing} />
          <div className="scam-box">⚠️ {t('scam_warn_full')}</div>
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
