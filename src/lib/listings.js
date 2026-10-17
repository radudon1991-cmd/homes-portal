import { supabase, isSupabaseConfigured } from './supabase'
import { SEED_LISTINGS } from './seedData'

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
    .select('*, profiles(display_name, phone)')
    .eq('is_active', true)
    .eq('status', 'approved')
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
    .select('*, profiles(display_name, phone)')
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

export async function uploadPhotos(files, userId) {
  const urls = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('listing-photos').upload(path, file)
    if (error) return { urls, error }
    const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return { urls, error: null }
}

export function applyFilters(listings, f) {
  const q = f.query.trim().toLowerCase()
  return listings.filter((l) => {
    if (l.listing_type !== f.listingType) return false
    if (f.propertyType && l.property_type !== f.propertyType) return false
    if (f.minPrice !== '' && Number(l.price_thb) < Number(f.minPrice)) return false
    if (f.maxPrice !== '' && Number(l.price_thb) > Number(f.maxPrice)) return false
    if (f.bedrooms !== '' && Number(l.bedrooms) < Number(f.bedrooms)) return false
    if (f.bathrooms !== '' && Number(l.bathrooms) < Number(f.bathrooms)) return false
    if (q) {
      const hay = `${l.title} ${l.address} ${l.province}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
