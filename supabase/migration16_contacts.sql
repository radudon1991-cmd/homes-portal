-- migration16_contacts.sql
-- More seller contact options (user request, 2026-10-18): WhatsApp and
-- Telegram, stored on the profile exactly like the LINE ID
-- (migration9). Entered on the post-listing form, pre-filled from the
-- profile, and shown as chat buttons on the listing page.
alter table public.profiles
  add column if not exists whatsapp text,
  add column if not exists telegram text;
