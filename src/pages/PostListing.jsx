import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'
import { useAuth } from '../lib/AuthContext'
import { useLang, TYPE_KEY } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { fetchListingById, createListing, updateListing, uploadPhotos } from '../lib/listings'
import { PROVINCES } from '../lib/format'

const TYPE_VALUES = ['condo', 'house', 'townhouse', 'land']

const EMPTY = {
  title: '',
  description: '',
  price_thb: '',
  property_type: 'condo',
  listing_type: 'sale',
  bedrooms: '2',
  bathrooms: '1',
  area_sqm: '',
  province: 'Bangkok',
  address: '',
  phone: '',
}

export default function PostListing() {
  const { id: editId } = useParams()
  const isEdit = Boolean(editId)
  const { user } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [location, setLocation] = useState(null)
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)

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
        bedrooms: String(data.bedrooms ?? 0),
        bathrooms: String(data.bathrooms ?? 0),
        area_sqm: String(data.area_sqm ?? ''),
        province: data.province ?? 'Bangkok',
        address: data.address ?? '',
        phone: '',
      })
      if (data.latitude != null) setLocation({ lat: data.latitude, lng: data.longitude })
      setExistingPhotos(data.image_urls ?? [])
      setLoading(false)
    })
    // Load the seller's phone from their profile.
    supabase.from('profiles').select('phone').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.phone) setForm((f) => ({ ...f, phone: data.phone }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId, user])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

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
      // Upload any new photos first.
      let urls = [...existingPhotos]
      if (newFiles.length > 0) {
        const { urls: uploaded, error: upErr } = await uploadPhotos(newFiles, user.id)
        if (upErr) throw new Error(t('photo_upload_failed') + upErr.message)
        urls = [...urls, ...uploaded]
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price_thb: Number(form.price_thb),
        property_type: form.property_type,
        listing_type: form.listing_type,
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
      }

      // Keep the seller's phone number up to date for contact display.
      if (form.phone.trim()) {
        await supabase.from('profiles').update({ phone: form.phone.trim() }).eq('id', user.id)
      }

      if (isEdit) {
        const { error } = await updateListing(editId, payload)
        if (error) throw error
      } else {
        const { error } = await createListing(payload)
        if (error) throw error
      }
      navigate('/my-listings')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="page-center">{t('loading')}</div>

  return (
    <div className="form-page">
      <form className="listing-form" onSubmit={submit}>
        <h1>{isEdit ? t('edit_listing') : t('post_property')}</h1>
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
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
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
          <label className="label-title">{t('photos_label')}</label>
          {existingPhotos.length > 0 && (
            <div className="photo-strip">
              {existingPhotos.map((u, i) => (
                <div key={i} className="photo-thumb">
                  <img src={u} alt="" />
                  <button type="button" onClick={() => setExistingPhotos(existingPhotos.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}
          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
          />
          <p className="hint">{t('photo_hint')}</p>
        </div>

        <label>{t('phone_label')}
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder={t('phone_ph')} />
        </label>

        <div className="form-actions">
          <Link to="/my-listings" className="btn btn-ghost">{t('cancel')}</Link>
          <button className="btn btn-primary" disabled={busy}>{busy ? t('saving') : isEdit ? t('save_changes') : t('publish')}</button>
        </div>
      </form>
    </div>
  )
}
