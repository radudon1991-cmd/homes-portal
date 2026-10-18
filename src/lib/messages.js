import { supabase } from './supabase'

// Attach the listing title + the other party's profile to each message,
// using the same batch-fetch pattern as the admin dashboard.
async function enrich(rows, partyKey) {
  const listingIds = [...new Set(rows.map((m) => m.listing_id).filter(Boolean))]
  const partyIds = [...new Set(rows.map((m) => m[partyKey]).filter(Boolean))]
  const listingMap = {}
  if (listingIds.length) {
    const { data } = await supabase.from('listings').select('id, title').in('id', listingIds)
    ;(data ?? []).forEach((l) => {
      listingMap[l.id] = l
    })
  }
  const partyMap = {}
  if (partyIds.length) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .in('id', partyIds)
    ;(data ?? []).forEach((p) => {
      partyMap[p.id] = p
    })
  }
  return rows.map((m) => ({
    ...m,
    listing: m.listing_id ? listingMap[m.listing_id] ?? null : null,
    party: partyMap[m[partyKey]] ?? null,
  }))
}

export async function fetchInbox(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)
  return { data: await enrich(data ?? [], 'sender_id'), error }
}

export async function fetchOutbox(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)
  return { data: await enrich(data ?? [], 'recipient_id'), error }
}

export async function fetchUnreadCount(userId) {
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false)
  return count ?? 0
}

export async function sendMessage({ senderId, recipientId, listingId, body }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      listing_id: listingId ?? null,
      body,
    })
    .select()
    .single()
  return { data, error }
}

export async function markRead(id) {
  const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', id)
  return { error }
}
