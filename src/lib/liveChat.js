import { supabase } from './supabase'

// Data layer for the two LIVE chats (migration10): the public group
// chat on the home page and the per-listing guest<->owner chat.
// Identity for visitors is a random guest key kept in this browser —
// no account needed (owner's request, 2026-10-17). Everything here
// is ephemeral: the database wipes live chats daily at 02:00 ICT.

const KEY_STORAGE = 'tre-guest-key'
const NAME_STORAGE = 'tre-guest-name'

export function guestKey() {
  try {
    let k = localStorage.getItem(KEY_STORAGE)
    if (!k) {
      k =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(KEY_STORAGE, k)
    }
    return k
  } catch {
    return 'guest-anon'
  }
}

export function guestName() {
  try {
    const n = localStorage.getItem(NAME_STORAGE)
    if (n) return n
  } catch {
    /* ignore */
  }
  return `Guest ${guestKey().replace(/-/g, '').slice(0, 4).toUpperCase()}`
}

export function setGuestName(name) {
  try {
    localStorage.setItem(NAME_STORAGE, name)
  } catch {
    /* ignore */
  }
}

/* ---------------- group chat ---------------- */

export async function fetchGroupMessages(limit = 60) {
  const { data, error } = await supabase
    .from('live_messages')
    .select('*')
    .eq('scope', 'group')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return { data: [], error }
  return { data: (data ?? []).reverse(), error: null }
}

export async function sendGroupMessage({ name, key, body }) {
  return supabase.from('live_messages').insert({
    scope: 'group',
    conversation_id: null,
    sender_name: name,
    sender_key: key,
    is_owner: false,
    body,
  })
}

/* ---------------- listing chat ---------------- */

export async function findConversation(listingId, key) {
  const { data } = await supabase
    .from('live_conversations')
    .select('*')
    .eq('listing_id', listingId)
    .eq('guest_key', key)
    .maybeSingle()
  return data ?? null
}

export async function createConversation({ listingId, ownerId, key, name }) {
  const { data, error } = await supabase
    .from('live_conversations')
    .insert({
      listing_id: listingId,
      owner_id: ownerId,
      guest_key: key,
      guest_name: name,
    })
    .select()
    .single()
  if (error) {
    // Unique race: someone (or a double-send) created it first.
    const existing = await findConversation(listingId, key)
    if (existing) return { data: existing, error: null }
  }
  return { data, error }
}

/* ------------- support chat (Contact page <-> admin) ------------- */
// Same machinery as listing chat, but the conversation has no
// listing (listing_id is null) and the "owner" side is the site
// admin. The admin answers from the same Inbox -> Live tab.

export async function findSupportConversation(adminId, key) {
  const { data } = await supabase
    .from('live_conversations')
    .select('*')
    .is('listing_id', null)
    .eq('owner_id', adminId)
    .eq('guest_key', key)
    .maybeSingle()
  return data ?? null
}

export async function createSupportConversation({ adminId, key, name }) {
  const { data, error } = await supabase
    .from('live_conversations')
    .insert({
      listing_id: null,
      owner_id: adminId,
      guest_key: key,
      guest_name: name,
    })
    .select()
    .single()
  if (error) {
    const existing = await findSupportConversation(adminId, key)
    if (existing) return { data: existing, error: null }
  }
  return { data, error }
}

export async function fetchConversationMessages(conversationId, limit = 80) {
  const { data, error } = await supabase
    .from('live_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)
  return { data: data ?? [], error }
}

export async function sendListingMessage({ conversationId, name, key, isOwner, body }) {
  const res = await supabase.from('live_messages').insert({
    scope: 'listing',
    conversation_id: conversationId,
    sender_name: name,
    sender_key: key,
    is_owner: isOwner,
    body,
  })
  if (!res.error) {
    await supabase
      .from('live_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
  }
  return res
}

export async function fetchOwnerConversations(ownerId) {
  const { data, error } = await supabase
    .from('live_conversations')
    .select('*, listings:listing_id (id, title)')
    .eq('owner_id', ownerId)
    .order('last_message_at', { ascending: false })
    .limit(30)
  return { data: data ?? [], error }
}

/* ---------------- realtime ---------------- */

/** Subscribe to new live_messages matching a PostgREST filter
 *  (e.g. 'scope=eq.group' or 'conversation_id=eq.<uuid>').
 *  Returns the channel; unsubscribe with supabase.removeChannel(ch). */
export function subscribeLiveMessages(filter, onInsert) {
  const ch = supabase
    .channel(`live-${filter}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_messages', filter },
      (payload) => onInsert(payload.new)
    )
    .subscribe()
  return ch
}
