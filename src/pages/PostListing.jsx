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
        province: data.province ?? 'Bangkok',
        address: data.address ?? '',
        phone: '',
        line_id: '',
        whatsapp: '',
        telegram: '',
        auto_renew: data.auto_renew ?? false,
      })
      if (data.latitude != null) setLocation({ lat: data.latitude, lng: data.longitude })
      setExistingPhotos(data.image_urls ?? [])
      setRejectionNote(data.rejection_reason ?? '')
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId, user])

  // Pre-fill the seller's contact info (phone + LINE) from their profile
  // for both new posts and edits. Also fetch the credit balance:
  // auto-renew (migration12) is only available to members with credit.
  const [credit, setCredit] = useState(0)
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('phone, line_id, whatsapp, telegram, credit_baht').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setCredit(data.credit_baht ?? 0)
          setForm((f) => ({
            ...f,
            phone: data.phone ?? f.phone,
            line_id: data.line_id ?? f.line_id,
            whatsapp: data.whatsapp ?? f.whatsapp,
            telegram: data.telegram ?? f.telegram,
          }))
        }
      })
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

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price_thb: Number(form.price_thb),
        property_type: form.property_type,
        listing_type: form.listing_type,
        rent_period: form.listing_type === 'rent' ? form.rent_period : 'monthly',
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area_sqm: Number(form.area_sqm) || 0,
        province: form.province,
        address: form.address.trim(),
        latitude: location.lat,
        longitude: location.lng,
        image_urls: urls,
        owner_id: user.id,
        is_active: true,
        auto_renew: form.auto_renew,
        // New and edited listings always go back to 'pending':
        // an admin must approve them before they appear publicly.
        // Editing also clears any previous rejection note (fresh review).
        status: 'pending',
        rejection_reason: null,
      }

      // Keep the seller's contact info up to date for the listing page.
      await supabase
        .from('profiles')
        .update({
          phone: form.phone.trim() || null,
          line_id: form.line_id.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          telegram: form.telegram.trim() || null,
        })
        .eq('id', user.id)

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
      <form className="listing-form" onSubmit={submit}>
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
            <input className="input" type="number" min="1" value={form.price_thb} onChange={(e) => set('price_thb', e.target.value)} placeholder={t('price_ph')} />
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

        <div className="form-row">
          <label>{t('bedrooms_label')}
            <input className="input" type="number" min="0" max="20" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
          </label>
          <label>{t('bathrooms_label')}
            <input className="input" type="number" min="0" max="20" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
          </label>
          <label>{t('area_label')}
            <input className="input" type="number" min="0" value={form.area_sqm} onChange={(e) => set('area_sqm', e.target.value)} placeholder={t('area_ph')} />
          </label>
        </div>

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
          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            disabled={totalPhotos >= MAX_PHOTOS}
            onChange={addFiles}
          />
          {photoError && <div className="form-error">{photoError}</div>}
          <p className="hint">{t('photo_hint')}</p>
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

        <div className="form-actions">
          <Link to="/my-listings" className="btn btn-ghost">{t('cancel')}</Link>
          <button className="btn btn-primary" disabled={busy}>{busy ? t('saving') : isEdit ? t('save_changes') : t('publish')}</button>
        </div>
      </form>
    </div>
  )
}
