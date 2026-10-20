-- ============================================================
-- TruePin Property — migration 22: MODERATOR role (owner's
-- design, approved 2026-10-19). Run in Supabase: SQL Editor →
-- New query → paste → Run. Nothing is deleted. Safe to run on
-- the live project. MUST run BEFORE the moderator code deploys
-- (useProfile selects is_moderator; a missing column would break
-- profile loads, same caution as migration19).
--
-- A moderator sits between member and admin:
--   CAN:  approve / reject listings (with a note) on the
--         Moderation page; post their own listings live with no
--         approval wait; edit their own listings without
--         re-approval.
--   CANNOT (admin-only, unchanged): add credit, delete or ban
--         members, make/remove moderators, send broadcasts,
--         approve face-photo verifications, review display-name
--         requests.
-- The admin promotes/demotes from the Members page, which calls
-- admin_set_moderator() below.
-- ============================================================

-- ---------- 1. The flag ----------
alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

-- ---------- 2. Only the RPC may change the flag ----------
-- The "users manage own profile" policy (schema.sql) lets members
-- update their own profile row, so without this guard anyone
-- could set their own is_moderator = true with a direct API call.
-- Mirrors migration19's guard_verification: direct changes are
-- silently reverted; the RPC sets a transaction-local flag.
create or replace function public.guard_moderator()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.moderator_change', true), '') = 'on' then
    return new;
  end if;
  if new.is_moderator is distinct from old.is_moderator then
    new.is_moderator := old.is_moderator;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_moderator on public.profiles;
create trigger trg_guard_moderator
  before update on public.profiles
  for each row execute function public.guard_moderator();

-- ---------- 3. Admin-only promote / demote ----------
create or replace function public.admin_set_moderator(p_user uuid, p_flag boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and is_admin
  ) then
    raise exception 'admins only';
  end if;
  perform set_config('app.moderator_change', 'on', true);
  update public.profiles
     set is_moderator = coalesce(p_flag, false)
   where id = p_user;
end;
$$;

-- ---------- 4. Privileged owners skip the approval queue ----------
-- The post form always sends status='pending' (create AND edit).
-- This BEFORE trigger flips a privileged owner's row straight to
-- 'approved'. Two deliberate limits on UPDATE:
--   * only when the saver IS the owner (auth.uid() = owner_id)
--     and the save is the seller re-pend (status='pending') — so
--     an admin rejecting a moderator's post from the Moderation
--     page (different auth.uid(), status='rejected') still sticks;
--   * renewals / credit / ban updates never carry 'pending', so
--     they pass through untouched.
-- Expiry: becoming approved must start the 30-day clock exactly
-- like an admin approval (migration12). trg_listing_expiry does
-- that on INSERT / status-change into 'approved'; this trigger is
-- named to run BEFORE it (alphabetical order) so the status is
-- already 'approved' when it checks — and this function sets the
-- same expiry itself as a belt-and-braces duplicate.
create or replace function public.auto_approve_privileged_listing()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.id = new.owner_id and (p.is_admin or p.is_moderator)
  ) then
    if tg_op = 'INSERT' then
      new.status := 'approved';
    elsif tg_op = 'UPDATE'
       and auth.uid() = new.owner_id
       and new.status = 'pending' then
      new.status := 'approved';
    end if;
    if new.status = 'approved'
       and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
      new.expires_at := now() + interval '30 days';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listing_auto_approve on public.listings;
create trigger trg_listing_auto_approve
  before insert or update on public.listings
  for each row execute function public.auto_approve_privileged_listing();

-- ---------- 5. RLS for moderators ----------
-- PostgreSQL checks INSERT/UPDATE policy WITH CHECK expressions
-- against the row AFTER BEFORE triggers have run. So a
-- moderator's insert (flipped to 'approved' by the trigger above)
-- would FAIL migration3's `status = 'pending'` insert check, and
-- a moderator's own edit (flipped back to 'approved') would fail
-- the owner-update `status = 'pending'` check. The permissive
-- policies below are OR-ed with the existing ones: regular
-- members see zero change; privileged owners gain a passing path.

-- Moderation page: moderators can read listings of every status.
drop policy if exists "moderators can read all listings" on public.listings;
create policy "moderators can read all listings"
  on public.listings for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_moderator));

-- Moderation page: moderators can approve / reject (mirrors the
-- admins' update policy from migration3; no DELETE, no profiles).
drop policy if exists "moderators manage listings" on public.listings;
create policy "moderators manage listings"
  on public.listings for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_moderator));

-- Privileged owners may insert (their trigger-approved rows must
-- pass a WITH CHECK). Banned users stay blocked, as in migration3.
drop policy if exists "privileged owners can insert listings" on public.listings;
create policy "privileged owners can insert listings"
  on public.listings for insert
  with check (
    auth.uid() = owner_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and (p.is_admin or p.is_moderator))
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_banned)
  );
