import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchListingById, createListing, updateListing, uploadPhotos } from '../lib/listings'
import { PROPERTY_TYPES, PROVINCES } from '../lib/format'

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
        setError('Listing not found or not yours.')
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
  }, [isEdit, editId, user])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    if (form.title.trim().length < 5) return 'Please give the listing a clear title (5+ characters).'
    if (!form.price_thb || Number(form.price_thb) <= 0) return 'Please enter a valid price in baht.'
    if (!form.province) return 'Please choose a province.'
    if (!location) return 'Please tap the map to set the property location.'
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
        if (upErr) throw new Error('Photo upload failed: ' + upErr.message)
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

  if (loading) return <div className="page-center">Loading…</div>

  return (
    <div className="form-page">
      <form className="listing-form" onSubmit={submit}>
        <h1>{isEdit ? 'Edit your listing' : 'Post a property'}</h1>
        {error && <div className="form-error">{error}</div>}

        <label>Title *<input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Modern 2BR condo near BTS Asok" /></label>

        <div className="form-row">
          <label>For *
            <select className="input" value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)}>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </label>
          <label>Type *
            <select className="input" value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label>Price (THB) *
            <input className="input" type="number" min="1" value={form.price_thb} onChange={(e) => set('price_thb', e.target.value)} placeholder="e.g. 24500000" />
          </label>
        </div>

        <div className="form-row">
          <label>Bedrooms
            <input className="input" type="number" min="0" max="20" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
          </label>
          <label>Bathrooms
            <input className="input" type="number" min="0" max="20" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
          </label>
          <label>Floor area (sqm)
            <input className="input" type="number" min="0" value={form.area_sqm} onChange={(e) => set('area_sqm', e.target.value)} placeholder="e.g. 78" />
          </label>
        </div>

        <div className="form-row">
          <label>Province *
            <select className="input" value={form.province} onChange={(e) => set('province', e.target.value)}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>Address / area
            <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Soi, road, district…" />
          </label>
        </div>

        <label>Description
          <textarea className="input" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the property: condition, furniture, nearby transport, facilities…" />
        </label>

        <div>
          <label className="label-title">Pin the location on the map *</label>
          <p className="hint">Click the map to drop a pin where the property is. Drag the pin to adjust.</p>
          <LocationPicker value={location} onChange={setLocation} />
          {location && (
            <p className="hint ok">Pinned at {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
          )}
        </div>

        <div>
          <label className="label-title">Photos</label>
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
          <p className="hint">JPG/PNG photos work best. First photo becomes the cover.</p>
        </div>

        <label>Your contact phone
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. 081-234-5678" />
        </label>

        <div className="form-actions">
          <Link to="/my-listings" className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Publish listing'}</button>
        </div>
      </form>
    </div>
  )
}
