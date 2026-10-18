import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../lib/useProfile'
import { useLang } from '../lib/i18n'
import { formatDate } from '../lib/format'
import { isExpired } from '../lib/listings'

// Admin member inspection (owner's request, 2026-10-18): every member
// with last activity, post counts and credit; open a member to see
// all their listings; ban/unban; delete the account. 100 per page,
// 2-column cards on desktop, 1 column on phones.
const PAGE_SIZE = 100

export default function AdminMembers() {
  const { profile, loading: pLoading } = useProfile()
  const { t, lang } = useLang()
  const [members, setMembers] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('active')
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: ps, error: pErr } = await supabase
      .from('profiles')
      .select('id, display_name, email, phone, line_id, is_admin, is_banned, ban_reason, created_at, last_active_at, credit_baht')
      .order('created_at', { ascending: true })
    if (pErr) {
      setError(pErr.message)
      setLoading(false)
      return
    }
    const { data: ls } = await supabase
      .from('listings')
      .select('id, owner_id, status, is_active, expires_at, auto_renew')
    const map = {}
    ;(ls ?? []).forEach((l) => {
      const c = (map[l.owner_id] ??= { total: 0, live: 0, pending: 0, expired: 0, autoRenew: 0 })
      c.total += 1
      if (l.status === 'pending') c.pending += 1
      if (l.status === 'approved' && l.is_active) {
        if (isExpired(l)) c.expired += 1
        else c.live += 1
      }
      if (l.auto_renew) c.autoRenew += 1
    })
    setCounts(map)
    setMembers(ps ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.is_admin) load()
  }, [profile])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = members
    if (q) {
      list = list.filter(
        (p) =>
          (p.display_name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q)
      )
    }
    const by = {
      active: (a, b) => (b.last_active_at || '').localeCompare(a.last_active_at || ''),
      newest: (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
      posts: (a, b) => (counts[b.id]?.total ?? 0) - (counts[a.id]?.total ?? 0),
      credit: (a, b) => (b.credit_baht ?? 0) - (a.credit_baht ?? 0),
    }[sort]
    return [...list].sort(by)
  }, [members, counts, query, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const activeThisMonth = members.filter(
    (p) => p.last_active_at && Date.now() - new Date(p.last_active_at).getTime() < 30 * 86400000
  ).length
  const bannedCount = members.filter((p) => p.is_banned).length
  const totalPosts = Object.values(counts).reduce((s, c) => s + c.total, 0)

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

  const ban = async (member) => {
    if (!window.confirm(t('admin_confirm_ban'))) return
    const reason = window.prompt(t('ban_reason_prompt'), '') ?? ''
    setBusy(member.id)
    await supabase
      .from('profiles')
      .update({ is_banned: true, banned_at: new Date().toISOString(), ban_reason: reason.slice(0, 300) || null })
      .eq('id', member.id)
    await supabase.from('listings').update({ is_active: false }).eq('owner_id', member.id)
    setBusy('')
    load()
  }

  const unban = async (member) => {
    setBusy(member.id)
    await supabase
      .from('profiles')
      .update({ is_banned: false, banned_at: null, ban_reason: null })
      .eq('id', member.id)
    await supabase.from('listings').update({ is_active: true }).eq('owner_id', member.id)
    setBusy('')
    load()
  }

  const remove = async (member) => {
    const name = member.display_name || member.email || member.id
    if (!window.confirm(t('delete_user_confirm', { name }))) return
    setBusy(member.id)
    // Photos must go through the Storage API first: Supabase forbids
    // deleting storage rows with SQL (learned 2026-10-18, when the
    // original admin_delete_user hit exactly that wall).
    try {
      const { data: files } = await supabase.storage
        .from('listing-photos')
        .list(member.id)
      const paths = (files ?? [])
        .filter((f) => f.id)
        .map((f) => `${member.id}/${f.name}`)
      if (paths.length) {
        await supabase.storage.from('listing-photos').remove(paths)
      }
    } catch {
      // Photo cleanup is best-effort; account deletion still proceeds.
    }
    const { error } = await supabase.rpc('admin_delete_user', { target_id: member.id })
    if (error) setError(error.message)
    else setMembers((ms) => ms.filter((m) => m.id !== member.id))
    setBusy('')
  }

  return (
    <div className="dashboard">
      <div className="dash-head">
        <h1>👥 {t('members_title')}</h1>
        <Link to="/admin" className="btn btn-ghost">{t('back_moderation')}</Link>
      </div>
      <p className="hint">{t('members_subtitle')}</p>
      {error && <div className="form-error">{error}</div>}
      <div className="credit-strip">
        <span>👥 <strong>{members.length}</strong> {t('members_title')}</span>
        <span>🟢 <strong>{activeThisMonth}</strong> {t('active_30d')}</span>
        <span>📝 <strong>{totalPosts}</strong> {t('stat_posts')}</span>
        <span>🚫 <strong>{bannedCount}</strong> {t('banned_badge')}</span>
      </div>
      <div className="members-tools">
        <input
          className="input"
          placeholder={t('search_members_ph')}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0) }}
        />
        <label className="members-sort">
          {t('sort_label')}
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="active">{t('sort_active')}</option>
            <option value="newest">{t('sort_newest')}</option>
            <option value="posts">{t('sort_posts')}</option>
            <option value="credit">{t('sort_credit')}</option>
          </select>
        </label>
      </div>

      {pageItems.length === 0 ? (
        <div className="empty-state"><p>{t('admin_no_match')}</p></div>
      ) : (
        <div className="members-grid">
          {pageItems.map((p) => {
            const c = counts[p.id] ?? { total: 0, live: 0, pending: 0, expired: 0, autoRenew: 0 }
            return (
              <div key={p.id} className="member-card">
                <div className="member-head">
                  <span className="member-name">{p.display_name || p.email}</span>
                  {p.is_admin && <span className="status-badge is-approved">{t('admin_badge')}</span>}
                  {p.is_banned && <span className="status-badge is-rejected">{t('banned_badge')}</span>}
                </div>
                <div className="dash-meta">{p.email}</div>
                {(p.phone || p.line_id) && (
                  <div className="dash-meta">
                    {p.phone && <>📞 {p.phone} </>}
                    {p.line_id && <>💬 {p.line_id}</>}
                  </div>
                )}
                <div className="dash-meta">
                  {t('joined_label')}: {formatDate(p.created_at, lang)} · {t('last_active_label')}:{' '}
                  {p.last_active_at ? formatDate(p.last_active_at, lang) : t('never_active')}
                </div>
                <div className="member-stats">
                  <span>📝 {c.total} {t('stat_posts')}</span>
                  <span>🟢 {c.live} {t('stat_live')}</span>
                  <span>⏳ {c.pending} {t('status_pending')}</span>
                  <span>⛔ {c.expired} {t('stat_expired')}</span>
                  <span>🔄 {c.autoRenew}</span>
                  <span>💰 ฿{p.credit_baht ?? 0}</span>
                </div>
                <div className="member-actions">
                  <Link to={`/admin/member/${p.id}`} className="btn btn-primary btn-sm">
                    {t('view_listings')}
                  </Link>
                  {!p.is_admin && (
                    <>
                      {p.is_banned ? (
                        <button className="btn btn-ghost btn-sm" disabled={busy === p.id} onClick={() => unban(p)}>
                          {t('admin_unban')}
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" disabled={busy === p.id} onClick={() => ban(p)}>
                          {t('ban_user')}
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" disabled={busy === p.id} onClick={() => remove(p)}>
                        {t('delete_user')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {pages > 1 && (
        <div className="pager">
          <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            {t('prev_page')}
          </button>
          <span>{t('page_of', { n: page + 1, m: pages })}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
            {t('next_page')}
          </button>
        </div>
      )}
    </div>
  )
}
