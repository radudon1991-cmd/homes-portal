import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'
import HouseRules from '../components/HouseRules'
import { useAuth } from '../lib/AuthContext'
import { useProfile } from '../lib/useProfile'
import { useLang, TYPE_KEY } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { fetchListingById, createListing, updateListing, uploadPhotos } from '../lib/listings'
import { PROVINCES } from '../lib/format'

const TYPE_VALUES = ['condo', 'house', 'townhouse', 'land']

// User's rule (2026-10-17): at most 10 photos per post; each photo is
// shrunk to ~300 KB in the browser before upload (see lib/image.js).
const MAX_PHOTOS = 10

const EMPTY = {
  title: '',
  description: '',
  price_thb: '',
  property_type: 'condo',
  listing_type: 'sale',
  rent_period: 'monthly',
  bedrooms: '2',
  bathrooms: '1',
  area_sqm: '',
  area_rai: '',
  area_ngan: '',
  area_tarangwa: '',
  province: 'Bangkok',
  address: '',
  phone: '',
  line_id: '',
  whatsapp: '',
  telegram: '',
  auto_renew: false,
}

export default function PostListing() {
  const { id: editId } = useParams()
  const isEdit = Boolean(editId)
  const { user } = useAuth()
  const { profile } = useProfile()
  const { t, lang } = useLang()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [location, setLocation] = useState(null)
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newPhotos, setNewPhotos] = useState([]) // [{ file, url }] with previews
  const [photoError, setPhotoError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [rejectionNote, setRejectionNote] = useState('')
  const [consent, setConsent] = useState(false) // contact-info agreement (2026-10-19)

  useEffect(() => {
    if (!isEdit) return
    fetchListingById(editId).then(({ data, error }) => {
      if (error || !data || data.owner_id !== user?.id) {
        setError(t('not_yours'))
        setLoading(false)
        return
      }
      setForm({
        title: data.title ?? '',
        description: data.description ?? '',
        price_thb: String(data.price_thb ?? ''),
        property_type: data.property_type ?? 'condo',
        listing_type: data.listing_type ?? 'sale',
        rent_period: data.rent_period ?? 'monthly',
        bedrooms: String(data.bedrooms ?? 0),
        bathrooms: String(data.bathrooms ?? 0),
        area_sqm: String(data.area_sqm ?? ''),
        area_rai: String(data.area_rai ?? ''),
        area_ngan: String(data.area_ngan ?? ''),
        area_tarangwa: String(data.area_tarangwa ?? ''),
        province: data.province ?? 'Bangkok',
        address: data.address ?? '',
        // Contact info belongs to THIS post (migration18) — editing
        // loads the post's own details, never the profile's.
        phone: data.phone ?? '',
        line_id: data.line_id ?? '',
        whatsapp: data.whatsapp ?? '',
        telegram: data.telegram ?? '',
        auto_renew: data.auto_renew ?? false,
      })
      if (data.latitude != null) setLocation({ lat: data.latitude, lng: data.longitude })
      setExistingPhotos(data.image_urls ?? [])
      setRejectionNote(data.rejection_reason ?? '')
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId, user])

  // Fetch the credit balance (auto-renew, migration12, is only
  // available to members with credit) and — for NEW posts only —
  // pre-fill the contact fields from the profile as a starting
  // helper. Edits load the post's OWN contact info (migration18).
  const [credit, setCredit] = useState(0)
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('phone, line_id, whatsapp, telegram, credit_baht').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setCredit(data.credit_baht ?? 0)
          if (!isEdit) {
            setForm((f) => ({
              ...f,
              phone: data.phone ?? f.phone,
              line_id: data.line_id ?? f.line_id,
              whatsapp: data.whatsapp ?? f.whatsapp,
              telegram: data.telegram ?? f.telegram,
            }))
          }
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const totalPhotos = existingPhotos.length + newPhotos.length

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // allow picking the same file again later
    if (picked.length === 0) return
    const room = Math.max(0, MAX_PHOTOS - totalPhotos)
    const accepted = picked.slice(0, room)
    setPhotoError(accepted.length < picked.length ? t('photos_max') : '')
    if (accepted.length > 0) {
      setNewPhotos([
        ...newPhotos,
        ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ])
    }
  }

  const removeNewPhoto = (idx) => {
    URL.revokeObjectURL(newPhotos[idx].url)
    setNewPhotos(newPhotos.filter((_, j) => j !== idx))
    setPhotoError('')
  }

  const validate = () => {
    if (form.title.trim().length < 5) return t('val_title')
    if (!form.price_thb || Number(form.price_thb) <= 0) return t('val_price')
    if (!form.province) return t('val_province')
    if (!location) return t('val_location')
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setBusy(true)
    try {
      // Upload any new photos first (shrunk in the browser, see uploadPhotos).
      let urls = [...existingPhotos]
      if (newPhotos.length > 0) {
        const { urls: uploaded, error: upErr } = await uploadPhotos(newPhotos.map((p) => p.file), user.id)
        if (upErr) throw new Error(t('photo_upload_failed') + upErr.message)
        urls = [...urls, ...uploaded]
      }

      // Land posts (migration21) measure area in rai / ngan /
      // tarang wa; area_sqm stores the computed total so the
      // rest of the site keeps working in square metres.
      const isLand = form.property_type === 'land'
      const landRai = parseInt(form.area_rai, 10) || 0
      const landNgan = parseInt(form.area_ngan, 10) || 0
      const landTw = Number(form.area_tarangwa) || 0
      const landSqm = landRai * 1600 + landNgan * 400 + landTw * 4
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price_thb: Number(form.price_thb),
        property_type: form.property_type,
        listing_type: form.listing_type,
        rent_period: form.listing_type === 'rent' ? form.rent_period : 'monthly',
        bedrooms: isLand ? 0 : Math.round(Number(form.bedrooms) || 0),
        bathrooms: isLand ? 0 : Math.round(Number(form.bathrooms) || 0),
        area_sqm: isLand ? landSqm : Number(form.area_sqm) || 0,
        area_rai: isLand ? landRai : null,
        area_ngan: isLand ? landNgan : null,
        area_tarangwa: isLand ? landTw : null,
        province: form.province,
        address: form.address.trim(),
        latitude: location.lat,
        longitude: location.lng,
        image_urls: urls,
        // Per-post contact info (migration18): saved on the listing
        // itself, so every post can show different details.
        phone: form.phone.trim() || null,
        line_id: form.line_id.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        telegram: form.telegram.trim() || null,
        owner_id: user.id,
        is_active: true,
        auto_renew: form.auto_renew,
        // New and edited listings always go back to 'pending':
        // an admin must approve them before they appear publicly.
        // Editing also clears any previous rejection note (fresh review).
        status: 'pending',
        rejection_reason: null,
      }

      // NOTE: contact info is NOT written back to the profile any
      // more (owner's rule, migration18) — it belongs to this post
      // only, so one post's details never change another post's.

      if (isEdit) {
        const { error } = await updateListing(editId, payload)
        if (error) throw error
        navigate('/my-listings', { state: { pendingNotice: true } })
      } else {
        const { error } = await createListing(payload)
        if (error) throw error
        navigate('/my-listings', { state: { pendingNotice: true } })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="page-center">{t('loading')}</div>

  if (profile?.is_banned) {
    return (
      <div className="page-center">
        <div className="auth-card">
          <h1>{t('banned_title')}</h1>
          <p>{t('banned_msg', { reason: profile.ban_reason || '—' })}</p>
          <Link to="/" className="btn btn-primary">{t('back_to_search')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page">
      <form className="listing-form" onSubmit={submit} noValidate>
        <h1>{isEdit ? t('edit_listing') : t('post_property')}</h1>
        <div className="trust-warning">⚠ {t('posting_warning')}</div>
        <HouseRules variant="compact" />
        {isEdit && rejectionNote && (
          <div className="admin-note"><strong>{t('fix_requested')}:</strong> {rejectionNote}</div>
        )}
        {error && <div className="form-error">{error}</div>}

        <label>{t('title_label')}<input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('title_ph')} /></label>

        <div className="form-row">
          <label>{t('for_label')}
            <select className="input" value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)}>
              <option value="sale">{t('sale')}</option>
              <option value="rent">{t('rent_opt')}</option>
            </select>
          </label>
          <label>{t('type_label')}
            <select className="input" value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
              {TYPE_VALUES.map((v) => <option key={v} value={v}>{t(TYPE_KEY[v])}</option>)}
            </select>
          </label>
          <label>{t('price_label')}
            <input className="input" type="number" min="1" step="any" value={form.price_thb} onChange={(e) => set('price_thb', e.target.value)} placeholder={t('price_ph')} />
          </label>
          {form.listing_type === 'rent' && (
            <label>{t('rent_period_label')}
              <select className="input" value={form.rent_period} onChange={(e) => set('rent_period', e.target.value)}>
                <option value="monthly">{t('rent_monthly')}</option>
                <option value="daily">{t('rent_daily')}</option>
              </select>
            </label>
          )}
        </div>

        {form.property_type === 'land' ? (
          <>
            <div className="form-row">
              <label>{t('unit_rai')}
                <input className="input" type="number" min="0" step="1" value={form.area_rai} onChange={(e) => set('area_rai', e.target.value)} placeholder="0" />
              </label>
              <label>{t('unit_ngan')}
                <input className="input" type="number" min="0" max="3" step="1" value={form.area_ngan} onChange={(e) => set('area_ngan', e.target.value)} placeholder="0" />
              </label>
              <label>{t('unit_tarangwa')}
                <input className="input" type="number" min="0" step="any" value={form.area_tarangwa} onChange={(e) => set('area_tarangwa', e.target.value)} placeholder="0" />
              </label>
            </div>
            <p className="hint">{t('area_total')}: {(parseInt(form.area_rai, 10) || 0) * 1600 + (parseInt(form.area_ngan, 10) || 0) * 400 + (Number(form.area_tarangwa) || 0) * 4} {t('sqm')}</p>
          </>
        ) : (
          <div className="form-row">
            <label>{t('bedrooms_label')}
              <input className="input" type="number" min="0" max="20" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
            </label>
            <label>{t('bathrooms_label')}
              <input className="input" type="number" min="0" max="20" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
            </label>
            <label>{t('area_label')}
              <input className="input" type="number" min="0" step="any" value={form.area_sqm} onChange={(e) => set('area_sqm', e.target.value)} placeholder={t('area_ph')} />
            </label>
          </div>
        )}

        <div className="form-row">
          <label>{t('province_label')}
            <select className="input" value={form.province} onChange={(e) => set('province', e.target.value)}>
              {PROVINCES.map((p) => <option key={p.en} value={p.en}>{lang === 'th' ? p.th : p.en}</option>)}
            </select>
          </label>
          <label>{t('address_label')}
            <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder={t('address_ph')} />
          </label>
        </div>

        <label>{t('description_label')}
          <textarea className="input" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={t('description_ph')} />
        </label>

        <div>
          <label className="label-title">{t('pin_title')}</label>
          <p className="hint">{t('pin_hint')}</p>
          <LocationPicker value={location} onChange={setLocation} />
          {location && (
            <p className="hint ok">{t('pinned_at')} {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
          )}
        </div>

        <div>
          <label className="label-title">{t('photos_label')} ({totalPhotos}/{MAX_PHOTOS})</label>
          {(existingPhotos.length > 0 || newPhotos.length > 0) && (
            <div className="photo-strip">
              {existingPhotos.map((u, i) => (
                <div key={`e${i}`} className="photo-thumb">
                  <img src={u} alt="" />
                  <button type="button" onClick={() => setExistingPhotos(existingPhotos.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              {newPhotos.map((p, i) => (
                <div key={`n${i}`} className="photo-thumb">
                  <img src={p.url} alt="" />
                  <button type="button" onClick={() => removeNewPhoto(i)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <label className={`photo-add-btn${totalPhotos >= MAX_PHOTOS ? ' is-disabled' : ''}`}>
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={totalPhotos >= MAX_PHOTOS}
              onChange={addFiles}
            />
            📷 {t('photo_add_btn')}
          </label>
          {photoError && <div className="form-error">{photoError}</div>}
          <p className="hint">{t('photo_hint')} {t('photo_multi_hint')}</p>
        </div>

        <div className="form-row">
          <label>{t('phone_label')}
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder={t('phone_ph')} />
          </label>
          <label>{t('line_label')}
            <input className="input" value={form.line_id} onChange={(e) => set('line_id', e.target.value)} placeholder={t('line_ph')} />
          </label>
        </div>

        <div className="form-row">
          <label>{t('whatsapp_label')}
            <input className="input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder={t('whatsapp_ph')} />
          </label>
          <label>{t('telegram_label')}
            <input className="input" value={form.telegram} onChange={(e) => set('telegram', e.target.value)} placeholder={t('telegram_ph')} />
          </label>
        </div>

        <div className="autorenew-box">
          <label className={`check-row${credit <= 0 && !form.auto_renew ? ' is-disabled' : ''}`}>
            <input
              type="checkbox"
              checked={form.auto_renew}
              disabled={credit <= 0 && !form.auto_renew}
              onChange={(e) => set('auto_renew', e.target.checked)}
            />
            <span>🔄 {t('auto_renew_label')} — {t('auto_renew_hint')}</span>
          </label>
          {credit <= 0 && !form.auto_renew && (
            <p className="hint">{t('auto_renew_need_credit')} <Link to="/contact">{t('buy_credit')} →</Link></p>
          )}
          {form.auto_renew && (
            <p className="hint ok">✓ {t('auto_renew_on_hint', { credit })}</p>
          )}
        </div>

        <label className="check-row consent-row">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>✋ {t('post_consent')}</span>
        </label>

        <div className="form-actions">
          <Link to="/my-listings" className="btn btn-ghost">{t('cancel')}</Link>
          <button className="btn btn-primary" disabled={busy || !consent}>{busy ? t('saving') : isEdit ? t('save_changes') : t('publish')}</button>
        </div>
      </form>
    </div>
  )
}
