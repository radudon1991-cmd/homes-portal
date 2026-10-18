// Clean-chat filter for the live chats (owner's rule, 2026-10-17):
// text, links and emoji only, and the language stays appropriate.
// Messages that hit the blocklist are refused with a friendly notice.
// The list is deliberately small and maintainable — it catches the
// common abuse, it is not a censorship engine.

// Common English profanity + spam staples (lowercase substrings).
const BLOCKED_EN = [
  'fuck', 'shit', 'bitch', 'bastard', 'dick', 'pussy', 'whore',
  'nigger', 'faggot', 'porn', 'xxx', 'sex chat', 'onlyfans',
  'crypto giveaway', 'free money', 'work from home scam',
]

// Common Thai profanity (substrings).
const BLOCKED_TH = [
  'เหี้ย', 'สัตว์', 'ควย', 'เย็ด', 'หี', 'แตด', 'ส้นตีน',
  'ไอ้สัส', 'อีสัส', 'มึงตาย', 'พ่อมึงตาย', 'แม่มึงตาย',
]

const ALL_BLOCKED = [...BLOCKED_EN, ...BLOCKED_TH]

/**
 * Check a chat message. Returns { ok: true } or
 * { ok: false, reason: 'blocked' | 'links' | 'long' | 'empty' }.
 * At most ONE link per message — link floods are the classic
 * anonymous-chat spam move.
 */
export function checkChatMessage(raw) {
  const body = (raw || '').trim()
  if (!body) return { ok: false, reason: 'empty' }
  if (body.length > 500) return { ok: false, reason: 'long' }
  const lower = body.toLowerCase()
  if (ALL_BLOCKED.some((w) => lower.includes(w))) {
    return { ok: false, reason: 'blocked' }
  }
  const links = lower.match(/https?:\/\/|www\./g)
  if (links && links.length > 1) return { ok: false, reason: 'links' }
  return { ok: true }
}
