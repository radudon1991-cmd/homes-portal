import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useLang } from '../lib/i18n'
import { formatDate } from '../lib/format'
import { compressImage } from '../lib/image'
import { checkImageFile } from '../lib/avatarCheck'
import VerifyAccount from '../components/VerifyAccount'

// Member profile page (2026-10-18): avatar upload with an automatic
// content check (no admin approval — lib/avatarCheck.js), display
// name changes by request only (an admin approves, migration17), and
// the seller contact fields that appear on listings.
export default function Profile() {
  const { user } = useAuth()
  const { t, lang } = useLang()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarState, setAvatarState] = useState('') // '' | checking | uploading | blocked | failed | saved
  const [nameInput, setNameInput] = useState('')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [contact, setContact] = useState({ phone: '', line_id: '', whatsapp: '', telegram: '' })
  const [contactBusy, setContactBusy] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data ?? null)
    if (data) {
      setContact({
        phone: data.phone ?? '',
        line_id: data.line_id ?? '',
        whatsapp: data.whatsapp ?? '',
        telegram: data.telegram ?? '',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) return <div className="page-center">{t('loading')}</div>
  if (!profile) return <div className="page-center"><p>{t('listing_not_found')}</p></div>

  const initial = (profile.display_name || profile.email || '?').trim().charAt(0).toUpperCase()

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    // 1. Automatic content check in the browser — no approval needed,
    //    but a photo flagged as adult content never uploads.
    setAvatarState('checking')
    let verdict
    try {
      verdict = await checkImageFile(file)
    } catch {
      setAvatarState('failed')
      return
    }
    if (!verdict.ok) {
      setAvatarState('blocked')
      return
    }
    // 2. Shrink + upload into the member's own storage folder.
    setAvatarState('uploading')
    try {
      const prepared = await compressImage(file)
      const path = `${user.id}/avatar-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('listing-photos')
        .upload(path, prepared, { contentType: 'image/jpeg' })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)
      if (error) throw error
      setProfile((p) => ({ ...p, avatar_url: data.publicUrl }))
      setAvatarState('saved')
    } catch {
      setAvatarState('failed')
    }
  }

  const requestName = async () => {
    const n = nameInput.trim()
    if (n.length < 2) return
    setNameBusy(true)
    setNameMsg('')
    const { error } = await supabase.rpc('request_display_name', { new_name: n })
    setNameBusy(false)
    if (error) {
      setNameMsg(error.message)
    } else {
      setNameInput('')
      setNameMsg('sent')
      load()
    }
  }

  const cancelNameRequest = async () => {
    await supabase
      .from('profiles')
      .update({ pending_display_name: null, name_requested_at: null })
      .eq('id', user.id)
    load()
  }

  const saveContact = async () => {
    setContactBusy(true)
    setContactSaved(false)
    const { error } = await supabase
      .from('profiles')
      .update({
        phone: contact.phone.trim() || null,
        line_id: contact.line_id.trim() || null,
        whatsapp: contact.whatsapp.trim() || null,
        telegram: contact.telegram.trim() || null,
      })
      .eq('id', user.id)
    setContactBusy(false)
    if (!error) setContactSaved(true)
  }

  const setC = (k, v) => {
    setContact((c) => ({ ...c, [k]: v }))
    setContactSaved(false)
  }

  return (
    <div className="profile-page">
      <h1>{t('profile_title')}</h1>

      {profile.is_banned && (
        <div className="admin-note">
          <strong>{t('banned_title')}:</strong> {profile.ban_reason || '—'}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-head">
          {profile.avatar_url ? (
            <img className="profile-avatar" src={profile.avatar_url} alt="" />
          ) : (
            <span className="profile-avatar profile-avatar-initial">{initial}</span>
          )}
          <div>
            <div className="profile-name">{profile.display_name || '—'}</div>
            <div className="hint">{profile.email}</div>
            {profile.created_at && (
              <div className="hint">{t('profile_joined', { date: formatDate(profile.created_at, lang) })}</div>
            )}
            <div className="hint">{t('credit_balance')}: ฿{profile.credit_baht ?? 0}</div>
          </div>
        </div>

        <div className="avatar-actions">
          <label className={`photo-add-btn${avatarState === 'checking' || avatarState === 'uploading' ? ' is-disabled' : ''}`}>
            <input type="file" accept="image/*" hidden onChange={pickAvatar} />
            📷 {profile.avatar_url ? t('avatar_change') : t('avatar_upload')}
          </label>
          {avatarState === 'checking' && <span className="hint">{t('avatar_checking')}</span>}
          {avatarState === 'uploading' && <span className="hint">{t('saving')}</span>}
          {avatarState === 'saved' && <span className="hint ok">✓ {t('avatar_saved')}</span>}
          {avatarState === 'blocked' && <span className="error-text">{t('avatar_blocked')}</span>}
          {avatarState === 'failed' && <span className="error-text">{t('avatar_check_failed')}</span>}
        </div>
        <p className="hint">{t('avatar_hint')}</p>
      </div>

      <div className="profile-card">
        <h3>{t('profile_name_title')}</h3>
        <p className="hint">
          {t('name_current')}: <strong>{profile.display_name || '—'}</strong>
        </p>
        {profile.pending_display_name ? (
          <div className="pending-name-box">
            <span>⏳ {t('name_pending', { name: profile.pending_display_name })}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelNameRequest}>
              {t('name_cancel')}
            </button>
          </div>
        ) : (
          <>
            <div className="name-request-row">
              <input
                className="input"
                value={nameInput}
                maxLength={40}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t('name_request_ph')}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={nameBusy || nameInput.trim().length < 2}
                onClick={requestName}
              >
                {t('name_request_btn')}
              </button>
            </div>
            <p className="hint">{t('name_request_hint')}</p>
          </>
        )}
        {nameMsg === 'sent' && <p className="hint ok">✓ {t('name_request_sent')}</p>}
        {nameMsg && nameMsg !== 'sent' && <p className="error-text">{nameMsg}</p>}
      </div>

      <VerifyAccount profile={profile} onChanged={load} />

      <div className="profile-card">
        <h3>{t('profile_contact_title')}</h3>
        <p className="hint">{t('profile_contact_hint')}</p>
        <div className="form-row">
          <label>{t('phone_label')}
            <input className="input" value={contact.phone} onChange={(e) => setC('phone', e.target.value)} placeholder={t('phone_ph')} />
          </label>
          <label>{t('line_label')}
            <input className="input" value={contact.line_id} onChange={(e) => setC('line_id', e.target.value)} placeholder={t('line_ph')} />
          </label>
        </div>
        <div className="form-row">
          <label>{t('whatsapp_label')}
            <input className="input" value={contact.whatsapp} onChange={(e) => setC('whatsapp', e.target.value)} placeholder={t('whatsapp_ph')} />
          </label>
          <label>{t('telegram_label')}
            <input className="input" value={contact.telegram} onChange={(e) => setC('telegram', e.target.value)} placeholder={t('telegram_ph')} />
          </label>
        </div>
        <div className="msg-actions">
          {contactSaved && <span className="hint ok">✓ {t('profile_saved')}</span>}
          <button type="button" className="btn btn-primary" disabled={contactBusy} onClick={saveContact}>
            {contactBusy ? t('saving') : t('save_changes')}
          </button>
        </div>
        <p className="hint">
          {t('auto_renew_need_credit')} <Link to="/contact">{t('buy_credit')} →</Link>
        </p>
      </div>
    </div>
  )
}
