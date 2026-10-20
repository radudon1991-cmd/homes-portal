# Build Notes — Homes Real Estate Map Portal

Built 2026-10-17. `npm run build` passes cleanly (Vite 5, React 18).

## What was built

A complete, deployable MVP of a Thailand property portal:

- **Public map search** — full-screen Leaflet/OpenStreetMap map of Thailand with
  price-pin markers (teal pills for sale, gold for rent, e.g. "฿24.5M"); clicking
  a pin highlights the listing; side panel lists results; search bar with
  location text search, Buy/Rent toggle, and filters (property type, min/max
  price in THB, bedrooms, bathrooms).
- **Listing detail pages** — photo gallery, baht price, beds/baths/area,
  description, address/province, mini-map pin, seller name + tap-to-call phone,
  posted date.
- **Auth** — email/password sign-up (with email confirmation handling), login,
  logout, session persistence via Supabase Auth. Public browsing needs no login.
- **Post a property** (login required) — validated form: title, price, type,
  sale/rent, beds, baths, area, province dropdown, address, description,
  click-to-drop map location picker, multi-photo upload to Supabase Storage,
  contact phone (saved to profile).
- **My listings dashboard** (login required) — view/edit/delete only your own
  listings (RLS enforced server-side too).
- **Seed data** — 12 realistic Thai listings (Bangkok, Phuket, Chiang Mai,
  Pattaya, Hua Hin) as both `supabase/seed.sql` and an in-app demo fallback
  (`src/lib/seedData.js`) so the map works before Supabase is connected.
- **Design** — original: deep lagoon-teal + marigold on warm paper white.
  Nothing copied from homes.com (no shared branding, copy, or assets).
  Mobile-responsive (map stacks above results on small screens).

## File layout

```
homes-portal/
├── package.json / vite.config.js / index.html
├── .env.example            # the two Supabase keys (copy to .env, never commit real keys)
├── README.md               # non-technical setup guide (Supabase → Vercel → seed)
├── BUILD_NOTES.md          # this file
├── supabase/
│   ├── schema.sql          # profiles + listings tables, RLS, storage bucket + policies
│   └── seed.sql            # 12 sample listings (picsum placeholder photos)
└── src/
    ├── main.jsx / App.jsx / index.css
    ├── lib/
    │   ├── supabase.js     # client (null-safe when env missing → demo mode)
    │   ├── AuthContext.jsx # session state
    │   ├── listings.js     # data access + client-side filtering
    │   ├── format.js       # ฿ formatting, provinces, type lists
    │   └── seedData.js     # demo fallback listings
    ├── components/
    │   ├── Navbar.jsx / ProtectedRoute.jsx
    │   ├── SearchBar.jsx / ListingCard.jsx
    │   ├── MapView.jsx     # Leaflet map + price-pin divIcons
    │   └── LocationPicker.jsx  # click-to-set pin for the post form
    └── pages/
        ├── Home.jsx / ListingDetail.jsx
        ├── Login.jsx / Signup.jsx
        └── PostListing.jsx (create + edit) / MyListings.jsx
```

## Security model (Supabase RLS)

- `listings`: public SELECT on active rows (or own rows); INSERT by authenticated
  users with `owner_id = auth.uid()`; UPDATE/DELETE by owner only.
- `profiles`: public read (seller contact display); users manage only own row;
  auto-created on sign-up via trigger.
- Storage `listing-photos`: public read; authenticated users can only
  write/delete inside their own `{user_id}/` folder.

## Deliberate simplifications / known limits

- Filtering is client-side after fetching active listings (fine for hundreds of
  listings; move to server-side queries past a few thousand).
- No image resizing/compression on upload; no moderation queue for listings.
- No Thai-language UI yet (labels are English; Thai market context is in data
  and formatting). Easy to add later.
- Signup relies on Supabase's default email confirmation; disable "Confirm
  email" in Supabase Auth settings if instant login is preferred.
- Bundle is ~575 kB (Leaflet + Supabase); acceptable for MVP, could code-split later.

## Left for the user (not done here — needs their accounts)

1. Create free Supabase project + run `supabase/schema.sql` (README Step 1–2).
2. Confirm `listing-photos` bucket exists (README Step 3).
3. Enable Email auth provider (README Step 4).
4. Push this folder to GitHub, import into Vercel, set the two env vars, deploy (README Step 6).
5. Run `supabase/seed.sql` for sample data (README Step 7).
6. Optional: custom domain (~$10–15/yr), Thai UI translation, listing moderation.

## Deploy note (2026-10-17)
- Deployed via GitHub (radudon1991-cmd/homes-portal) + Vercel (Hobby plan).
- Live: https://homes-portal-sage.vercel.app
- During deploy, src/lib/AuthContext.jsx was not included in the upload set, so a replacement was authored directly on GitHub. It differs slightly from this local copy (uses `name` instead of `display_name` in signup metadata; both work — the DB trigger falls back to the email prefix). If pushing from this local copy in future, it will overwrite the deployed version; both are valid.

## TruePin Property rebrand + trust & safety (2026-10-17)
- Trust features deployed: reports/ratings tables + moderation columns (migration2_trust.sql ran clean on Supabase); 11 files on GitHub main (ReportButton, SellerRating, Admin page, accuracy warning, banned-user handling); Vercel redeploy Ready, verified live.
- Site renamed to **TruePin Property** (user's pick). Brand strings in src/lib/i18n.jsx (EN+TH), index.html title/meta, CSS header comment.
- Domains: https://thailandrealestate.vercel.app (kept as alias) + https://truepinproperty.vercel.app (claimed free). Custom domain truepinproperty.app is available on Porkbun ($8.75 first year, ~$14.93/yr renew) — user deferred purchase, keep the free address for now.
- Admin setup: after the user signs up on the site, run `update public.profiles set is_admin = true where email = '<his signup email>'` (snippet at the bottom of supabase/migration2_trust.sql).

## Rejection feedback (2026-10-17)
- User asked: when admin rejects a listing, how does the seller know WHAT to fix?
- Added `rejection_reason` text column on listings (migration5_rejection_reason.sql; no RLS changes needed).
- Admin.jsx: Reject opens an inline form — admin writes the note (e.g. "price 500 — total or per sqm?"), Confirm rejection saves it.
- Sellers see the note in three places: My listings (under rejected rows), the listing page (under the rejected banner), and at the top of the edit form ("Please fix the following").
- Editing clears the note and returns the listing to 'pending'; approving also clears it.
- i18n EN+TH keys: rejection_reason_label, reject_note_ph, confirm_reject, admin_note, fix_requested.

## Pin popups + hover fix (2026-10-17)
- MapView markers bind a Leaflet popup (buildPopupEl): photo, title, price,
  "View details" button -> onOpenListing prop -> Home navigates to /listing/:id.
- Hovering side-panel cards no longer selects/flies the map: ListingCard onHover
  removed, MapView flyTo-on-selected effect removed. Only pin clicks fly.
- Popup CSS compact; @media (max-width:640px) shrinks it further (132px wide,
  72px photo) after user reported the phone popup was too big.

## Price-tier pin colours (2026-10-17)
- pinIcon colours by digit count of price_thb (user's rule):
  <=4 digits green #5E9C2F (tier-low), 5-6 digits blue var(--teal-700) (tier-mid),
  7+ digits red #C62828 (tier-high). Replaces the old rent/sale colours.
- Map legend overlay in Home (.map-legend) explains the three ranges.

## Inbox / outbox messaging (2026-10-17)
- supabase/migration6_messages.sql: messages table (listing_id, sender_id,
  recipient_id, body, is_read) + RLS: participants read; send as self,
  banned users blocked; recipients update (mark read). MUST be run on live.
- src/lib/messages.js: fetchInbox/fetchOutbox (batch-enriched with listing
  title + other party profile), fetchUnreadCount, sendMessage, markRead.
- src/pages/Inbox.jsx: /inbox (ProtectedRoute) with Inbox/Sent tabs, unread
  highlight, mark-read, inline reply (stays attached to the listing).
- ListingDetail seller card: message form for logged-in non-owners;
  login prompt otherwise. Navbar: Inbox link + red unread badge.

## Price bands v2 + rent period (2026-10-17, replaces digit-count tiers)
- User revised the pin colours after pausing work: 4 colours per category.
  Sale: green <=100K, blue <=500K, pink <=1M, red >1M.
  Rent monthly: green <=8K, blue <=15K, pink <=25K, red >25K.
  Rent daily: green <=700, blue <=1.5K, pink <=3.5K, red >3.5K.
  (His sale spec literally read blue from 150,001 leaving 100-150K unassigned;
  implemented contiguous bands, blue from 100,001 — flagged to user.)
- priceTier(listing) in MapView uses listing_type + rent_period.
- migration7_rent_period.sql: listings.rent_period ('monthly'|'daily',
  default 'monthly'). PostListing shows a Daily/Monthly select for rentals.
- formatPrice(listing, t) in lib/format.js appends /month or /day for rentals;
  used on cards, detail page, My listings and the pin popup.
- Map legend now follows the Buy/Rent tab (sale row, or monthly+daily rows).

## Password reset (2026-10-17)
- Login page gets a "Forgot password?" link -> /forgot-password:
  supabase.auth.resetPasswordForEmail with redirectTo {origin}/reset-password.
- /reset-password (ResetPassword.jsx) waits for the recovery session
  (PASSWORD_RECOVERY event / getSession, 1.5s grace), then updateUser({password}),
  signOut, success message. Invalid/expired links show an error + re-request link.
- Relies on Supabase Auth URL config allowing {origin}/** redirects
  (same wildcard added during the Google provider setup).

## Scale notes + planned feature (2026-10-17)
- Free-tier walls (verified 2026-10-17): Supabase free = 500MB DB, 1GB photo
  storage, 50K monthly ACTIVE users; Vercel Hobby = 100GB bandwidth/mo.
  Photos hit the wall first (~a few hundred listings). Pro: Supabase $25/mo
  (100GB storage, 100K MAU), Vercel $20/mo.
- APPROVED + BUILT 2026-10-17: auto-delete accounts inactive for 2 years (migration8_inactive_cleanup.sql: last_active_at tracking + monthly pg_cron delete_inactive_accounts(2); admins and banned accounts exempt).
  Design: track last activity, email a warning ~30 days before, then delete
  account + listings + photos. Build when real users exist; start activity
  tracking early so the 2-year clock has data.

## Photo size control (2026-10-17, user's spec)
- Max 10 photos per post (existing + new), enforced in PostListing with
  previews + counter (n/10); extra picks are refused with a photos_max note.
- lib/image.js compressImage(): browser-side resize (max 1600px) + JPEG
  re-encode targeting <=300 KB per photo (quality/dimension passes).
  uploadPhotos() in listings.js compresses before uploading to storage,
  so 10 photos/post <= ~3 MB. Undecodable files (e.g. HEIC on desktop
  Chrome) fall back to the original upload, as before.

## LINE contact option (2026-10-17, user's request)
- migration9: profiles.line_id. PostListing gets a LINE ID field next to
  phone (both pre-filled from profile, saved back on submit; new separate
  contact effect covers new posts too, replacing the edit-only phone load).
- ListingDetail seller card: green "Chat on LINE" button (.btn-line,
  #06C755) when line_id set; lineUrl() normalizes plain IDs, @accounts,
  and pasted line.me links. listings.js joins now include line_id.

## SPA deep-link fix (2026-10-17)
- Found during the privacy-page deploy: direct loads of any client route
  (/login, /privacy-policy, /listing/:id) returned Vercel 404 because the
  project had no SPA fallback. Added vercel.json with a catch-all rewrite
  to /index.html. Critical for: OAuth privacy URL checks, password-reset
  email links (/reset-password), and shared listing links.

## 2026-10-17 evening — serial-push recovery + feature completion
- LESSON: parallel browser tasks jammed (~2.5h, zero commits). Fix: close all, re-dispatch SERIALLY, verify at source (GitHub API / Supabase REST), not agent status.
- Google login: FULLY DONE + verified E2E (GCP project TruePin Property, consent published, Supabase provider enabled, Site URL + redirect URLs set).
- vercel.json SPA rewrite added (commit 65c5fd3) — fixed 404s on ALL deep links (/login, /listing/:id, /privacy-policy, /reset-password). Critical catch.
- Privacy policy page live at /privacy-policy (EN+TH).
- DB migrations 6 (messages), 7 (rent_period), 8 (inactive cleanup + pg_cron monthly job, admins never deleted, banned skipped), 9 (profiles.line_id) — ALL RAN + verified.
- Pin colours v2 deployed: tier bands per sale/monthly/daily (commits 2b6d2ea MapView, fc59966 css, 31bed3f Home+legend, bfafd4d ListingCard, 00ab9bb i18n, format.js in 11d8600). Compact phone popup deployed (132px/72px @ <=640px).
- Data batch: messages.js c7352bb, image.js 494ef97, listings.js 0c7f978 (line_id joins + compression in uploadPhotos), i18n.jsx 0f52d00 (42 keys).
- New pages: Inbox 5432b3b, ForgotPassword bf732a9, ResetPassword 9951ea8, FooterStats 295470e, index.css .btn-line 9fccb98.
- Page updates (full replace, msg "Wire inbox, password reset, LINE contact, footer stats"): ListingDetail 1a878b6, PostListing ebd84ee, MyListings fbd6171, Navbar 211a161, Login 897b08e, App.jsx c4e376d.
- ALL local features now deployed. Remaining: Facebook login redo; live verification pass; messaging two-account E2E (needs 2nd account); inactive-warning email (needs Resend later).
- ⚠ SEED INCIDENT 2026-10-17 evening: live verification found homepage "0 properties". SQL check: listings table EMPTY (total=0) despite earlier "verified 20" report — original seed insert never persisted. Profiles OK: Admin (is_admin, id b0804c15-0ae9-4009-a8de-04bbab9f1bad) + 2x "Jen". Seed re-ran in 4 batches via SQL editor; verified count=20, all approved. DO NOT re-run seed (duplicates).
- Live verification round 1 (public): PASS legend (Buy/Rent ranges switch; monthly+daily shown), footer stats ("3 members · 3 active this month"), /login (Google+Facebook buttons, Forgot password link), /forgot-password page, /inbox logged-out redirect, /privacy-policy, EN/TH toggle incl. map tiles. Phone-viewport popup test not possible in browser tool (no resize).
- Live verification round 2 (pins): ALL 7 PASS — counts 14 Buy + 6 Rent = 20; Asok condo pin red, popup ฿24,500,000 + View details -> full detail page, seller "Admin"; rent popup "฿45,000/month"; hover-no-fly PASS; card click opens detail; search "Phuket" -> 3, Clear -> 20.
- 2026-10-17 ~21:44 MDT: Bill deleted all 20 [EXAMPLE] listings himself. Site at 0 properties is now CORRECT (awaiting real listings). Do NOT re-seed unless he asks.
- Facebook login: DROPPED by owner late 2026-10-17 after 2 attempts died at Meta sign-in wall. SocialLogin.jsx now Google-only (pushed same night). Supabase FB provider never enabled.
- iPhone layout bug (owner screenshot 2026-10-17 23:32): page zoomed out, menu items floating outside navy bar, blank right strip. CAUSE: navbar content too wide for phones (grew with Inbox/Moderation/Post links; no wrap) -> horizontal overflow -> iOS shrink-to-fit zoom-out. FIX (index.css): .navbar/.nav-links flex-wrap + row-gap, tighter mobile spacing @640px, nowrap on navbar buttons, .card-photo min-height:160px fallback (photos rendered as thin strips on his browser). Local build OK.
- OPEN QUESTION same night: his 23:32 screenshot still showed "14 properties" although he deleted the examples at 21:44 — DB recount ordered with the fix push; [EXAMPLE] rows to be SQL-deleted if still present (his stated intent).
- Owner design change late 2026-10-17: homepage list = max 5 MOST RECENT posts, compact rows with SQUARE thumbnails (was: all posts, tall 16:10 photo cards that rendered as unreadable strips on his phone browser). Map still shows all pins. Implemented: Home.jsx recent=sort desc+slice(5) + panel-note (i18n showing_recent_5 EN/TH), ListingCard row layout (badge moved into meta row), index.css card section rewritten (86px square thumb, 2-line title clamp, panel-list max-height none on mobile). Build OK. Push AFTER the in-flight FB-removal/navbar batch lands (same index.css file).
- Provinces upgrade (owner request late 2026-10-17): PROVINCES in format.js now ALL 77 provinces as {en, th}; en = canonical DB value, th = display label via new provinceLabel(). PostListing dropdown shows Thai or English names per the EN/ไทย toggle (value always en). ListingCard/ListingDetail/MyListings display province via provinceLabel. applyFilters search haystack now includes the Thai province name (searching ภูเก็ต finds 'Phuket' listings). Build OK. Push queued behind card batch (shares ListingCard.jsx).
- English map -> OpenFreeMap Bright (owner decision late 2026-10-17, minutes after deferring it): added deps maplibre-gl@^6.14.0 + @maplibre/maplibre-gl-leaflet@^0.1.4 (named export maplibreGL verified in dist ESM). mapTiles.js rewritten: createBaseLayer(lang) — TH: OSM raster tileLayer (unchanged); EN: maplibreGL({style:'https://openfreemap.org/styles/bright', attributionControl:{compact, customAttribution OpenFreeMap/OpenMapTiles/OSM}}); imports maplibre CSS. Consumers MapView/LocationPicker (tileRef effect) + ListingDetail (mini-map) switched to createBaseLayer. Local build OK (bundle bigger). Push AFTER the 9-file batch lands; watch Vercel install (package.json pushed; lock is 72KB — push via github.dev only if install fails). Live-verify: EN map renders Bright with "Bangkok" Latin labels, pins/popups still work, TH map unchanged.
- Completion batch (commits 0af3975 listings, 286910c PostListing, 34316da ListingDetail, c5fb34c MyListings, feb1281 i18n Thai default): all landed. The /post object-render crash risk is fixed (options now p.en strings).
- ⚠ SHIM INCIDENT: ListingDetail referenced createBaseLayer before mapTiles had it -> 3 Vercel builds failed; the push agent improvised a raster shim createBaseLayer in mapTiles.js (af1513b broken brace, fixed 35b256d) wrapping tileConfig. Site recovered (deploy Ready, pages load). GitHub mapTiles = tileConfig + shim until the map batch's full replace lands. Map batch order set to avoid repeats: package.json -> MapView -> LocationPicker -> mapTiles LAST.
- LIVE CHATS (Bill request late 2026-10-17): (1) listing-page live chat — guests with NO account can real-time chat the owner (guest key in localStorage; owner answers in Inbox -> Live tab); (2) group chat — floating button on home page, presence online count, guests post under a nickname. Rules: text/links/emoji only (no upload UI), chatFilter.js blocks EN+TH profanity + >1 link, 500-char cap, ALL live chat wiped daily 02:00 ICT via pg_cron 'wipe-live-chats' (19:00 UTC) in migration10. Files: migration10_live_chat.sql, lib/liveChat.js, lib/chatFilter.js, components/GroupChat.jsx, components/ListingChat.jsx, Inbox.jsx (Live tab), Home.jsx (mount), ListingDetail.jsx (mount), i18n chat_* keys, index.css chat styles. Local build passes. DEPLOY ORDER: migration10 in SQL editor FIRST, then code push. Privacy note: listing convs are UUID-addressed, permissive RLS — quick-chat, not private (inbox is the private channel).
- MAP BATCH DONE+VERIFIED (commits a922ccd package.json, e3a8e75 MapView, af43f4a LocationPicker, eced02e mapTiles, +fixes 21f4c8d style URL -> tiles.openfreemap.org, a41cc5a MapLibre worker setup). EN Bright map renders live w/ Latin labels incl. street-level BKK; TH OSM unchanged. Local mapTiles.js synced to the fixed GitHub version. Screenshot artifact for Boss could NOT be saved (browser died at session end) — retry in the chat deploy task.
- CSS var fix (68129ca): chat block vars corrected to teal/gold names; navy header + pale-blue bubbles verified live. NOTE: this project's vars are --teal-900/700/600/100, --gold-500/600, --ink-soft, --line, --radius — never --navy/--green/--muted/--tint/--blue.
- CSS STRUCTURE FIX (29ceb40): the part-2 web-editor append had landed INSIDE the last @media 640px block (its final 4 rules + } sat after the chat block at EOF, so chat styles only applied <=640px). Fixed by moving those 4 rules + brace to before the chat comment. Verified at desktop width: FAB green pill bottom-RIGHT, panel navy, anchored bottom-right. GitHub index.css tail now matches local exactly (648 lines).
- LIVE CHATS FULLY DONE + E2E VERIFIED 2026-10-18 ~01:00-02:00 MDT: group chat posts/realtime/presence/filter all proven on the live site; test rows deleted. Listing chat + Inbox Live tab deployed but NOT E2E-tested (needs a real listing + second party).
- Screenshot of Bright BKK map for Boss: PDF saves failed repeatedly in browser tasks; PNG attempt dispatched as final night task.

## 2026-10-18 — Province lock + footer padding fix (DEPLOYED + VERIFIED LIVE)
- Province filter (owner's spec): new dropdown in SearchBar (All provinces + 77, bilingual labels, value = EN canonical), filters.province in Home DEFAULT_FILTERS, applyFilters province condition in listings.js, all_provinces i18n EN/TH.
- Bounds: PROVINCE_BOUNDS in src/lib/format.js — [s,w,n,e] per province computed from GADM ADM1 GeoJSON (76 auto-matched by normalized name; Bangkok = GADM "BangkokMetropolis" hand-mapped); provinceBounds() returns Leaflet [[s,w],[n,e]].
- MapView province prop: flyToBounds (padding 14, 0.9s), then after 950ms setMaxBounds(bounds.pad(0.03)) + maxBoundsViscosity 1.0. Pan-only lock — zoom untouched per owner's clarification. Clearing the filter removes maxBounds.
- Search box: typing an exact province name (EN case-insensitive or TH exact) engages the province filter (Home useEffect on filters.query).
- Footer fix (after first solo upload failed with no change): .footer padding 1rem 1rem 6rem so the floating chat pill can't cover the LINE button at page bottom.
- Commits (all "Province lock + footer padding fix"): format 6fbbe07, listings b60e54b, i18n 17b64c8, SearchBar 0002d67, Home 021b82c, MapView 4417111, index.css 97a9d6c.
- Live verification ALL PASSED: footer clear at bottom; dropdown present with 78 options; Phuket select → fly + frame island; 3 northward drags refused; zoom in/out normal; unlock via Clear → free roam; typing "Phuket" re-engaged filter + fly; Clear reset everything.

## 2026-10-18 — 30-day expiry + auto-renew credits + share bar (DEPLOYED + VERIFIED LIVE)
- Migration 12 ran clean (verification: listing_cols=2, credit_col=1, cron_active=1, trigger_count=1; cron job id 3 'auto-renew-listings' 0 20 * * * UTC = 03:00 ICT).
  - listings.expires_at + auto_renew; profiles.credit_baht.
  - Trigger trg_listing_expiry: approval (INSERT or status→approved) sets expires_at = now()+30d. Renewals/edits keeping 'approved' do NOT restart it.
  - process_auto_renewals(): daily; auto_renew + due within 1 day (or expired) + credit>=1 → charge ฿1, expires_at = greatest(expires_at, now())+30d.
  - admin_add_credit(target, amount): SECURITY DEFINER, checks caller is_admin.
- Code (commits "30-day expiry, auto-renew credits + share bar"): listings 96f2cb9 (public fetch gt expires_at; isExpired/daysLeft/renewListing — renew touches ONLY expires_at so no re-pend), useProfile 7aa3965 (credit_baht), i18n e02350f, MyListings dc2bbf4 (credit strip + expiry lines + Renew buttons), PostListing 809bae0 (auto_renew field; checkbox greyed when credit<=0 unless already on; payload includes auto_renew), ListingDetail 0a547a4 (share box FB/Messenger/LINE/native + copy bar; expired banner + owner Renew link), Admin 1709cfb (Member credits section), index.css 1916b57 (full-file replace to append safely, +47/-0).
- Phase 3 tests ALL PASSED with temp listing bea3e52f: insert approved → expires exactly +30d (trigger); share box + Copy → 'Copied ✓'; expires_at set to past → homepage 0 properties + direct open shows expired banner; credit 5 + auto_renew + processor run → credit 4 (exactly ฿1), expiry extended ~30d; cleanup verified listings=0, admin credit=0.
- Follow-up (owner request, same day): Admin credits made SEARCH-ONLY — no names until a search matches (Admin.jsx creditSearch/matchedMembers + 2 i18n keys); pushed separately.
- Live-chat separation (owner asked): listing chats are per-conversation rows (one guest + one listing, UUID); Inbox Live tab lists them separately; only the homepage group chat is shared. No change needed.

## 2026-10-18 (afternoon) — Admin Members pages DEPLOYED + verified
- migration13_admin_members.sql RAN (admin_delete_user verified, count=1).
- 6 commits "Admin Members inspection pages": AdminMembers.jsx (da83fe9),
  AdminMemberListings.jsx (88a5ef3), App.jsx routes (0a37309), Admin.jsx
  Members link (3dd90c6), index.css members styles (2dcdbfb), i18n (5e1ccf1).
- Verified at source: raw index.css tail = members block at true EOF,
  .lang-btn intact (a mid-file append attempt during the task was never
  committed), members_title x2 in i18n, /admin/members route in App.jsx;
  live /admin/members shows the admin-only notice logged out.
- FOUND (pre-existing): GitHub index.css has .msg-new trapped INSIDE the
  @media (max-width:640px) block (~line 544) since the messaging deploy —
  the Inbox NEW badge is unstyled on desktop. Fix queued in the
  contact-lock batch (remove stray block, re-append at EOF). Local
  index.css has .msg-new correctly at top level. NOTE: GitHub index.css
  section ORDER diverges from local — targeted edits only, never
  full-file replace index.css from local.
- Logo V2 (green pin) chosen by owner; public/logo.svg + Navbar img +
  favicon wired locally, ships in the contact-lock batch. Big LINE
  version (2048px, circle-crop-safe composition) delivered to owner.
- Search placeholder changed per owner pick: EN "Search by keyword,
  e.g. pool villa, near BTS, beachfront…" / TH mirror — ships in the
  contact-lock batch (with expired_contact_hidden keys).

## 2026-10-18 — Delete-user wall found by owner; fix built (migration15)
- Owner tried deleting a duplicate test account from Members and got
  "Direct deletion from storage tables is not allowed. Use the
  Storage API instead." — migration13's admin_delete_user deleted
  photos via SQL on storage.objects, which Supabase forbids.
- migration15_fix_delete.sql (built, queued to run next): replaces
  admin_delete_user WITHOUT the storage SQL delete; adds storage
  policy "admins can delete any listing photo" so the Members page
  can remove photos via the Storage API before calling the RPC
  (AdminMembers.jsx patched the same way); also replaces
  delete_inactive_accounts (migration8 had the same bug — its monthly
  cron would have failed silently from Oct 2028; auto-deleted
  accounts' photos now stay orphaned by design, noted in the file).
- Screenshot also CONFIRMED: Members page works logged-in (4 members,
  2-col grid, stats strip), and the navbar still shows the OLD ⌂ mark
  (logo batch in flight at screenshot time).

## 2026-10-18 — Contact lock + Thailand fence + logo batch DEPLOYED + verified
- 8 commits "Contact lock, Thailand fence, logo": logo.svg 9e5f568,
  index.html favicon 2f420f9, Navbar img 06ca371, index.css d730817
  (brand-mark rules + .msg-new rescued to EOF, exactly 1 copy),
  format.js THAILAND_BOUNDS c074a6e (cosmetic: no blank line before
  the comment — harmless), MapView fence 27b5e49, i18n 8e0f299
  (placeholder + expired_contact_hidden x2), ListingDetail 90c6eb2
  (contactLocked x8 + Messenger desktop copy fallback).
- Verified: raw checks all passed; live /logo.svg 200 + navbar logo +
  new placeholder; map dragged SW x4 stayed fenced to Thailand, zoom
  normal; expired-lock E2E with temp listing 6e821430 (banner + note
  shown, NO phone/LINE/form/chat logged out), cleaned, count 0.

## 2026-10-18 — truepinproperty.com CONNECTED (domain bought by owner at Porkbun)
- Vercel: truepinproperty.com (Production) + www (308 -> apex) added;
  required DNS: A @ -> 216.198.79.1, CNAME www ->
  510cd6b2e106e06e.vercel-dns-017.com.
- Porkbun DNS set (TTL 600), parking ALIAS removed. A wildcard CNAME
  *.truepinproperty.com -> uixie.porkbun.com (Porkbun parking) refused
  deletion (3 attempts) — harmless: explicit www record wins; only
  random subdomains would land on parking. MX/TXT kept (email fwd).
- Both domains validated in Vercel, SSL issued; https://
  truepinproperty.com loads; www redirects; vercel.app still works.
- Supabase Auth URLs: Site URL https://truepinproperty.com; redirects
  = vercel.app/**, truepinproperty.com/**, www.truepinproperty.com/**.
  /login (Google button) + /privacy-policy verified on the new domain.
- Process note: first connection attempt wedged at Porkbun's device
  code step; the restart checked state first and finished clean.
  BROWSER LESSON (also in AGENTS.md): browse continuations/answers
  need the full "browser-task:<uuid>" id.
- Member delete fix (migration15 + commit 0beed77) deployed + verified
  earlier today; FK audit: all 19 FKs CASCADE/SET NULL.

## 2026-10-18 — Announcement broadcast DEPLOYED + verified
- migration14 RAN: messages.no_reply column + admin_broadcast(body,
  p_no_reply) — both verification counts = 1.
- Commits "Admin announcement broadcast": i18n 79a1030 (announce +
  support keys EN/TH), Admin.jsx 6fe1770 (announce box w/ no-reply
  checkbox at top of Moderation), Inbox.jsx cc0d122 (reply gating +
  support_chat labels in Live tab), index.css 8ab198c (append at EOF).
- Raw checks passed; homepage on truepinproperty.com loads. Sending
  an announcement E2E still needs the owner's admin login (backlog).

## 2026-10-18 — Support live chat DEPLOYED + guest E2E passed
- Commits "Support live chat on Contact page": SupportChat.jsx NEW
  e30b1de, liveChat.js support helpers 5b164f7, Contact.jsx fe0e4f7.
- /contact renders the chat box logged out (TH heading); guest test
  messages landed as live_conversations rows (listing_id NULL, owner
  = admin) + live_messages; cleanup verified 0/0 in both tables.
- CAVEAT (observed once): the first test message was saved to the DB
  but did not render in the chat list on that attempt (subscription
  attach race at conversation creation); the repeat rendered
  instantly. A refresh always shows saved messages. Watch with real
  users; fix = refetch after first send if it recurs.
- QUEUE EMPTY: everything from 2026-10-18 is live — members pages,
  delete fix (migration15), contact lock + Thailand fence + logo +
  placeholder + msg-new rescue, domain, broadcast (migration14),
  support chat. Remaining backlog is login/listing-gated only.

## 2026-10-18 (evening) — Terms/WhatsApp batch, mortgage calculator, branded email, picker search
- BATCH 1 DEPLOYED + VERIFIED LIVE: migration16 (profiles.whatsapp/telegram); /terms page EN+TH (owner-approved text); signup gate (HouseRules welcome + required agree checkbox gating email form AND Google button); rules box on post form; WhatsApp/Telegram profile fields + listing buttons (wa.me with 0->66 conversion, t.me). Commits e365623..4f5c6e2. i18n local re-synced from GitHub before push (positional drift only).
- BATCH 2 DEPLOYED + E2E VERIFIED: MortgageCalculator on sale listings (defaults 30% down / 3% / 30y; live recalc; first-month principal/interest split; total interest; EN+TH). Temp ฿39M listing proved ฿115,098/mo 41/59 split, down 0% -> ฿164,426; test listing deleted (count 0). Commits 5ec37a6..93d97a9.
- BATCH 3 DONE + GMAIL-VERIFIED: Resend account (Google sign-in, user approved prompt 55 on his tablet); truepinproperty.com added + Verified in Resend; Porkbun DNS +4 records (TXT resend._domainkey DKIM, CNAME rsend->rsend.forge.rmta.net, CNAME send->send.forge.rmta.net, TXT _dmarc v=DMARC1; p=none;) with all 8 pre-existing records intact (12 total); API key "Supabase SMTP" (Sending access) pasted by the USER into Supabase SMTP (never recorded anywhere); Supabase SMTP: sender TruePin Property <noreply@truepinproperty.com>, host smtp.resend.com:465, user resend; Confirm-signup + Reset-password templates replaced with approved bilingual branded HTML. Test signup reached check-email; test user deleted. PROOF read in Gmail: From "TruePin Property <noreply@truepinproperty.com>", subject "Welcome to TruePin Property — confirm your email / ...", body = approved template EN+TH.
  - Note: Porkbun DNS editor froze the first attempt (no changes made); fresh task succeeded. Browser agent cannot paste clipboard secrets (no Ctrl+V) — the user pasted; pattern for future secret-into-form steps.
- BATCH 4 (queued after batch 3): LocationPicker rewritten — Nominatim place search (countrycodes=th, accept-language follows UI, debounce 500ms, Enter prevented from submitting the form) + flyToBounds/flyTo + GPS button (geolocation, zoom 17); PostListing fixes from a real user's failure: form noValidate + step="any" on price/area (Chrome stepMismatch bubble "nearest valid values are 3 and 4" trapped a Thai user who typed a decimal), bedrooms/bathrooms Math.round on save, photo picker replaced with green photo-add-btn label (multiple, hidden input) + bilingual long-press tip. Local build passes.
- BATCH 4 COMPLETE 2026-10-18 ~19:44 MDT: LocationPicker search+GPS (commit 1f9cdb6, full replace), i18n keys via Object.assign EOF blocks (62f8074 — that job's editor could not do mid-file edits; functionally equivalent, local i18n re-synced FROM GitHub), CSS append (c3beebf), PostListing full-file replace (ed28d9d) after the first attempt skipped it — diff verified: only the 6 intended areas (noValidate, Math.round bed/bath, step="any" x2, photo-add-btn label, multi hint). Nominatim check: "หนองหาน" returns Nong Han District + sub-district results.
- FIRST REAL LISTING LIVE 2026-10-18 18:41 MDT (verified by direct public-API query): "บ้านน๊อคดาวไม้สักทั้งหลัง, Portable house Teak", Udon Thani, ฿120,000, sale, status approved — posted by the Boss's friend (the Nong Han user whose screenshot showed the decimal error) and approved. The full pipeline (signup -> post -> approval -> public) has now worked end-to-end with a real user.
- QUEUE EMPTY again. Remaining verification backlog: rejection-with-note E2E, two-account inbox messaging E2E, announcement real-send test, listing live-chat E2E (now possible — a real listing exists).
- GOOGLE MAPS LINK (2026-10-18 ~20:25 MDT, DEPLOYED + LIVE-VERIFIED): under the listing mini-map, "Open in Google Maps / เปิดใน Google Maps" link -> https://www.google.com/maps/search/?api=1&query=<lat>,<lng> (new tab). Commits a3092b0 (i18n Object.assign gmaps_open), d8200ab (.gmaps-link CSS), 8fc8c74 (ListingDetail full-file replace; diff = only the map region). Verified on the live land listing: href query=17.3996018,103.0160802 = the pin. NOTE: deploy agents' press tools can't send Ctrl+H — find/replace unreliable; full-file replace + EOF appends are the dependable routes (also in AGENTS.md). Live listings now: 2 (teak house ฿120,000 + garden land ฿1,992,000, both Udon Thani, approved).
- CALCULATOR TITLE (2026-10-18 ~20:34 MDT): Thai mtg_title changed from คำนวณสินเชื่อบ้าน (home loan — too narrow) to คำนวณสินเชื่อ (generic "loan calculator", owner's pick from 3 options; EN stays "Mortgage calculator"). Commit b0635e0 — Object.assign(th) override appended at i18n EOF; live-verified heading "🏦 คำนวณสินเชื่อ" on the land listing. Local i18n matches (same EOF override appended).
- PROFILE/AVATARS BATCH (2026-10-18 night): migration17 ran + verified (profiles.avatar_url, pending_display_name, name_requested_at; request_display_name + admin_review_name_request RPCs — approval sends an Inbox message either way; guard_display_name trigger blocks direct renames of existing names). Code ALL committed + diff-audited: deps nsfwjs/tfjs (b3a8abc), avatarCheck.js (4420c95, MobileNetV2 lazy chunk, block Porn/Hentai>=0.45 or Sexy>=0.80, fail-closed), Profile.jsx NEW (e1e759c), App /profile route (af145df — note: the editor collapsed some JSX formatting; local App.jsx re-synced from GitHub), Navbar avatar link (e679ba3), useProfile select (b8519cc), listings joins (e894d10), ListingDetail light Option-A card + seller avatar head + pills (6a0b06d), Admin name-request queue (3f4c030), i18n profile block (8e007a0 — landed mid-file at 871-920, seams clean, Object.assign so position-independent, Vercel build passed), styles as NEW src/profile-avatars.css (dd86628) imported by main.jsx (8cf8b28) because the editor's append-to-index.css is broken (inserts mid-file at caret). /profile logged-out redirect verified.
- PER-LISTING CONTACTS (migration18): listings gained phone/line_id/whatsapp/telegram; backfill copied profile contacts (both live listings now carry 0927106375 on the listing row). Code committed + audited: listings.js join slimmed to (display_name, avatar_url) ff08d45; ListingDetail seller merge from listing ebcf83d; PostListing per-post save + no profile write-back + edit-prefill from listing + new-post profile prefill gated !isEdit (8adb96f); Profile hint e8e47a7; i18n profile_contact_hint 90a4cf7 (at true EOF after two discarded mid-file attempts).
- ⚠️ VERCEL RATE LIMIT (2026-10-18 ~22:00 MDT): Hobby plan daily deployment cap hit — deployments for 8cf8b28..90a4cf7 FAILED with "Deployment rate limited — retry in 24 hours." Live site still serves the dd86628 build (new card markup, OLD dark styling, contacts still from profile). Everything is committed and verified at source; only the deploy is pending. One-time cron 'truepin-vercel-redeploy' set for Mon 2026-10-19 22:45 MDT to redeploy + verify + report. LESSON: conserve deployments — batch commits into fewer pushes on big days.
- VERIFIED ACCOUNTS (2026-10-19, Bill's design): migration19_verification.sql (profiles.is_verified/verification_status/verification_photo_path/verification_requested_at; PRIVATE storage bucket 'verification-photos' with own-folder insert/read/delete policies + admin read policy; guard_verification trigger silently reverts direct is_verified changes and any status change except owner→'pending'; admin_review_verification RPC sets app.verification_review flag, flips status, sends bilingual Inbox message). Client: NEW src/components/VerifyAccount.jsx (getUserMedia live camera only — no file picker; selfie holding ID; compressImage; upload to private bucket; retake replaces photo). Profile.jsx mounts it between name and contact cards. Gate: ListingDetail computes canSeeContacts (owner | admin | viewer.is_verified via useProfile) — pills hidden otherwise, .verify-gate box shows (Log in / Verify buttons); seller name gains ✅ Verified tag when seller.is_verified (listings.js joins + is_verified). PostListing: required consent checkbox gates the submit button (post_consent i18n). Admin.jsx: 'Account verifications' queue with signed-URL photo thumbnails (createSignedUrl 600s) + Approve/Reject via RPC. i18n verify_*/gate_*/post_consent/admin_verify_* EN+TH appended; styles appended to src/profile-avatars.css (.verify-gate, .verified-tag, .camera-box, .verify-thumb, .consent-row). Local build PASSED 2026-10-19 ~15:58 MDT. Decisions: posting stays open to all members (Bill); photo = selfie holding ID card and email placement = registration confirm email (Nicole's picks under his delegation). Deploy order matters: migration19 MUST run before the code deploys (useProfile selects is_verified — a missing column breaks profile loads). Email template statement added separately in the Supabase dashboard (no deploy needed).
- VERIFICATION ADDITIONS (2026-10-19, Bill, built same day): migration20_contact_views.sql — (1) profiles.verification_id_photo_path: verification is now TWO live-camera photos (ID card/driver license/passport itself + selfie holding it); VerifyAccount.jsx rewritten as two slots (doc uses rear camera, selfie front; fallback to any camera). Both photos in the private bucket; admin queue in Admin.jsx now shows BOTH thumbnails labeled (signed URLs). (2) contact_views table (listing_id, viewer_id, viewed_at; RLS insert-own only, NO select policy) + listing_contact_views(p_listing) RPC (owner/admin only; returns viewer name + profile phone/LINE/WhatsApp/Telegram + time — NEVER photo paths). ListingDetail logs a view (once per browser session) when a verified non-owner non-admin sees the pills. MyListings gains a per-listing '👁 Who viewed' toggle rendering the RPC rows. Privacy line (Bill): verification submission details are ADMIN-ONLY, always; owners see only who/when + that member's ordinary contact info. Local build PASSED ~16:44 MDT. migration20 must run AFTER migration19; code must not deploy before BOTH migrations (useProfile selects is_verified from m19; contact_views insert from m20 would fail silently at runtime if missing — it is a fire-and-forget insert, non-fatal).
- VERIFICATION SIMPLIFIED (2026-10-19, Bill: "we are not the bank, just camera is good enough"): the ID-document step is REMOVED. Verification = ONE live camera selfie, no ID card/driver license/passport anywhere. VerifyAccount.jsx rewritten back to the single-photo flow; Admin queue shows the single photo again; i18n verify_explain/verify_camera_tip reworded (no ID mentions); migration20 revised — it no longer adds verification_id_photo_path and instead replaces admin_review_verification with camera-only rejection wording (same logic). The migration20 doc/selfie i18n keys (verify_doc_*, verify_selfie_*, admin_id_photo, admin_selfie_photo) remain in i18n.jsx but are now UNUSED/harmless. Contact-view history (contact_views + listing_contact_views RPC + MyListings panel) is UNCHANGED by this simplification. Local build PASSED after the simplification.
- MIGRATION 19 RAN + VERIFIED (2026-10-19 ~16:45 MDT): both batches 'Success. No rows returned'; checks confirmed 4 columns (is_verified, verification_photo_path, verification_requested_at, verification_status), bucket verification-photos public=false, functions admin_review_verification + guard_verification present. (Note: the SQL the agent ran carries the ORIGINAL migration19 rejection wording mentioning ID cards — migration20 replaces that function with camera-only wording; the site collects no ID regardless, since the client flow is selfie-only.)
- MIGRATION 20 RAN + VERIFIED (2026-10-19 ~16:52 MDT): contact_views table exists; listing_contact_views + admin_review_verification present; rejection text confirmed camera-only; extra proof: zero function bodies in the DB mention 'ID card'.
- THAI LAND UNITS (2026-10-19, Bill): migration21_land_area.sql adds listings.area_rai (int), area_ngan (int), area_tarangwa (numeric) + backfills the garden land (954e99…) to 12 rai / 0 ngan / 77 tw / 19508 sqm from its description (its area_sqm was 0). Client: format.js gains formatArea(listing, t, withSqm) (rai/ngan/tarang wa parts, zero parts skipped, optional sqm total in parens; falls back to plain sqm). PostListing: when property_type==='land' the bed/bath/area row is replaced by three inputs (Rai / Ngan max 3 / Tarang wa) + a live 'Total area: N sqm' hint (rai*1600 + ngan*400 + tw*4); payload stores the three parts + computed area_sqm, and zeroes bed/bath for land; non-land posts store NULL parts. ListingDetail fact row + ListingCard chip render via formatArea. i18n unit_rai/unit_ngan/unit_tarangwa/area_total EN+TH. Local build PASSED ~17:15 MDT. Push plan: these files ride push part 2 together with the verification batch (ListingDetail/PostListing carry both).
- ⚠️ CSS PATH ACCIDENT (found 2026-10-19 ~17:05 MDT by the P1 push audit): on GitHub, src/profile-avatars.css is a DIRECTORY containing profile-avatars.css — the flat file does not exist, while main.jsx imports './profile-avatars.css'. Every build including the import (8cf8b28 onward) would fail to resolve it; the rate limit masked this because those builds never started. Fix task dispatched: create the flat file with the nested file's exact 43 lines, delete the nested copy, raw-verify. Local src/profile-avatars.css is a proper file (superset incl. unused .verify-slot rules — harmless).
- CSS PATH FIXED (2026-10-19 ~17:12 MDT): flat src/profile-avatars.css created on main (791cc76) with the nested file's exact 43 lines; nested copy deleted (7792f5e); raw flat URL 200 with .contact-pill + .verify-gate, nested 404; main.jsx untouched. Local file re-synced FROM GitHub (local had been a 51-line superset — now the 43-line truth + the 4 P3 lines appended identically).
- MIGRATION 21 RAN + VERIFIED (2026-10-19 ~17:17 MDT): area columns live; garden land = 12/0/77/19508 exactly.
- PUSH PART 2 DONE (2026-10-19 ~17:33 MDT, all diffs audited clean): 7d00f7e format.js formatArea (one trailing EOF blank line dropped — accepted as harmless), 098e248 ListingCard, 788bd02 ListingDetail (gate + view log + badge + land), 9dd10c8 PostListing (land boxes + consent), cf70e59 i18n land keys appended at true EOF (1013 lines). Newest main cf70e59. Part 3 (Admin queue, MyListings views, CSS extras) dispatched next.
- PUSH PART 3 DONE (2026-10-19 ~17:39 MDT): 6dda065 Admin verify queue, e66db95 MyListings views panel, 92ff3d4 CSS extras — all pure additions, diffs clean. Newest main 92ff3d4.
- ⚠️ LOCAL DRIFT FOUND (2026-10-19 ~17:41 MDT): local Admin.jsx/MyListings.jsx contain a DIFFERENT (pre-compaction) verification implementation than GitHub's — local reviewVerification calls the RPC with WRONG params ({target, approve} vs the DB's p_user/p_approve) and local views code differs in shape. GITHUB IS THE SHIPPING TRUTH and its params are correct. Two follow-ups: (1) GitHub Admin.jsx reviewVerification referenced a nonexistent setError — one-line fix to window.alert dispatched (commit pending); (2) after that lands, re-sync local Admin/MyListings/ListingDetail/PostListing/format/i18n FROM GitHub raw so local mirrors production again. ListingDetail/format/PostListing diffs vs GitHub are cosmetic only (import order, catch indent, — vs –).

## MODERATOR ROLE (2026-10-19, Bill's approved design — BUILT LOCALLY, NOT DEPLOYED)
- New tier between member and admin. Moderators CAN: approve/reject listings with a note on the Moderation page; post their own listings live with no approval wait; edit their own listings without re-approval. Moderators CANNOT (admin-only, unchanged): add credit, delete/ban members, promote/demote moderators, send broadcasts, approve face-photo verifications, review display-name requests.
- migration22_moderators.sql (NOT run on live yet — MUST run before the code deploys, same rule as migration19, because useProfile now selects is_moderator):
  - profiles.is_moderator boolean not null default false.
  - admin_set_moderator(p_user, p_flag): SECURITY DEFINER, admins-only (raises 'admins only'); sets the transaction-local flag app.moderator_change.
  - guard_moderator trigger (mirrors migration19's guard_verification): silently reverts any direct is_moderator change not made through the RPC — needed because "users manage own profile" would otherwise let anyone self-promote via the API.
  - trg_listing_auto_approve (BEFORE INSERT OR UPDATE on listings, function auto_approve_privileged_listing): if the listing OWNER is admin or moderator, INSERTs land as 'approved'. On UPDATE it only intervenes for the seller re-pend path (auth.uid() = owner_id AND new status = 'pending'), so an admin rejecting a moderator's post (different uid, 'rejected') still sticks, and renew/ban/credit updates (no 'pending') pass through. Trigger name sorts BEFORE trg_listing_expiry so the status is already 'approved' when the expiry trigger checks; the function also sets expires_at = now()+30d itself on any transition into 'approved' (INSERT or old status ≠ approved), exactly mirroring migration12 — so an auto-approved insert gets its 30-day clock, and edits that stay approved do NOT restart it.
  - RLS (all additive permissive policies — member behavior unchanged): "moderators can read all listings" (SELECT any status), "moderators manage listings" (UPDATE, mirrors the admin policy; no DELETE), "privileged owners can insert listings" (INSERT for admin/moderator owners, banned still blocked). WHY the insert policy exists: Postgres evaluates WITH CHECK against the row AFTER BEFORE triggers run, so migration3's `status='pending'` insert check would have rejected every trigger-approved moderator post, and the owner-update `status='pending'` check would have rejected moderator edits (the moderator UPDATE policy covers that path the same way).
- Code (local build PASSED 2026-10-19):
  - useProfile.js: selects is_moderator.
  - Navbar.jsx: Moderation link now shows for is_admin OR is_moderator.
  - Admin.jsx: page admits moderators; a moderator loads ONLY the pending queue + seller names (loadModQueue — no reports/banned/credits/name/verification data is even fetched); the announce box, name-request queue, verification queue, reports, banned list, member credits and the Members header link are all wrapped in isAdmin so moderators never render them. approveListing/confirmReject refresh through the role-appropriate loader. Admin view otherwise unchanged (reviewVerification window.alert handling preserved). /admin/members + /admin/member/:id remain admin-only via their existing page-level is_admin gates — no route change needed.
  - AdminMembers.jsx: rows gain a Moderator badge (status-badge is-pending style) and a Make moderator / Remove moderator button (admin rows excluded, same as ban/delete) calling the RPC and reloading. Local file was re-synced FROM GitHub first (drift was 3 stray blank lines only).
  - PostListing.jsx: NO change — its single shared payload hard-codes status:'pending' for create and edit, and the BEFORE trigger overrides NEW.status server-side in both cases (verified by reading the payload + update/insert paths).
  - i18n.jsx: Object.assign block at true EOF — mod_make/mod_remove/mod_badge EN+TH.
- STILL PENDING (next session, in order): run migration22 on the live 'homes-portal' project → push the 5 code files (useProfile, Navbar, Admin, AdminMembers, i18n) → deploy → THEN promote the first three moderators from the Members page (or admin_set_moderator): Nick Tanapat (tanapat.montatip@gmail.com), อาภาพร ราชอุดร / Arpapon Radudon (arpaponradudon@gmail.com), Jen (jenniferradudon@gmail.com). Nothing above is live yet.

## 2026-10-19 night — Redeploy verified + 4-test E2E session (cron truepin-vercel-redeploy)
- REDEPLOY: not needed — Vercel had already deployed newest main 30e3072 ("Admin: fix verification error handling") Ready/Production at 17:51 MDT Oct 19 (92ff3d4 also Ready). Live markers vs the 0/0 baseline: CSS .contact-pill x2 + .verify-gate x2; JS profile_contact_hint x3 + verification-photos x3. Profiles/per-listing-contacts/verified-accounts batch is LIVE. Guest check of garden land 954e9971: white contact card, round initial avatar, phone hidden behind the verify gate (EN+TH gate text captured). NOTE: that listing's seller now displays "Chakkraphan Radudon" (member radudon1991@hotmail.com, 2 live posts incl. the Phuket house) — the job brief's expected "Thai-Real-Estate-Agent" is stale, not a bug.
- ADMIN ACCESS FACT: "Continue with Google" in the shared browser profile lands directly as Admin (no chooser, no password) — this is how the login-gated tests ran. Pending listings show exactly "Listing not found." to everyone but the owner (no message form/chat) — approval is a hard prerequisite for messaging/chat tests.
- TEST 3 REJECTION NOTE: PASS end-to-end — admin rejected throwaway a34335fd with a note; seller saw it on My Listings + listing page + edit form ("Please fix the following and resubmit:"); edit cleared it + re-pended; admin approved; guest saw it public (homepage briefly "5 properties").
- TEST 1 INBOX MESSAGING: PASS — B->A message ("✓ Message sent."), A Inbox badge 1 + NEW, A replied, B saw the exact reply.
- TEST 2 LISTING LIVE CHAT: PASS — guest (auto-name "Guest 9BDB"; no nickname prompt on listing chat) message appeared after ONE refresh (known quirk — saved immediately); profanity blocked with "That message was blocked — please keep the chat clean."; owner saw the conversation in Inbox -> Live chats (profane message absent) and replied; guest saw the reply tagged "TP Test A· Seller".
- TEST 4 ANNOUNCEMENT: NOT SENT — the cron body contained no ANNOUNCEMENT TEXT section, so no Boss-approved wording exists. Send is staged; admin path proven ready. Needs Boss's exact bilingual text.
- CLEANUP: UI deletes are BLOCKED for browser automation — Members "Delete user" and My Listings "Delete" both rely on native window.confirm(), which the automation layer dismisses (clicks land, no dialog/error, nothing deletes). Listing removed instead via Supabase REST as its owner (DELETE listings -> 1 row; verified gone). Cascades: live_conversations/live_messages for the listing = gone; the 2 test inbox messages survive with listing_id=NULL (FK SET NULL; messages table has no DELETE policy) inside the test accounts only. FINAL approved set == pre-test snapshot exactly (4 real: 954e9971 land, 75589ce7 knockdown, ae2cca0f Phuket house, 7cf4dc0d โฉนดพร้อมโอน). STILL PENDING FOR BOSS: delete TP Test A (radudon1991+tp-a@gmail.com) + TP Test B (radudon1991+tp-b@gmail.com) from Moderation -> Members (in-person confirm click; also removes the 2 orphaned test messages). Members count stands at 8 (6 real + 2 test).
- LESSON: any future automation needing deletes must use the REST/API route or an in-person click — native confirm() dialogs are a hard wall for the browser agent.
