import { supabase } from './supabase'

// "Contact us" data layer (migration11). Members write to the admin
// through the normal inbox (lib/messages); guests land in the
// contact_messages table, which the admin reads in Inbox -> Contact.

/** The (single) site admin's profile id, or null. */
export async function fetchAdminId() {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

export async function sendGuestContact({ name, contactInfo, body, senderId }) {
  return supabase.from('contact_messages').insert({
    name,
    contact_info: contactInfo || null,
    body,
    sender_id: senderId || null,
  })
}

export async function fetchContactMessages(limit = 50) {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data ?? [], error }
}

export async function markContactRead(id) {
  return supabase.from('contact_messages').update({ is_read: true }).eq('id', id)
}

export async function deleteContactMessage(id) {
  return supabase.from('contact_messages').delete().eq('id', id)
}
