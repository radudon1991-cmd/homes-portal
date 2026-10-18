import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import { useLang } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import { fetchInbox, fetchOutbox, markRead, sendMessage } from '../lib/messages'
import {
  fetchOwnerConversations,
  fetchConversationMessages,
  sendListingMessage,
  subscribeLiveMessages,
} from '../lib/liveChat'
import { checkChatMessage } from '../lib/chatFilter'

// Inbox (received) + Outbox (sent) for listing enquiries, plus the
// Live tab: real-time guest chats started from the owner's listings.
export default function Inbox() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { t, lang } = useLang()
  const [tab, setTab] = useState('inbox')
  const [inbox, setInbox] = useState([])
  const [outbox, setOutbox] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [busy, setBusy] = useState(false)

  // Live chats (owner side)
  const [liveConvs, setLiveConvs] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [liveMsgs, setLiveMsgs] = useState([])
  const [liveBody, setLiveBody] = useState('')
  const [liveNotice, setLiveNotice] = useState('')

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

  /* ---------------- live chats ---------------- */

  const loadLive = async () => {
    if (!user) return
    const { data } = await fetchOwnerConversations(user.id)
    setLiveConvs(data)
  }

  useEffect(() => {
    if (tab === 'live') loadLive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    if (!activeConv) return
    let alive = true
    fetchConversationMessages(activeConv.id).then(({ data }) => {
      if (alive) setLiveMsgs(data)
    })
    const ch = subscribeLiveMessages(`conversation_id=eq.${activeConv.id}`, (m) => {
      setLiveMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
    })
    return () => {
      alive = false
      supabase.removeChannel(ch)
    }
  }, [activeConv])

  const sendLive = async () => {
    const check = checkChatMessage(liveBody)
    if (!check.ok) {
      setLiveNotice(check.reason === 'links' ? t('chat_links') : t('chat_blocked'))
      return
    }
    setLiveNotice('')
    const text = liveBody.trim()
    setLiveBody('')
    await sendListingMessage({
      conversationId: activeConv.id,
      name: profile?.display_name || t('seller_badge'),
      key: `user-${user.id}`,
      isOwner: true,
      body: text,
    })
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
        <button
          className={tab === 'live' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('live')}
        >
          {t('tab_live')}
        </button>
      </div>

      {tab === 'inbox' &&
        (inbox.length === 0 ? (
          <div className="empty-state">
            <p>{t('inbox_empty')}</p>
          </div>
        ) : (
          <div className="msg-list">{inbox.map((m) => renderMessage(m, true))}</div>
        ))}

      {tab === 'outbox' &&
        (outbox.length === 0 ? (
          <div className="empty-state">
            <p>{t('outbox_empty')}</p>
          </div>
        ) : (
          <div className="msg-list">{outbox.map((m) => renderMessage(m, false))}</div>
        ))}

      {tab === 'live' &&
        (!activeConv ? (
          liveConvs.length === 0 ? (
            <div className="empty-state">
              <p>{t('live_empty')}</p>
            </div>
          ) : (
            <div className="msg-list">
              {liveConvs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="msg-card live-conv"
                  onClick={() => setActiveConv(c)}
                >
                  <div className="msg-head">
                    <span className="msg-party">
                      <strong>{c.guest_name}</strong>
                    </span>
                    <span className="msg-date">{formatDate(c.last_message_at, lang)}</span>
                  </div>
                  {c.listings && (
                    <span className="msg-listing">🏠 {c.listings.title}</span>
                  )}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="live-thread">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setActiveConv(null)}
            >
              ← {t('tab_live')}
            </button>
            <h2 className="live-thread-title">
              {activeConv.guest_name}
              {activeConv.listings && (
                <>
                  {' · '}
                  <Link to={`/listing/${activeConv.listings.id}`}>
                    {activeConv.listings.title}
                  </Link>
                </>
              )}
            </h2>
            <div className="chat-list thread">
              {liveMsgs.map((m) => (
                <div key={m.id} className={`chat-msg${m.is_owner ? ' mine' : ''}`}>
                  <div className="chat-meta">
                    <span className="chat-sender">{m.sender_name}</span>
                    <span className="chat-time">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="chat-body">{m.body}</div>
                </div>
              ))}
              {liveMsgs.length === 0 && <p className="chat-empty">{t('chat_empty')}</p>}
            </div>
            {liveNotice && <p className="chat-notice">{liveNotice}</p>}
            <div className="chat-input-row">
              <input
                className="input"
                value={liveBody}
                maxLength={500}
                placeholder={t('chat_placeholder')}
                onChange={(e) => setLiveBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendLive()
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={!liveBody.trim()}
                onClick={sendLive}
              >
                {t('chat_send')}
              </button>
            </div>
            <p className="chat-note">{t('chat_clears')}</p>
          </div>
        ))}
    </div>
  )
}
