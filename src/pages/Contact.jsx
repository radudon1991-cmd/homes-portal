import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import { useLang } from '../lib/i18n'
import { sendMessage } from '../lib/messages'
import { fetchAdminId, sendGuestContact } from '../lib/contact'
import SupportChat from '../components/SupportChat'

// "Contact us" page (owner's request, 2026-10-18), linked from the
// footer button. Signed-in members write straight into the admin's
// Inbox; guests (no account) leave a contact message the admin
// reads under Inbox -> Contact. The site's LINE @truepinproperty
// is offered as the chat alternative.
const LINE_URL = 'https://line.me/R/ti/p/@truepinproperty'

export default function Contact() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { t } = useLang()
  const [name, setName] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState('idle') // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault()
    if (!body.trim() || state === 'sending') return
    if (!user && !name.trim()) {
      setState('error')
      return
    }
    setState('sending')
    const fullBody = contactInfo.trim()
      ? `${body.trim()}\n\n— ${t('contact_info')}: ${contactInfo.trim()}`
      : body.trim()
    let error = null
    if (user) {
      const adminId = await fetchAdminId()
      if (adminId && adminId !== user.id) {
        const res = await sendMessage({
          senderId: user.id,
          recipientId: adminId,
          listingId: null,
          body: fullBody,
        })
        error = res.error
      }
    }
    if (!user || error) {
      const res = await sendGuestContact({
        name: (name || profile?.display_name || 'Member').trim(),
        contactInfo: contactInfo.trim(),
        body: fullBody,
        senderId: user?.id ?? null,
      })
      error = res.error
    }
    setState(error ? 'error' : 'sent')
    if (!error) {
      setBody('')
      setContactInfo('')
    }
  }

  return (
    <div className="form-page">
      <div className="listing-form">
        <h1>{t('contact_title')}</h1>
        <p className="auth-sub">{t('contact_sub')}</p>
        {state === 'sent' ? (
          <div className="empty-state">
            <p>
              <strong>{t('contact_sent')}</strong>
            </p>
            <p>{t('contact_sent_note')}</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {!user && (
              <label>
                <span className="label-title">{t('contact_name')}</span>
                <input
                  className="input"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            <label>
              <span className="label-title">{t('contact_info')}</span>
              <input
                className="input"
                value={contactInfo}
                maxLength={120}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </label>
            <label>
              <span className="label-title">{t('contact_message')}</span>
              <textarea
                className="input"
                rows={6}
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            {state === 'error' && <p className="form-error">{t('msg_error')}</p>}
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={state === 'sending' || !body.trim()}
              >
                {state === 'sending' ? t('msg_sending') : t('contact_send')}
              </button>
            </div>
          </form>
        )}
        <div className="contact-line-box">
          <p className="hint">{t('contact_or_line')}</p>
          <a className="btn btn-line" href={LINE_URL} target="_blank" rel="noreferrer">
            💬 LINE @truepinproperty
          </a>
        </div>
        <SupportChat />
      </div>
    </div>
  )
}
