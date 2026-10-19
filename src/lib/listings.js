import { supabase, isSupabaseConfigured } from './supabase'
import { SEED_LISTINGS } from './seedData'
import { compressImage } from './image'
import { PROVINCES } from './format'

export const dataSource = isSupabaseConfigured ? 'supabase' : 'demo'

function withSeller(listing) {
  return { ...listing, profiles: listing.profiles ?? { display_name: 'Seller', phone: '' } }
}

export async function fetchListings() {
  if (!isSupabaseConfigured) {
    return { data: SEED_LISTINGS.filter((l) => l.is_active && (l.status ?? 'approved') === 'approved'), error: null }
  }
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles(display_name, phone, line_id, whatsapp, telegram, avatar_url)')
    .eq('is_active', true)
    .eq('status', 'approved')
    // Posts go live for 30 days from approval (migration12); expired
    // ones disappear from public view until the owner renews them.
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(500)
  return { data: (data ?? []).map(withSeller), error }
}

export async function fetchListingById(id) {
  if (!isSupabaseConfigured) {
    const found = SEED_LISTINGS.find((l) => l.id === id)
    return { data: found ? withSeller(found) : null, error: found ? null : new Error('Not found') }
  }
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles(display_name, phone, line_id, whatsapp, telegram, avatar_url)')
    .eq('id', id)
    .single()
  return { data: data ? withSeller(data) : null, error }
}

export async function fetchMyListings(userId) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function createListing(payload) {
  const { data, error } = await supabase.from('listings').insert(payload).select().single()
  return { data, error }
}

export async function updateListing(id, payload) {
  const { data, error } = await supabase.from('listings').update(payload).eq('id', id).select().single()
  return { data, error }
}

export async function deleteListing(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id)
  return { error }
}

/** True when an approved listing's 30 days are up (migration12). */
export function isExpired(listing) {
  return Boolean(
    listing?.expires_at && new Date(listing.expires_at).getTime() <= Date.now()
  )
}

/** Whole days of live time left (0 when expired or no expiry set). */
export function daysLeft(listing) {
  if (!listing?.expires_at) return 0
  const ms = new Date(listing.expires_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
}

/**
 * Renew a post for 30 more days: extends from whichever is later,
 * the current expiry or right now — renewing early never loses days.
 * Only expires_at is touched, so the listing is NOT sent back to
 * pending (that rule lives in the edit form's payload, not here).
 */
export async function renewListing(listing) {
  const base = Math.max(
    listing.expires_at ? new Date(listing.expires_at).getTime() : 0,
    Date.now()
  )
  const next = new Date(base + 30 * 86400000).toISOString()
  return updateListing(listing.id, { expires_at: next })
}

export async function uploadPhotos(files, userId) {
  const urls = []
  for (const file of files) {
    // Shrink in the browser first (~300 KB max per photo) to save storage.
    const prepared = await compressImage(file)
    const ext = prepared.type === 'image/jpeg' ? 'jpg' : (prepared.name.split('.').pop() || 'jpg')
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('listing-photos')
      .upload(path, prepared, { contentType: prepared.type || undefined })
    if (error) return { urls, error }
    const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return { urls, error: null }
}

export function applyFilters(listings, f) {
  const q = f.query.trim().toLowerCase()
  return listings.filter((l) => {
    // Empty listingType means "all together" (owner's simplification,
    // 2026-10-18): sale and rent share one map unless filtered.
    if (f.listingType && l.listing_type !== f.listingType) return false
    if (f.province && l.province !== f.province) return false
    if (f.propertyType && l.property_type !== f.propertyType) return false
    if (f.minPrice !== '' && Number(l.price_thb) < Number(f.minPrice)) return false
    if (f.maxPrice !== '' && Number(l.price_thb) > Number(f.maxPrice)) return false
    if (f.bedrooms !== '' && Number(l.bedrooms) < Number(f.bedrooms)) return false
    if (f.bathrooms !== '' && Number(l.bathrooms) < Number(f.bathrooms)) return false
    if (q) {
      // Search matches the Thai province name too, so typing ภูเก็ต
      // finds listings stored under the canonical 'Phuket'.
      const provTh = PROVINCES.find((p) => p.en === l.province)?.th ?? ''
      const hay = `${l.title} ${l.address} ${l.province} ${provTh}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
