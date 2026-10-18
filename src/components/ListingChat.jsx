import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import {
  findConversation,
  createConversation,
  fetchConversationMessages,
  sendListingMessage,
  subscribeLiveMessages,
  guestKey,
  guestName,
} from '../lib/liveChat'
import { checkChatMessage } from '../lib/chatFilter'

// Live chat with the seller, right on the listing page (owner's spec,
// 2026-10-17): for visitors who have no LINE and no phone number to
// call — and NO account is needed. Real-time while both sides have
// the chat open; the seller answers from Inbox -> Live chats.
// Ephemeral like the group chat: wiped daily at 02:00 ICT.
export default function ListingChat({ listing }) {
  const { t } = useLang()
  const { user } = useAuth()
  const { profile } = useProfile()
  const [conv, setConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [notice, setNotice] = useState('')
  const [cooling, setCooling] = useState(false)
  const listRef = useRef(null)

  const isOwner = user && user.id === listing.owner_id
  const myKey = user ? `user-${user.id}` : guestKey()
  const myName = user
    ? profile?.display_name || user.email?.split('@')[0] || 'Member'
    : guestName()

  // Resume an existing conversation for this browser, if any.
  useEffect(() => {
    if (isOwner) return
    let alive = true
    findConversation(listing.id, myKey).then((c) => {
      if (alive && c) setConv(c)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id, myKey, isOwner])

  // Load + subscribe once the conversation is known.
  useEffect(() => {
    if (!conv) return
    let alive = true
    fetchConversationMessages(conv.id).then(({ data }) => {
      if (alive) setMessages(data)
    })
    const ch = subscribeLiveMessages(`conversation_id=eq.${conv.id}`, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
    })
    return () => {
      alive = false
      supabase.removeChannel(ch)
    }
  }, [conv])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  if (isOwner) {
    return (
      <div className="listing-chat">
        <h3>💬 {t('live_chat_seller')}</h3>
        <p className="chat-note">{t('your_listing_chat')}</p>
      </div>
    )
  }

  const send = async () => {
    const check = checkChatMessage(body)
    if (!check.ok) {
      setNotice(
        check.reason === 'links'
          ? t('chat_links')
          : check.reason === 'long'
            ? t('chat_too_long')
            : t('chat_blocked')
      )
      return
    }
    setNotice('')
    setCooling(true)
    setTimeout(() => setCooling(false), 1500)
    const text = body.trim()
    setBody('')
    let c = conv
    if (!c) {
      const { data, error } = await createConversation({
        listingId: listing.id,
        ownerId: listing.owner_id,
        key: myKey,
        name: myName,
      })
      if (error || !data) {
        setNotice(t('msg_error'))
        return
      }
      c = data
      setConv(c)
    }
    const { error } = await sendListingMessage({
      conversationId: c.id,
      name: myName,
      key: myKey,
      isOwner: false,
      body: text,
    })
    if (error) setNotice(t('msg_error'))
  }

  return (
    <div className="listing-chat">
      <h3>💬 {t('live_chat_seller')}</h3>
      <p className="chat-note">{t('live_chat_hint')}</p>
      <div className="chat-list listing" ref={listRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-msg${m.sender_key === myKey ? ' mine' : ''}${m.is_owner ? ' from-owner' : ''}`}
          >
            <div className="chat-meta">
              <span className="chat-sender">
                {m.sender_name}
                {m.is_owner ? ` · ${t('seller_badge')}` : ''}
              </span>
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
        {messages.length === 0 && <p className="chat-empty">{t('chat_empty')}</p>}
      </div>
      {notice && <p className="chat-notice">{notice}</p>}
      <div className="chat-input-row">
        <input
          className="input"
          value={body}
          maxLength={500}
          placeholder={t('chat_placeholder')}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !cooling) send()
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={cooling || !body.trim()}
          onClick={send}
        >
          {t('chat_send')}
        </button>
      </div>
      <p className="chat-note">{t('chat_clears')}</p>
    </div>
  )
}
