import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../lib/useProfile'
import { useLang } from '../lib/i18n'
import { formatDate, formatPrice, provinceLabel } from '../lib/format'
import { isExpired, daysLeft } from '../lib/listings'

// Admin drill-down (2026-10-18): every listing belonging to one
// member, with status and expiry, reached from the Members page.
const STATUS_CLASS = { pending: 'is-pending', approved: 'is-approved', rejected: 'is-rejected' }
const STATUS_KEY = { pending: 'status_pending', approved: 'status_approved', rejected: 'status_rejected' }

export default function AdminMemberListings() {
  const { id } = useParams()
  const { profile, loading: pLoading } = useProfile()
  const { t, lang } = useLang()
  const [member, setMember] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.is_admin) return
    ;(async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, display_name, email, is_banned, created_at, last_active_at, credit_baht')
        .eq('id', id)
        .single()
      const { data: ls } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', id)
        .order('created_at', { ascending: false })
      setMember(p ?? null)
      setListings(ls ?? [])
      setLoading(false)
    })()
  }, [profile, id])

  if (pLoading) return <div className="page-center">{t('loading')}</div>
  if (!profile?.is_admin) {
    return (
      <div className="page-center">
        <p>{t('admin_not_admin')}</p>
        <Link to="/" className="btn btn-primary">{t('back_to_search')}</Link>
      </div>
    )
  }
  if (loading) return <div className="page-center">{t('loading')}</div>

  const name = member?.display_name || member?.email || id

  return (
    <div className="dashboard">
      <div className="dash-head">
        <h1>{t('member_listings_title', { name })}</h1>
        <Link to="/admin/members" className="btn btn-ghost">{t('back_members')}</Link>
      </div>
      {member && (
        <div className="credit-strip">
          <span>✉️ {member.email}</span>
          <span>{t('joined_label')}: {formatDate(member.created_at, lang)}</span>
          <span>{t('last_active_label')}: {member.last_active_at ? formatDate(member.last_active_at, lang) : t('never_active')}</span>
          <span>💰 {t('credit_balance')}: ฿{member.credit_baht ?? 0}</span>
          {member.is_banned && <span className="status-badge is-rejected">{t('banned_badge')}</span>}
        </div>
      )}
      {listings.length === 0 ? (
        <div className="empty-state"><p>{t('member_no_listings')}</p></div>
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
                  {!l.is_active && <span className="status-badge is-rejected">{t('banned_badge')}</span>}
                </div>
                <div className="dash-meta">
                  {formatPrice(l, t)} · {l.listing_type === 'rent' ? t('for_rent') : t('for_sale')} · {provinceLabel(l.province, lang)} · {formatDate(l.created_at, lang)}
                </div>
                {l.status === 'approved' && l.expires_at && (
                  isExpired(l) ? (
                    <div className="expiry-line is-expired">⛔ {t('expired_badge')}</div>
                  ) : (
                    <div className="expiry-line">
                      🟢 {t('live_until', { date: formatDate(l.expires_at, lang) })} · {t('days_left', { n: daysLeft(l) })}
                      {l.auto_renew && <> · 🔄 {t('auto_renew_tag')}</>}
                    </div>
                  )
                )}
              </div>
              <div className="dash-actions">
                <Link to={`/listing/${l.id}`} className="btn btn-ghost btn-sm">{t('view')}</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
