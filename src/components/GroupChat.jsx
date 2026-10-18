import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import {
  fetchGroupMessages,
  sendGroupMessage,
  subscribeLiveMessages,
  guestKey,
  guestName,
  setGuestName,
} from '../lib/liveChat'
import { checkChatMessage } from '../lib/chatFilter'

// Public group live chat, opened from the home page (owner's spec,
// 2026-10-17): online users chat in real time; text, links and emoji
// only (no uploads anywhere in the UI); a clean-content filter runs
// on every send; the whole room is wiped daily at 02:00 ICT.
export default function GroupChat() {
  const { t } = useLang()
  const { user } = useAuth()
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [notice, setNotice] = useState('')
  const [online, setOnline] = useState(0)
  const [name, setName] = useState('')
  const [cooling, setCooling] = useState(false)
  const listRef = useRef(null)
  const nearBottomRef = useRef(true)

  const myKey = user ? `user-${user.id}` : guestKey()
  const myName = user
    ? profile?.display_name || user.email?.split('@')[0] || 'Member'
    : name || guestName()

  useEffect(() => {
    if (!user) setName(guestName())
  }, [user])

  // Load history + subscribe while the panel is open.
  useEffect(() => {
    if (!open) return
    let alive = true
    fetchGroupMessages().then(({ data }) => {
      if (alive) setMessages(data)
    })
    const ch = subscribeLiveMessages('scope=eq.group', (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
    })
    return () => {
      alive = false
      supabase.removeChannel(ch)
    }
  }, [open ])

  // Presence: count who is in the room (panel open = in the room).
  useEffect(() => {
    if (!open) return
    const room = supabase.channel('group-chat-room', {
      config: { presence: { key: myKey } },
    })
    room
      .on('presence', { event: 'sync' }, () => {
        setOnline(Object.keys(room.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({ name: myName })
        }
      })
    return () => {
      supabase.removeChannel(room)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, myKey])

  useEffect(() => {
    const el = listRef.current
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight
  }, [messages, open])

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
    const { error } = await sendGroupMessage({ name: myName, key: myKey, body: text })
    if (error) setNotice(t('msg_error'))
  }

  return (
    <>
      <button type="button" className="chat-fab" onClick={() => setOpen((o) => !o)}>
        💬 {t('chat_open')}
      </button>
      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <strong>{t('group_chat_title')}</strong>
            <span className="chat-online">
              <span className="online-dot" /> {t('chat_online', { count: online })}
            </span>
            <button type="button" className="chat-close" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          {!user && (
            <div className="chat-name-row">
              <label>
                {t('chat_name_label')}
                <input
                  className="input"
                  value={name}
                  maxLength={30}
                  onChange={(e) => {
                    setName(e.target.value)
                    setGuestName(e.target.value)
                  }}
                />
              </label>
            </div>
          )}
          <div
            className="chat-list"
            ref={listRef}
            onScroll={(e) => {
              const el = e.currentTarget
              nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
            }}
          >
            {messages.map((m) => (
              <div key={m.id} className={`chat-msg${m.sender_key === myKey ? ' mine' : ''}`}>
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
            {messages.length === 0 && <p className="chat-empty">{t('chat_empty')}</p>}
          </div>
          <p className="chat-note">{t('chat_clears')}</p>
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
        </div>
      )}
    </>
  )
}
