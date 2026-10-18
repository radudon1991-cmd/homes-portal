import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'
import { formatDate } from '../lib/format'
import { fetchInbox, fetchOutbox, markRead, sendMessage } from '../lib/messages'

// Inbox (received) + Outbox (sent) for listing enquiries.
// Sellers and buyers talk here; replies stay attached to the listing.
export default function Inbox() {
  const { user } = useAuth()
  const { t, lang } = useLang()
  const [tab, setTab] = useState('inbox')
  const [inbox, setInbox] = useState([])
  const [outbox, setOutbox] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const [inc, out] = await Promise.all([fetchInbox(user.id), fetchOutbox(user.id)])
    setInbox(inc.data)
    setOutbox(out.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const unread = inbox.filter((m) => !m.is_read).length

  const doMarkRead = async (m) => {
    await markRead(m.id)
    setInbox((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: true } : x)))
  }

  const doReply = async (m) => {
    if (!replyBody.trim()) return
    setBusy(true)
    await sendMessage({
      senderId: user.id,
      recipientId: m.sender_id,
      listingId: m.listing_id,
      body: replyBody.trim(),
    })
    setBusy(false)
    setReplyBody('')
    setReplyTo(null)
    load()
  }

  const renderMessage = (m, isInbox) => (
    <div key={m.id} className={`msg-card${isInbox && !m.is_read ? ' unread' : ''}`}>
      <div className="msg-head">
        <span className="msg-party">
          <strong>{isInbox ? t('msg_from') : t('msg_to')}:</strong>{' '}
          {m.party?.display_name || m.party?.email || '—'}
        </span>
        {isInbox && !m.is_read && <span className="msg-new">{t('msg_new')}</span>}
        <span className="msg-date">{formatDate(m.created_at, lang)}</span>
      </div>
      {m.listing && (
        <Link to={`/listing/${m.listing.id}`} className="msg-listing">
          🏠 {m.listing.title}
        </Link>
      )}
      <p className="msg-body">{m.body}</p>
      {isInbox && (
        <div className="msg-actions">
          {!m.is_read && (
            <button className="btn btn-ghost btn-sm" onClick={() => doMarkRead(m)}>
              {t('msg_mark_read')}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setReplyTo(replyTo === m.id ? null : m.id)
              setReplyBody('')
            }}
          >
            {t('msg_reply')}
          </button>
        </div>
      )}
      {isInbox && replyTo === m.id && (
        <div className="msg-reply">
          <textarea
            className="input"
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={t('msg_placeholder')}
          />
          <div className="form-actions">
            <button
              className="btn btn-primary btn-sm"
              disabled={busy || !replyBody.trim()}
              onClick={() => doReply(m)}
            >
              {t('msg_send')}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (loading) return <div className="page-center">{t('loading')}</div>

  return (
    <div className="dashboard">
      <div className="dash-head">
        <h1>{t('inbox_title')}</h1>
      </div>
      <div className="inbox-tabs">
        <button
          className={tab === 'inbox' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('inbox')}
        >
          {t('tab_inbox')}
          {unread > 0 && <span className="nav-badge">{unread}</span>}
        </button>
        <button
          className={tab === 'outbox' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('outbox')}
        >
          {t('tab_outbox')}
        </button>
      </div>
      {tab === 'inbox' ? (
        inbox.length === 0 ? (
          <div className="empty-state">
            <p>{t('inbox_empty')}</p>
          </div>
        ) : (
          <div className="msg-list">{inbox.map((m) => renderMessage(m, true))}</div>
        )
      ) : outbox.length === 0 ? (
        <div className="empty-state">
          <p>{t('outbox_empty')}</p>
        </div>
      ) : (
        <div className="msg-list">{outbox.map((m) => renderMessage(m, false))}</div>
      )}
    </div>
  )
}
