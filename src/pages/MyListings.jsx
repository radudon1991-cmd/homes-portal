import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import { useLang } from '../lib/i18n'
import { fetchMyListings, deleteListing, renewListing, isExpired, daysLeft } from '../lib/listings'
import { formatBaht, formatDate, formatPrice, provinceLabel } from '../lib/format'

const STATUS_CLASS = { pending: 'is-pending', approved: 'is-approved', rejected: 'is-rejected' }
const STATUS_KEY = { pending: 'status_pending', approved: 'status_approved', rejected: 'status_rejected' }

export default function MyListings() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { t, lang } = useLang()
  const location = useLocation()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPendingNotice, setShowPendingNotice] = useState(Boolean(location.state?.pendingNotice))

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
    if (!window.confirm(t('delete_confirm', { title }))) return
    const { error } = await deleteListing(id)
    if (error) setError(error.message)
    else setListings((ls) => ls.filter((l) => l.id !== id))
  }

  const [renewingId, setRenewingId] = useState('')
  const renew = async (listing) => {
    setRenewingId(listing.id)
    const { data, error } = await renewListing(listing)
    if (error) setError(error.message)
    else if (data) setListings((ls) => ls.map((l) => (l.id === data.id ? { ...l, ...data } : l)))
    setRenewingId('')
  }

  if (loading) return <div className="page-center">{t('loading')}</div>

  return (
    <div className="dashboard">
      <div className="dash-head">
        <h1>{t('my_listings')}</h1>
        <Link to="/post" className="btn btn-primary">{t('post_new')}</Link>
      </div>
      <div className="credit-strip">
        <span>💰 {t('credit_balance')}: <strong>฿{profile?.credit_baht ?? 0}</strong></span>
        <span className="credit-hint">{t('credit_hint')}</span>
        <Link to="/contact" className="btn btn-ghost btn-sm">{t('buy_credit')}</Link>
      </div>
      {profile?.is_banned && (
        <div className="trust-warning">⚠ {t('banned_msg', { reason: profile.ban_reason || '—' })}</div>
      )}
      {showPendingNotice && (
        <div className="notice-banner">
          {t('pending_notice')}{' '}
          <button type="button" className="notice-dismiss" onClick={() => setShowPendingNotice(false)}>✕</button>
        </div>
      )}
      {error && <div className="form-error">{error}</div>}
      {listings.length === 0 ? (
        <div className="empty-state">
          <p>{t('none_yet')}</p>
          <Link to="/post" className="btn btn-primary">{t('post_first')}</Link>
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
                <div className="dash-title">
                  {l.title}{' '}
                  <span className={`status-badge ${STATUS_CLASS[l.status] ?? 'is-pending'}`}>
                    {t(STATUS_KEY[l.status] ?? 'status_pending')}
                  </span>
                </div>
                <div className="dash-meta">
                  {formatPrice(l, t)} · {l.listing_type === 'rent' ? t('for_rent') : t('for_sale')} · {provinceLabel(l.province, lang)} · {formatDate(l.created_at, lang)}
                </div>
                {l.status === 'approved' && l.expires_at && (
                  isExpired(l) ? (
                    <div className="expiry-line is-expired">⛔ {t('expired_badge')}</div>
                  ) : (
                    <div className={`expiry-line${daysLeft(l) <= 7 ? ' is-soon' : ''}`}>
                      🟢 {t('live_until', { date: formatDate(l.expires_at, lang) })} · {t('days_left', { n: daysLeft(l) })}
                      {l.auto_renew && <> · 🔄 {t('auto_renew_tag')}</>}
                    </div>
                  )
                )}
                {l.status === 'rejected' && l.rejection_reason && (
                  <div className="admin-note"><strong>{t('admin_note')}:</strong> {l.rejection_reason}</div>
                )}
              </div>
              <div className="dash-actions">
                {l.status === 'approved' && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={renewingId === l.id}
                    onClick={() => renew(l)}
                  >
                    {t('renew')}
                  </button>
                )}
                <Link to={`/listing/${l.id}`} className="btn btn-ghost btn-sm">{t('view')}</Link>
                <Link to={`/edit/${l.id}`} className="btn btn-ghost btn-sm">{t('edit')}</Link>
                <button className="btn btn-danger btn-sm" onClick={() => remove(l.id, l.title)}>{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
