import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../lib/useProfile'
import { useLang } from '../lib/i18n'
import { formatDate } from '../lib/format'

// Moderation dashboard for site admins: review reported listings,
// ban dishonest sellers (removes their listings), unban on appeal.
// NOTHING here is automatic — every ban is a human decision.
export default function Admin() {
  const { profile, loading: pLoading } = useProfile()
  const { t, lang } = useLang()
  const [reports, setReports] = useState([])
  const [listings, setListings] = useState({})
  const [people, setPeople] = useState({})
  const [banned, setBanned] = useState([])
  const [pendingListings, setPendingListings] = useState([])
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [members, setMembers] = useState([])
  const [creditAmt, setCreditAmt] = useState({})
  const [creditSearch, setCreditSearch] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [announceNoReply, setAnnounceNoReply] = useState(false)
  const [announceResult, setAnnounceResult] = useState('')
  const [nameRequests, setNameRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: reps } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    const all = reps ?? []

    const listingIds = [...new Set(all.map((r) => r.listing_id))]
    const personIds = [...new Set(all.flatMap((r) => [r.reporter_id]))]

    let listingMap = {}
    if (listingIds.length) {
      const { data: ls } = await supabase
        .from('listings')
        .select('id, title, owner_id')
        .in('id', listingIds)
      ;(ls ?? []).forEach((l) => {
        listingMap[l.id] = l
        personIds.push(l.owner_id)
      })
    }

    // Listings waiting for approval (new posts + seller edits).
    const { data: waiting } = await supabase
      .from('listings')
      .select('id, title, price_thb, province, listing_type, property_type, owner_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    const waitingList = waiting ?? []
    waitingList.forEach((l) => personIds.push(l.owner_id))

    let peopleMap = {}
    const uniqPersonIds = [...new Set(personIds)]
    if (uniqPersonIds.length) {
      const { data: ps } = await supabase
        .from('profiles')
        .select('id, email, display_name, is_banned')
        .in('id', uniqPersonIds)
      ;(ps ?? []).forEach((p) => {
        peopleMap[p.id] = p
      })
    }

    const { data: bannedUsers } = await supabase
      .from('profiles')
      .select('id, email, display_name, ban_reason, banned_at')
      .eq('is_banned', true)
      .order('banned_at', { ascending: false })

    // All members with their auto-renew credit balance (migration12).
    const { data: allMembers } = await supabase
      .from('profiles')
      .select('id, email, display_name, credit_baht')
      .order('display_name', { ascending: true })

    // Display-name change requests waiting for approval (migration17).
    const { data: nameReqs } = await supabase
      .from('profiles')
      .select('id, email, display_name, pending_display_name, name_requested_at')
      .not('pending_display_name', 'is', null)
      .order('name_requested_at', { ascending: true })

    setNameRequests(nameReqs ?? [])
    setReports(all)
    setListings(listingMap)
    setPeople(peopleMap)
    setBanned(bannedUsers ?? [])
    setPendingListings(waitingList)
    setMembers(allMembers ?? [])
    setLoading(false)
  }

  // Announcement broadcast (migration14): one click sends the
  // message to every member's Inbox at once.
  const sendAnnouncement = async () => {
    const body = announceBody.trim()
    if (!body) return
    if (!window.confirm(t('announce_confirm', { n: members.length }))) return
    setBusy('announce')
    const { data, error } = await supabase.rpc('admin_broadcast', {
      body,
      p_no_reply: announceNoReply,
    })
    if (error) {
      setAnnounceResult(error.message)
    } else {
      setAnnounceResult(t('announce_sent', { n: data ?? 0 }))
      setAnnounceBody('')
    }
    setBusy('')
  }

  // Add credit after a member has paid the admin (฿1 per post per
  // month for auto-renew). Goes through the admin-only RPC.
  const addCredit = async (member) => {
    const amount = parseInt(creditAmt[member.id], 10)
    if (!amount) return
    setBusy('credit-' + member.id)
    const { error } = await supabase.rpc('admin_add_credit', {
      target_id: member.id,
      amount,
    })
    if (!error) {
      setMembers((ms) =>
        ms.map((m) =>
          m.id === member.id
            ? { ...m, credit_baht: Math.max(0, (m.credit_baht ?? 0) + amount) }
            : m
        )
      )
      setCreditAmt((c) => ({ ...c, [member.id]: '' }))
    }
    setBusy('')
  }

  // Approve or reject a display-name change request (migration17 RPC;
  // the member is notified in their Inbox either way).
  const reviewName = async (req, approve) => {
    setBusy('name-' + req.id)
    const { error } = await supabase.rpc('admin_review_name_request', {
      target: req.id,
      approve,
    })
    setBusy('')
    if (!error) load()
  }

  useEffect(() => {
    if (profile?.is_admin) load()
  }, [profile])

  if (pLoading) return <div className="page-center">{t('loading')}</div>
  if (!profile?.is_admin) {
    return (
      <div className="page-center">
        <p>{t('admin_not_admin')}</p>
        <Link to="/" className="btn btn-primary">
          {t('back_to_search')}
        </Link>
      </div>
    )
  }
  if (loading) return <div className="page-center">{t('loading')}</div>

  const pending = reports.filter((r) => r.status === 'pending')

  // Member credits are search-only (owner's rule, 2026-10-18): no
  // names are listed until the admin searches, and only matches show.
  const creditQuery = creditSearch.trim().toLowerCase()
  const matchedMembers = creditQuery
    ? members.filter(
        (p) =>
          (p.display_name || '').toLowerCase().includes(creditQuery) ||
          (p.email || '').toLowerCase().includes(creditQuery)
      )
    : []

  // Track record of a reporter: how many of their reports were upheld vs dismissed.
  const trackRecord = (reporterId) => {
    const mine = reports.filter((r) => r.reporter_id === reporterId)
    const upheld = mine.filter((r) => r.status === 'reviewed_actioned').length
    const dismissed = mine.filter((r) => r.status === 'reviewed_dismissed').length
    return { total: mine.length, upheld, dismissed }
  }

  const dismiss = async (report) => {
    setBusy(report.id)
    await supabase.from('reports').update({ status: 'reviewed_dismissed' }).eq('id', report.id)
    setBusy('')
    load()
  }

  const banSeller = async (report) => {
    const listing = listings[report.listing_id]
    if (!listing) return
    const seller = people[listing.owner_id]
    if (!window.confirm(t('admin_confirm_ban'))) return
    setBusy(report.id)
    const reason = `Report upheld: ${report.reason} — ${report.details}`.slice(0, 300)
    // 1. Ban the seller.
    await supabase
      .from('profiles')
      .update({ is_banned: true, banned_at: new Date().toISOString(), ban_reason: reason })
      .eq('id', listing.owner_id)
    // 2. Remove all their listings from public view.
    await supabase.from('listings').update({ is_active: false }).eq('owner_id', listing.owner_id)
    // 3. Mark every pending report against this seller's listings as actioned.
    const sellerListingIds = Object.values(listings)
      .filter((l) => l.owner_id === listing.owner_id)
      .map((l) => l.id)
    if (sellerListingIds.length) {
      await supabase
        .from('reports')
        .update({ status: 'reviewed_actioned' })
        .in('listing_id', sellerListingIds)
        .eq('status', 'pending')
    }
    setBusy('')
    load()
  }

  const unban = async (person) => {
    setBusy(person.id)
    await supabase
      .from('profiles')
      .update({ is_banned: false, banned_at: null, ban_reason: null })
      .eq('id', person.id)
    // Restore their listings to public view.
    await supabase.from('listings').update({ is_active: true }).eq('owner_id', person.id)
    setBusy('')
    load()
  }

  const approveListing = async (listing) => {
    setBusy('approve-' + listing.id)
    await supabase
      .from('listings')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', listing.id)
    setBusy('')
    load()
  }

  const confirmReject = async (listing) => {
    setBusy('reject-' + listing.id)
    await supabase
      .from('listings')
      .update({ status: 'rejected', rejection_reason: rejectNote.trim() || null })
      .eq('id', listing.id)
    setBusy('')
    setRejectingId(null)
    setRejectNote('')
    load()
  }

  return (
    <div className="dashboard">
      <div className="dash-head">
        <h1>{t('admin_title')}</h1>
        <Link to="/admin/members" className="btn btn-primary">👥 {t('members_title')}</Link>
      </div>

      <div className="announce-box">
        <h2>📣 {t('announce_title')}</h2>
        <p className="hint">{t('announce_hint')}</p>
        <textarea
          className="input"
          rows={3}
          maxLength={2000}
          value={announceBody}
          onChange={(e) => setAnnounceBody(e.target.value)}
          placeholder={t('announce_ph')}
        />
        <label className="check-row announce-noreply">
          <input
            type="checkbox"
            checked={announceNoReply}
            onChange={(e) => setAnnounceNoReply(e.target.checked)}
          />
          <span>🔕 {t('announce_no_reply')}</span>
        </label>
        <div className="announce-actions">
          <button
            className="btn btn-primary"
            disabled={busy === 'announce' || !announceBody.trim()}
            onClick={sendAnnouncement}
          >
            {t('announce_send')}
          </button>
          {announceResult && <span className="hint ok">{announceResult}</span>}
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>
        {t('name_requests_title')} ({nameRequests.length})
      </h2>
      {nameRequests.length === 0 ? (
        <div className="empty-state">
          <p>{t('name_requests_none')}</p>
        </div>
      ) : (
        <div className="dash-list">
          {nameRequests.map((p) => (
            <div key={p.id} className="dash-row">
              <div className="dash-info">
                <div className="dash-title">
                  {p.display_name || '—'} → <strong>{p.pending_display_name}</strong>
                </div>
                <div className="dash-meta">
                  {p.email} · {formatDate(p.name_requested_at, lang)}
                </div>
              </div>
              <div className="dash-actions">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy === 'name-' + p.id}
                  onClick={() => reviewName(p, true)}
                >
                  {t('approve')}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={busy === 'name-' + p.id}
                  onClick={() => reviewName(p, false)}
                >
                  {t('reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2>
        {t('approval_title')} ({pendingListings.length})
      </h2>
      {pendingListings.length === 0 ? (
        <div className="empty-state">
          <p>{t('approval_none')}</p>
        </div>
      ) : (
        <div className="dash-list">
          {pendingListings.map((l) => {
            const seller = people[l.owner_id]
            return (
              <Fragment key={l.id}>
              <div className="dash-row">
                <div className="dash-info">
                  <div className="dash-title">
                    <Link to={`/listing/${l.id}`}>{l.title}</Link>
                  </div>
                  <div className="dash-meta">
                    {l.property_type} · {l.listing_type} · {l.province} ·{' '}
                    {formatDate(l.created_at, lang)}
                  </div>
                  <div className="dash-meta">
                    <strong>{t('admin_seller')}:</strong> {seller?.display_name || '—'} (
                    {seller?.email || '—'})
                  </div>
                </div>
                <div className="dash-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busy === 'approve-' + l.id}
                    onClick={() => approveListing(l)}
                  >
                    {t('approve')}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busy === 'reject-' + l.id}
                    onClick={() => { setRejectingId(l.id); setRejectNote('') }}
                  >
                    {t('reject')}
                  </button>
                </div>
              </div>
              {rejectingId === l.id && (
                <div className="reject-form">
                  <label>{t('rejection_reason_label')}
                    <textarea
                      className="input"
                      rows={3}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder={t('reject_note_ph')}
                    />
                  </label>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setRejectingId(null)}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={busy === 'reject-' + l.id}
                      onClick={() => confirmReject(l)}
                    >
                      {t('confirm_reject')}
                    </button>
                  </div>
                </div>
              )}
              </Fragment>
            )
          })}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>
        {t('admin_pending')} ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin_none')}</p>
        </div>
      ) : (
        <div className="dash-list">
          {pending.map((r) => {
            const listing = listings[r.listing_id]
            const seller = listing ? people[listing.owner_id] : null
            const reporter = people[r.reporter_id]
            const tr = trackRecord(r.reporter_id)
            return (
              <div key={r.id} className="admin-report">
                <div className="dash-info">
                  <div className="dash-title">
                    {t('admin_listing')}:{' '}
                    {listing ? (
                      <Link to={`/listing/${listing.id}`}>{listing.title}</Link>
                    ) : (
                      <span className="hint">({t('listing_not_found')})</span>
                    )}
                  </div>
                  <div className="dash-meta">
                    <strong>{t('admin_reason')}:</strong> {t('reason_' + r.reason)}
                  </div>
                  {r.details && (
                    <div className="dash-meta">
                      <strong>{t('admin_details')}:</strong> {r.details}
                    </div>
                  )}
                  <div className="dash-meta">
                    <strong>{t('admin_seller')}:</strong> {seller?.display_name || '—'} (
                    {seller?.email || '—'})
                    {seller?.is_banned && <span className="error-text"> [{t('banned_tag')}]</span>}
                  </div>
                  <div className="dash-meta">
                    <strong>{t('admin_reporter')}:</strong> {reporter?.email || '—'} ·{' '}
                    {t('admin_credibility', {
                      total: tr.total,
                      upheld: tr.upheld,
                      dismissed: tr.dismissed,
                    })}
                  </div>
                  <div className="dash-meta">
                    {formatDate(r.created_at, lang)}
                  </div>
                </div>
                <div className="dash-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={busy === r.id}
                    onClick={() => dismiss(r)}
                  >
                    {t('admin_dismiss')}
                  </button>
                  {seller && !seller.is_banned && (
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={busy === r.id}
                      onClick={() => banSeller(r)}
                    >
                      {t('admin_ban')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>
        {t('admin_banned_users')} ({banned.length})
      </h2>
      {banned.length === 0 ? (
        <div className="empty-state">
          <p>{t('admin_no_banned')}</p>
        </div>
      ) : (
        <div className="dash-list">
          {banned.map((p) => (
            <div key={p.id} className="dash-row">
              <div className="dash-info">
                <div className="dash-title">
                  {p.display_name || p.email} ({p.email})
                </div>
                <div className="dash-meta">
                  {p.ban_reason} · {formatDate(p.banned_at, lang)}
                </div>
              </div>
              <div className="dash-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={busy === p.id}
                  onClick={() => unban(p)}
                >
                  {t('admin_unban')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>
        {t('admin_credits')} ({members.length})
      </h2>
      <p className="hint">{t('admin_credits_hint')}</p>
      <input
        className="input"
        style={{ maxWidth: 380, marginBottom: '0.8rem' }}
        placeholder={t('admin_credits_search_ph')}
        value={creditSearch}
        onChange={(e) => setCreditSearch(e.target.value)}
      />
      {creditQuery && matchedMembers.length === 0 && (
        <div className="empty-state">
          <p>{t('admin_no_match')}</p>
        </div>
      )}
      {matchedMembers.length > 0 && (
        <div className="dash-list">
          {matchedMembers.map((p) => (
            <div key={p.id} className="dash-row">
              <div className="dash-info">
                <div className="dash-title">
                  {p.display_name || p.email} ({p.email})
                </div>
                <div className="dash-meta">
                  {t('credit_balance')}: ฿{p.credit_baht ?? 0}
                </div>
              </div>
              <div className="dash-actions">
                <input
                  className="input input-credit"
                  type="number"
                  placeholder="฿"
                  value={creditAmt[p.id] ?? ''}
                  onChange={(e) => setCreditAmt((c) => ({ ...c, [p.id]: e.target.value }))}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy === 'credit-' + p.id || !creditAmt[p.id]}
                  onClick={() => addCredit(p)}
                >
                  {t('admin_add_credit')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
