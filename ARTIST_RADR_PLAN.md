# Artist RADR — Plan & TODO

**Last updated:** 2026-11-28 (public Spotify follow step: 403 "not registered" traced to Development Mode, not to code; follow-targets work and an honor-mode alternative sit on branches; campaign work is now in `main`; playlist submission verification rollout still pending)
**Companion file:** `ARTIST_RADR_STATUS.md` (current state, commands, env, handoff)
**Product brief:** the original "Artist RADR — Product Vision & Development Brief" still applies, with the changes recorded in section 1.

---

## Progress at a glance

| Phase | Area | Status |
|---|---|---|
| 0 | Audit (code + Supabase) | Mostly done |
| 1 | Studio app shell on `studio.artistradr.com` | **Done. Live since 2026-11-23.** Login still lands on `/admin` |
| 2 | Playlists (Spotify first) | **Done for Spotify.** Search with release dates, draft editor, review, approve, sync, conflict detection and activity log all working. Apple Music undecided |
| 3 | Discovery | **Done for now.** Manual candidates, review and accept-into-draft. Instagram dropped 2026-11-25 |
| 4 | RADR Studio modules (artwork, spotlights) | Not started |
| 5 | ~~Publishing~~ | **Removed 2026-11-24** (Buffer and the Publishing module). Staff post to social by hand outside Studio |
| 6 | RADR AI | Not started |
| 7 | Friday automation | Not started |
| 8 | Magazine & RADR Originals | Posts admin moved into Studio at `/studio/magazine` (2026-11-25, untested). Editor upgrades and Originals not started |
| 9 | Artist campaigns and billing | **Built and in `main` (checked 2026-11-28). Run locally and reported working (2026-11-26), except the payment work, the daily plan and Supercharge second song, and the preview changes of the same day, which are not yet re-checked. Deploy state not checked.** Account area, Billing page, campaign flow, **Daily and Supercharge plans**, Studio Campaigns tab (plan, paid or unpaid, second song), campaign playlists, Campaign playlists page, preview redesign with Renew. Paystack checkout with USD→NGN conversion, Unpaid label and delete for unpaid campaigns (function v4 live; **no test payment made yet**) |
| 10 | Partner curators | **Planned, not started.** Placeholder tab on the Campaign playlists page (2026-11-26) |
| 11 | Public submission and Spotify follow step | **In progress.** Submission page split and verification part 1 merged (2026-11-27), not uploaded; verification part 2 not applied. Follow-targets rewrite and Studio "Spotify follows" page on `fix/spotify-follow-targets`, not merged. Development Mode blocks accounts that are not allowlisted (2026-11-28); long-term approach undecided |

---

## 1. Settled decisions

1. **Studio is a separate build of the same repo**, deployed to `studio.artistradr.com`, using the same Supabase project. It is not a copy of the app. (This replaces the brief's "Studio inside the admin" idea.)
2. **One flag controls the build:** `VITE_APP_MODE=studio` (see `.env.studio`). Public build is unchanged.
3. **Studio has its own login** (separate origin, separate session). It uses the existing `/admin/login`.
4. **Staff rule everywhere:** `profiles.role = 'radrStaff'`, enforced by Supabase RLS, inside Edge Functions and inside the draft SQL functions. Browser route guards are convenience only.
5. **Studio uses its own Spotify app**, separate from the public artist follow app. Only `admin@artistradr.com` (Premium) is authorised in it.
6. **Spotify first, Apple Music later.** Apple Music needs a different approach (see section 2).
7. **Tokens never reach the browser.** They live in `connected_account_secrets` (no RLS policies, service role only). Refresh happens server-side in one shared helper.
8. **Local development uses `127.0.0.1:5174`**, not `localhost`, because Spotify rejects `localhost` redirects.
9. **Deploy is manual via cPanel:** build locally, upload `dist-studio/`.
10. **Drafts are the only thing the UI edits.** Nothing reaches a live playlist without a change preview and approval. One open draft per playlist, enforced by a unique index. Any edit to an approved draft cancels the approval.
11. **Draft writes go through SQL functions** (`studio_add_track_to_draft`, `studio_seed_draft_from_tracks`, `studio_reorder_draft`, `studio_approve_draft`, `studio_discard_draft`): security invoker, staff-checked, atomic. Not repeated insert calls from the browser.
12. **Migrations live in the repo.** Anything applied to the remote database must also exist in `supabase/migrations/`.
13. **Sync is built on Spotify's `/items` endpoints**, which were verified in Development Mode on 2026-11-23.
14. **Playlists page layout:** opening a playlist shows the draft editor (with numbered tracks). The live Spotify track list stays hidden until the "Show live tracks on Spotify" button is clicked.
15. **Artists cannot remove or edit sent campaigns.** Only staff approve, set days, attach playlists and remove (2026-11-25/26). **Exception (2026-11-26):** an artist can delete a campaign that is still unpaid and pending; it is marked `removed`, not erased.
16. **Artists pay on Paystack when they send a campaign, before staff review (2026-11-26).** Prices are set in USD. Paystack could not charge USD for this account ("Currency not supported by merchant"), so the server converts the USD price to NGN at the day's rate when the artist clicks Pay now. The USD price, rate and NGN amount are saved on each payment; a payment counts as paid only if Paystack's verify result matches the saved amount and currency. Optional margin (`FX_MARGIN_PERCENT`) and fallback rate (`USD_NGN_RATE`) are server secrets.
17. **Campaign playlists are attached by staff in Studio** by pasting a Spotify playlist link; artists only see cover and link (2026-11-26).
18. **Campaign playlists have their own Studio page** (`/studio/campaign-playlists`), with RADR's own playlists first and a partner curators list added later. The Campaigns tab keeps the same attach panel (2026-11-26).
19. **Partner curators are a future list.** Artist RADR is open to curators with active playlists earning from artist campaigns; nothing is built or stored for it yet (2026-11-26).
20. **Artist campaign page (2026-11-26):** the tracker has two steps, Running then Completed. Artists cannot pause a campaign from their screen. When a campaign is Completed, a Renew campaign button opens the new campaign flow with the same song, goal and platform filled in. Attached playlists show as compact rows with small covers.
21. **Payment labels (2026-11-26):** **Unpaid** = pending with no paid payment; **Pending Review** = paid and waiting for staff. Billing's Awaiting approval total counts paid campaigns only; unfinished checkouts read "Not completed".
22. **Campaign plans (2026-11-26, set by the editor):** artists choose **Daily** (a daily spend of $2.99 to $14.99 for 7 to 30 days; total = spend × days; targets start at 2 to 3 playlists and 2K to 3K listeners and step up with the total), **Supercharge** ($100 to $999 as one payment for 30 days; the artist may add one second song and RADR picks its playlists) or **Pre-save** (unchanged). **Starter ($25) and Basic ($50) are no longer offered**; campaigns already sent keep them. Monthly recurring billing for Supercharge was considered and rejected: it is one 30-day payment. Staff approval defaults the run length to the days the artist paid for. Prices and limits live in `src/pages/campaigns/packages.js` and are checked again by database triggers, so change both together.
23. **Public Spotify follow step (2026-11-27, on `fix/spotify-follow-targets`, not merged):** the artist sees one Spotify follow (Artist RADR). Other follow targets are managed by staff in Studio ("Spotify follows" page, table `spotify_follow_targets`) and followed in the background on a best-effort basis; they are never reported to the artist and never gate the step.
24. **350-line limit (2026-11-27):** files stay at 350 lines or fewer (ESLint `max-lines`, `npm run lint:lines`, `CLAUDE.md`). Twelve older files are over and are split over time.

---

## 2. Provider findings (checked Nov 2026)

### Spotify
- Development Mode requires a Premium owner and allows only 5 authorised users. Extended quota needs a registered business with a large user base, so assume Development Mode.
- The February 2026 migration changed endpoints (e.g. playlist items, `PUT /me/library`). Old tutorials are wrong. Your own `follow-on-spotify` function already hit this: the old follow endpoint returns 403.
- Spotify's own editorial playlists (including New Music Naija) are very likely **not readable** through the API.
- New-releases listing, artist popularity and some bulk lookups were removed. Search returns at most 10 results.
- **Confirmed working in Development Mode (2026-11-23):** token refresh, reading RADR playlist tracks via `/playlists/{id}/items`, creating a private playlist, adding a track (via `/items`), reading it back, removing the track, and removing the playlist from the profile.
- **Consequence:** Spotify is for searching, matching and managing RADR's own playlists. It cannot be the discovery engine.
- **Public follow app (confirmed 2026-11-28 from function logs):** an account that is not listed under that app's User Management gets `403 The user is not registered for this application` at the follow call, even though login and token exchange succeed. This is the public-site failure the editor saw. The function reports it to the site as `reason: not_registered`. Real artists cannot use the step until the app has Extended Quota or the step no longer depends on Spotify's follow API.

### Apple Music
- The web API can create playlists and add tracks. It cannot reorder or remove tracks.
- Removal through MusicKit works only on Apple platforms and only for playlists the app created.
- **Consequence:** Apple support is "match + create/append", or rebuild a fresh playlist each time (which changes the share link). Decide later whether that is worth it.

### Paystack
- The account does not accept USD charges (2026-11-26), so checkout is in NGN. Rate source: `open.er-api.com` (free, updated once a day), cached one hour. Market rate was about ₦1,360 per $1 on 2026-11-26 (Wise, Eversend); the function's own feed may differ by a few naira.
- If the rate source is down and no `USD_NGN_RATE` fallback is set, checkout stops with a "try again" message instead of guessing.
- Test keys were pasted into a chat on 2026-11-26 (again in the 2026-11-27 session). Regenerate the test secret key, and regenerate before going live. Keys belong only in Supabase function secrets.

### Discovery re-scope
- Manual "add a track I found" is a first-class feature (built for Spotify search; Discovery will feed the same draft function with `source = 'discovery'`).
- Evaluate other lawful sources: Apple Music charts, Audiomack, YouTube, Last.fm, music blog feeds.
- Never claim growth data a source does not provide.
- Instagram was evaluated in Nov 2026 (official API reads Business and Creator accounts only) and dropped on 2026-11-25.

---

## 3. Master TODO

### Phase 0 — Audit
- [x] Codebase audit (App.jsx, routes, auth context, admin dashboard)
- [x] Supabase schema, RLS and security-advisor review
- [x] Read existing Edge Function `follow-on-spotify`
- [ ] Read remaining admin files if needed (`AdminLogin.jsx`, `Sidebar.jsx`)
- [x] Check whether the public Spotify follow flow works for non-allowlisted users: **it does not** (403 `not_registered`, confirmed 2026-11-28)

### Phase 1 — Studio shell
- [x] `VITE_APP_MODE` build flag, `dev:studio` and `build:studio` scripts
- [x] `StudioRoutes` with noindex meta
- [x] Sidebar layout, overview page, placeholder module pages
- [x] "← RADR Studio" button on the old dashboard (Studio build only)
- [x] "Open RADR Studio" button on the Profile page for staff
- [x] Pushed `feature/studio` to GitHub (commit `010eb3b`)
- [x] Commit and push everything since `010eb3b` (commit `88fa3ed`, 2026-11-23)
- [x] Create `studio` subdomain in cPanel, SSL, `.htaccess` for React Router (2026-11-23)
- [x] Add `https://studio.artistradr.com` to Supabase Auth redirect URLs
- [x] First production build and upload of `dist-studio/`. Live and confirmed working
- [x] Make login land on `/studio` (`AdminLogin.jsx`, Studio build only)
- [ ] Optional: match Studio accent to `var(--color-red)`

### Phase 2 — Playlists (Spotify)
- [x] Migration `radr_playlists_foundation` applied (9 tables, staff-only RLS, 3 playlists seeded)
- [x] Edge Function `studio-spotify` (connect, disconnect), staff-checked, tokens stored server-side
- [x] Spotify connect flow (authorize, callback, state check)
- [x] Playlists page: connection status, connect/disconnect, RADR playlist list
- [x] Spotify connected as `admin@artistradr.com`
- [x] Token refresh helper (`getAccessToken`, marks account `error` on `invalid_grant`, returns `needs_reconnect`)
- [x] Read a playlist's tracks and show them (`playlist_tracks` action, `PlaylistTracks.jsx`)
- [x] Spotify search, staff-only (`search` action, max 10 results)
- [x] Manual add to draft, creating canonical `tracks` + confirmed `track_platform_matches` (`studio_add_track_to_draft`)
- [x] Draft editor: add, remove (`PlaylistDraft.jsx`)
- [x] Copy current playlist into draft (`studio_seed_draft_from_tracks`, skips local files)
- [x] Drag-and-drop ordering with `@dnd-kit` (`studio_reorder_draft`)
- [x] Track numbers shown in the draft, live while dragging
- [x] Playlists page: live Spotify tracks hidden behind a "Show live tracks" button
- [x] **Verify playlist write endpoints in Development Mode** (`write_test` action + `WriteTestPanel.jsx`): all passed, `/items` works
- [x] Change preview action (`preview`): adds, removes, reorders, final count, blocked reasons (draft vs a fresh read of the live playlist)
- [x] Approve step (`studio_approve_draft`, records approver and time, tied to the preview hash)
- [x] Sync action (`sync`) with `playlist_sync_jobs` record, confirmation prompt and result summary
- [x] First real sync succeeded (2026-11-23): job `succeeded`, draft `applied`, `playlist.synced` logged
- [x] Deployed `studio-spotify` v6 `index.ts` and all four migrations saved in the repo, versions match the remote
- [x] Conflict detection tested: an outside edit after approval made the sync refuse, with nothing written and the failure logged
- [x] Sync tests done (confirmed by the editor, 2026-11-23)
- [x] Search shows release dates, with a release-period filter and newest-first sort (`SpotifySearch.jsx`; function v11 deployed and matches the repo)
- [ ] Spot-check playlist `last_synced_at`, `sync_status` and final count after sync
- [ ] Confirm sync never removes local files silently, and stops safely on `needs_reconnect`
- [x] Incident 2026-11-23: wrong file (`r2-video`) deployed over `studio-spotify`, restored from git (`88fa3ed`) and redeployed. Rule added: check line 1 and `grep` before every deploy
- [x] Write test panel removed from the Playlists page (the `write_test` action stays in the function, staff-only)
- [x] Activity log view (panel on the Playlists page, `ActivityLog.jsx`). Optional: own page and filters by playlist
- [ ] Match by ISRC, artist, duration; manual review of uncertain matches (needed for Discovery and Apple Music)
- [x] Submission campaigns: approve with days, countdown from first live add, Active campaigns panel, auto-resolve (2026-11-25, untested)
- [x] Artist campaigns: users cannot remove or delete sent campaigns; Edit budget, History and Remove buttons dropped; goal wording "Curated + algorithmic" (2026-11-25, branch `fix/campaign-dashboard-no-remove`, now inside `main`; untested as an artist)
- [x] Merge `fix/campaign-dashboard-no-remove` into the main line (already inside `main`, checked 2026-11-26). Still to do: test as an artist
- [x] Studio campaigns tab for artist campaigns: staff approve, set duration, separate from Submissions (built 2026-11-26, `studio-campaigns-tab`, inside `main`; untested)
- [ ] Apple Music: decision on approach, then MusicKit connection and matching

### Phase 3 — Discovery
- [x] Source management table and UI (add, disable, categorise): `discovery_sources`, Sources panel
- [x] Manual candidate entry (Spotify search or by hand, with a later "Match on Spotify" step)
- [x] ~~Instagram source~~ dropped 2026-11-25 (see section 6)
- [ ] Evaluate and add other non-Spotify sources (Audiomack, YouTube, Last.fm, blog feeds)
- [x] Candidate review list with status filter and accept / reject / save (`DiscoveryPage.jsx`)
- [ ] Candidate filters by source and playlist, duplicate check against existing playlists
- [ ] Signals stored with source and observation date (column `signals` exists, no UI yet)
- [x] Accepted candidates feed the playlist draft (`studio_accept_candidate`, never publishes on its own)

### Phase 4 — RADR Studio modules
- [ ] `studio_projects`, `studio_assets`, `artist_spotlights` tables
- [ ] Asset library with credit and rights fields
- [ ] Templates and aspect ratios
- [ ] Spotlight, Selection, New Music Picks formats
- [ ] Caption drafting
- [ ] Draft → review → approved states
- [x] Top 10 Generator (dark and light, Save to library after Approve) built 2026-11-24
- [ ] Test Save to library end to end (no saved rows yet)
- [x] Library view of saved Top 10s, with download and copy-ready caption (`/studio/artwork/library`, built 2026-11-25, untested)

### Phase 5 — Removed (2026-11-24)
Buffer and the Publishing module are out of scope. Staff post manually. If posting needs tracking later, add it to the artwork library in Phase 4.

### Phase 6 — RADR AI
- [ ] Provider-independent tool layer in Edge Functions
- [ ] Discover / Prepare / Execute permission levels
- [ ] Approval gates and action summaries
- [ ] Defend against instructions hidden in external metadata
- [ ] Chat UI in Studio

### Phase 7 — Friday automation
- [ ] `automation_rules`, `automation_runs`
- [ ] Per-playlist schedule and policy
- [ ] `pg_cron` calling an Edge Function, with locking and retries
- [ ] Safe stop and admin notification on any failure
- [ ] Pause control and audit trail

### Phase 8 — Magazine & Originals
- [ ] Decide whether to extend `PostEditor` or replace it
- [ ] Categories, tags, authors, SEO fields, scheduling
- [ ] `originals_series`, `originals_episodes`
- [ ] Transcripts, captions, media references
- [ ] Podcast RSS and hosting decision

### Phase 9 — Artist campaigns and billing (2026-11-26)
Built (run locally and reported working by the editor on 2026-11-26 except where noted; now in `main`, checked 2026-11-28; deploy state not checked):
- [x] Account area: sidebar Profile, My Campaigns, Billing; Dashboard and Settings removed; one "Open RADR Studio" button for staff on Profile (`feature/billing`, inside `main`)
- [x] Billing page `/campaigns/billing`: totals, campaign billing, payment history; `payments` migration applied
- [x] Checkout-style campaign flow (Track, Goal, Plan, Review) with Spotify song search or pasted link (`spotify-track-search` v1 deployed, `campaigns_spotify_track` applied)
- [x] Artists cannot edit locked campaign fields (`campaigns_lock_artist_fields` applied, rolled-back test passed)
- [x] ~~Packages: Starter $25, Basic $50, Supercharge $100 to $999, Pre-save from $50~~ **Replaced 2026-11-26** (decision 22): **Daily** ($2.99 to $14.99 a day, 7 to 30 days), **Supercharge** ($100 to $999, one 30-day payment, optional second song), **Pre-save** (from $50, unchanged). Starter and Basic are no longer offered
- [x] Daily plan and Supercharge second song, database side: migration `20261126230719_campaigns_daily_plan` applied and saved (`daily_rate`, `plan_days`, `extra_track`; server checks total = spend × days; artists cannot edit the new columns; approval defaults the run length to the days paid for)
- [x] Daily plan and Supercharge second song, artist flow: `DailyFields.jsx`, `ExtraTrackField.jsx`, updated `StepBudget`, `StepReview`, `SuperchargeFields`, `PackageCard`, `flowConfig.js`, `packages.js`, `useCampaigns.js` (not built or run)
- [x] Studio shows the plan, daily spend, days, targets and the second song (`CampaignPackageFacts.jsx`), suggests the paid days at approval (`campaignDays.js`), shows an Unpaid label and blocks Approve until paid (`usePaidCampaigns.js`, `CampaignsPage.jsx`); a note appears when a campaign has a second song (not built or run)
- [x] Redesigned artist campaign preview: artwork header, status and plan chips, playlist covers
- [x] Studio: attach playlists to a campaign by Spotify link (`campaign_playlists`, `campaign-playlist-lookup`)
- [x] Studio: Campaign playlists page `/studio/campaign-playlists` (2026-11-26, commit `554a2c2`): by-campaign attach view, all-playlists view, counts, Partner curators placeholder tab
- [x] Preview update (2026-11-26, commits `91dc59b`, `b2d2c04`, `4648108`; not yet run or built): Running → Completed tracker restyled as a slim Stripe-style timeline; Pause button removed from the artist screen; Renew campaign button when a campaign is Completed (opens the flow with song, goal and platform filled in); attached playlists as compact rows with 44px covers
- [x] Paystack checkout: campaigns send to checkout, Pay now retry, payment return check (`paystack` function: `init`, `verify`, webhook) (commit `e80644a`; not run, no test payment)
- [x] USD→NGN conversion on the server, with `price_usd` and `fx_rate` saved on each payment (function v4 deployed; migration `20261126142533_payments_fx_fields` applied and its file saved in the repo, rebuilt from the live column types)
- [x] Unpaid label, Delete for unpaid campaigns (`delete` action, status `removed`), Billing "Not completed" and paid-only Awaiting approval total (commits `936acbd`, `06b593f`, `19b0a68`; not run)
- [x] Source of the deployed `paystack` v4 saved in the repo (2026-11-26)

Still to do, in order:
- [x] Test the artist journey locally and the Campaign playlists page (reported working by the editor, 2026-11-26)
- [x] Save the missing migration SQL files into `supabase/migrations/` and fix the `campaigns_no_user_remove` file name (done 2026-11-26; all 26 files from 20261123 on match the remote)
- [x] Work out which branch contains which (done 2026-11-26; refreshed 2026-11-28: the campaign work is in `main` and `feature/campaign-flow` is gone from GitHub)
- [x] Save `supabase/migrations/20261126142533_payments_fx_fields.sql` (done 2026-11-26)
- [x] Studio: show paid or unpaid on each campaign, and block staff approval of unpaid campaigns in the screen (done 2026-11-26; the database does not enforce it)
- [ ] **Confirm `PAYSTACK_SECRET_KEY` is set** in Supabase Edge Function secrets (test key), and regenerate the test key that was pasted into chat
- [ ] **Run the rolled-back database test again for the daily plan:** a daily campaign with a wrong total, a rate outside $2.99 to $14.99 or days outside 7 to 30 must be refused; an artist must not change `daily_rate`, `plan_days` or `extra_track`; `extra_track` must be dropped on non-Supercharge plans
- [ ] **Test both plans and a payment end to end:** pull `main`, `npm run build`, `npm run dev`, create a Daily campaign ($2.99 for 7 days = $20.93) and a Supercharge one with a second song; the Review step, Pay now step and Paystack must show the same total (converted to naira); pay with a Paystack test card, check Billing shows Paid, the `payments` row has `price_usd`, `fx_rate` and NGN `amount`, and Studio shows Paid, the plan and the second song and suggests the paid days; then create and delete a throwaway unpaid campaign (a paid one must refuse deletion)
- [ ] Decide an FX margin (2 to 3 percent suggested) and set `FX_MARGIN_PERCENT` and a `USD_NGN_RATE` fallback
- [ ] Confirm the Paystack webhook URL in the Paystack dashboard
- [ ] Studio: tag attached playlists to a song, so a Supercharge campaign with a second song can check each playlist against the right song (today the "song is in this playlist" check only looks at the first song, and Studio shows a note)
- [ ] Studio screen for staff to record payments (needed for offline payments; an unpaid campaign cannot be approved from the screen until a payment row exists)
- [ ] Re-run `npx eslint src`, `npm run build` and `npm run build:studio` on `main`, and try the new plans, tracker, Renew button, compact playlists, Unpaid labels and Delete in `npm run dev` (open one pending, one active and one completed campaign)
- [ ] Fix `eslint.config.js` so `npm run lint` is meaningful: ignore `dist-studio` and the Node files (`server.js`, `*.cjs`, `scripts/`), or give them Node globals. Today `eslint .` reports 541 problems, mostly from the minified `dist-studio` bundle
- [ ] Rebuild both sites from `main` and upload (check first whether the live bundles already include the campaign work)
- [ ] **Confirm the Supercharge targets above $100** (proposed by Claude in `SUPERCHARGE_TIERS`; RADR must be able to deliver them) and the Daily plan targets
- [ ] Review plan wording against Spotify's rules on paid services that advertise streams or guarantee placement
- [ ] Top-up of a running campaign (needs payments first)
- [ ] Recurring monthly billing for Supercharge (not planned: it is a single 30-day payment)
- [ ] Show song artwork in Studio's Campaigns list (the detail view already shows it)
- [ ] Optional: scan RADR's own playlists for a campaign's song and suggest them on the Campaign playlists page (today staff find and paste each link by hand)
- [ ] Optional: show attached playlists on the artist's campaign list; email the artist when playlists are added
- [ ] Optional: remove the unused `togglePause` from `useCampaigns.js`; decide whether the database should also stop artists pausing through the API
- [ ] Tidy: `campaign_playlists` has two identical unique indexes on (`campaign_id`, `spotify_playlist_id`); keep one
- [ ] Optional: save the earlier `campaigns` guard triggers as migration files (they were never saved) if the schema is ever rebuilt from the repo
- [ ] Review the 66 npm audit findings separately (no `npm audit fix --force`)

### Phase 10 — Partner curators (future, decided 2026-11-26)
Artist RADR is open to curators with active playlists who want to earn from artist campaigns. Only a placeholder tab exists ("Partner curators" on the Campaign playlists page). Nothing below is built:
- [ ] Decide the terms: how curators apply, how and when they are paid, what they must deliver
- [ ] Tables for curators and their playlists, staff-only RLS (curator sign-in only if curators get their own view later)
- [ ] Curator list in Studio: name, contact, playlist links, approved or not
- [ ] Approval step before a partner playlist can be attached to a campaign
- [ ] Mark each attached playlist as RADR's own or a partner's (needs a `source` column on `campaign_playlists`, plus a link to the curator)
- [ ] Record what each curator earns per placement (needs the payments work first)
- [ ] Show only figures a source provides; no invented follower or stream numbers
- [ ] Decide what artists see for partner playlists (same cover and link as today)

### Phase 11 — Public submission and Spotify follow step (2026-11-27 and 28)
Done:
- [x] Submission page split into components, session sent to the verification functions, browser no longer sends the Spotify and YouTube verified flags, 350-line rule added (PR #2, merged into `main`, not uploaded)
- [x] Verification part 1 applied: table `submission_verifications`, written by the two verification functions
- [x] Follow-targets rewrite on `fix/spotify-follow-targets` (`2013ced`, `f66d01e`): one visible follow, targets in `spotify_follow_targets`, Studio "Spotify follows" page, reason codes from the function
- [x] Cause of the Follow on Spotify failure found 2026-11-28: Development Mode `403 not_registered` (account not allowlisted), not site code. The editor added the account and ran the local test (reported done; exact result not recorded)

To do:
- [ ] **Decide the approach (decision 9):** add testers by hand (max 5 users in Development Mode), apply for Extended Quota, or accept the honor-mode branch `fix/spotify-follow-honor-mode`
- [ ] Confirm the live `follow-on-spotify` function matches `supabase/functions/follow-on-spotify/index.ts` on the follow branch, and that `spotify_follow_targets` exists on the remote with the seeded rows
- [ ] Save the follow-targets migrations as applied versions (check names against the remote) and merge the follow branch into `main`
- [ ] Drop the local-only commit `f006b84` (wording-only copy of work already in `2013ced`), delete `fix/spotify-follow-step`
- [ ] Check the localhost mentions in the new public bundle
- [ ] Back up the live folder, upload the new build through cPanel (keep `.htaccess`), confirm `spotify_verified` count is 0 on the live bundle
- [ ] Test a Spotify or YouTube step on the live page
- [ ] Apply verification part 2 (database enforcement), only after the new build is live **and** the follow approach is settled: with enforcement on, an artist whose Spotify follow is rejected cannot complete the submission
- [ ] Save the part 1 migration as a file in `supabase/migrations/`
- [ ] Run the five browser checks on the new submission page
- [ ] Split the 12 files over 350 lines, a few at a time; paystack last

---

## 4. Open risks and security items

| Item | Detail | Action |
|---|---|---|
| **Service-role key in git history** | A real **legacy JWT** `service_role` key (expires 2036) is in `scripts/env.migration.example` (first commit `f33388e`) and in a local `scripts/.env.migration.save`. The repo is private. | **In progress 2026-11-24.** Steps 1 to 5 done. Legacy keys are now rejected (401 seen 2026-11-24). Still to verify: the public site rebuilt with the new key AND in public mode is uploaded and working (see section 7 notes). Then cleanup steps 6, 8, 9. Only `studio-spotify` uses it; the older functions and the database triggers do not. |
| **Paystack test keys pasted in chat** | Test secret and public keys were shared in chat on 2026-11-26 and again on 2026-11-27. Test keys, so low risk, but the secret key must not stay exposed. | Regenerate the test secret key now; regenerate again before going live; keep it only in Supabase function secrets, never in the repo or in chat. |
| **Public Spotify follow blocked for non-allowlisted accounts** | Confirmed 2026-11-28: Spotify's Development Mode rejects accounts not added under the follow app's User Management (`403 not registered`). Max 5 users. The site shows a "contact us" message. Real artists cannot complete the Spotify step. | Decide the approach (Phase 11, decision 9). Do not apply verification part 2 before this is settled. |
| **Payments untested** | The Paystack function (v4) is live but no payment has been made. `PAYSTACK_SECRET_KEY` is not confirmed set. Frontend not built or run since the payment commits. | Run the end-to-end test in Phase 9 before relying on it. |
| **Daily plan untested** | The daily plan and Supercharge second song are live in the database and written in the frontend, but nothing has been built, run or tested, and the database price checks have not been re-tested. | Run the rolled-back database test and both plan flows (Phase 9). |
| **Exchange-rate risk** | The NGN charge uses a free daily rate (`open.er-api.com`). The naira can move between the rate used and when RADR converts the money, and the rate source can be down. | Set `FX_MARGIN_PERCENT` (2 to 3 percent suggested) and a `USD_NGN_RATE` fallback. |
| **Unpaid campaigns can still be approved outside the screen** | Studio now shows Unpaid and disables Approve until a paid payment exists, but the database does not enforce it: a direct update by staff can still approve an unpaid campaign. If payments can't be read, nothing is blocked. | Optional: enforce in a database trigger. Add a staff screen to record offline payments (Phase 9). |
| **Second-song playlists not tagged** | Playlists attached in Studio are not linked to a song, and the "song is in this playlist" check uses the first song only. | Tag playlists to a song (Phase 9). |
| ~~Migration files missing from the repo~~ | **Resolved 2026-11-26.** All 26 campaign-era migration files are saved and match the remote. | Remaining gap: the 22 August/September migrations and the early `campaigns` guard triggers (see the remote-only row below). |
| **Follow-targets migrations not in `main`** | `20261127120000_spotify_follow_targets.sql` and the follow-up in `f66d01e` are on `fix/spotify-follow-targets` only. Whether the remote database already has the table was not checked. | Check the remote, then merge and save the applied versions (Phase 11). |
| **Campaign work live state unknown** | The campaign flow, plans, campaign playlists, the preview changes and the payment work are in `main`; the database changes and `paystack` v4 are live. Whether the website and Studio builds with this code are uploaded was not checked. | Check the live bundles, then rebuild and upload (Phase 9). |
| **Lint output is misleading** | `eslint .` reports 541 problems because it lints `dist-studio/` and Node scripts; the config only ignores `dist`. Real app code was checked with `npx eslint src`. | Fix the ignore list (Phase 9). |
| **Paid-stream wording** | Plan copy mentions playlist, listener and stream targets. Spotify has rules on paid services that advertise streams or guarantee placement. | Review the wording before launch. |
| **Sync edge cases partly tested** | One real sync succeeded and conflict detection is confirmed. Remove plus reorder and blocked cases (local files, unmatched tracks) are not yet exercised. | Test on a throwaway playlist before relying on it for live RADR playlists. |
| Wrong file in git history | Commit `61322dc` contains a Free Republick function (`r2-video`). Setting names only, no secrets. | Check history before ever making the repo public. |
| Remote-only old migrations | 22 August/September migrations exist on the remote but not as repo files. `supabase db push` would complain. | Avoid `db push`. Optionally pull them later with `supabase db pull`. |
| Token rotation / refresh failure | Handled: refresh failure with `invalid_grant` marks the account `error` and returns `needs_reconnect`. | Confirm sync stops safely on this and notifies. |
| Draft vs live drift | Someone can edit the playlist in Spotify while a draft is open. | Preview re-reads the live playlist and flags conflicts. Test it. |
| Local files in playlists | Local tracks have no Spotify ID. Copy-into-draft skips them. | Show skipped count (done). Sync must never remove them silently. Test it. |
| Search cap | Search returns at most 10 results in Development Mode. | Accept; add paste-a-Spotify-link lookup later if needed. |
| Duplicate staff function | `radr_is_staff()` (new) and `is_radr_staff()` (existing) do the same thing. | Consolidate later. |
| Existing functions callable by `anon` | `is_radr_staff()` is flagged by the security advisor. Harmless (returns false) but noisy. | Optional: revoke execute from `anon`. |
| `pg_net` in `public` schema | Advisor warning, not from this work. | Optional: move to the `extensions` schema. |
| Leaked-password protection off | Supabase Auth setting. | Turn on if the plan allows. |
| Import path case | The `pages/Campaigns` casing was fixed to `pages/campaigns` on `feature/billing`. `App.jsx` still imports `pages/home/Home` while the file is `home.jsx`. Works on macOS only. | Fix before building on Linux. |
| npm audit | `npm install` reports 66 vulnerabilities (2 low, 42 moderate, 20 high, 2 critical), 2026-11-26. | Review separately; do not run `npm audit fix --force`. |

---

## 5. Decisions still needed

1. Apple Music: add-only, rebuild each time, or skip for now?
2. Which non-Spotify sources to use for Discovery?
3. Podcast hosting and RSS provider.
4. Final accent colour (`--rs-accent`) for Studio.
5. ~~When to rotate the exposed service-role key.~~ In progress, see section 7.
6. ~~Payment provider for artist campaigns.~~ Paystack, charging NGN converted from USD prices (2026-11-26). Still to decide: FX margin and fallback rate.
7. ~~Campaign plans.~~ Daily, Supercharge and Pre-save (decision 22). Still to decide: the final Supercharge targets above $100 and the Daily plan targets, and the plan wording (see Phase 9).
8. Partner curator terms: how curators apply, how and when they are paid, what they must deliver (see Phase 10).
9. **Public Spotify follow step beyond allowlisted accounts (2026-11-28):** (a) keep Spotify's follow API and add testers by hand (max 5 in Development Mode), (b) apply for Extended Quota (a business application with its own requirements; check Spotify's current criteria), or (c) make the step self-confirmed (`fix/spotify-follow-honor-mode`), which means the server can no longer prove the follow. This also decides whether verification part 2 can be switched on.

**Resolved:** which test playlist to use for the first write check (a private throwaway on `admin@artistradr.com`, done 2026-11-23).

---

## 6. Instagram discovery (dropped 2026-11-25)

The Meta Connect step stayed blocked and the feature was dropped. Code and tables are removed. Other discovery sources (Audiomack, YouTube, Last.fm, blog feeds) can be evaluated later.

---

## 7. Runbook: rotate the leaked service-role key

Order matters. Deactivating the legacy keys breaks anything still using them, including the public site if its browser key is the old `anon` JWT.

1. **Done.** Supabase, Settings, API Keys: new publishable and secret keys created. Legacy keys keep working until step 7.
2. **Done 2026-11-24.** `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` (and `.env.studio` if present) now holds the `sb_publishable_...` key. Public site (`npm run build`) and Studio (`npm run build:studio`) rebuilt and uploaded; live checks passed.
3. **Done.** `STUDIO_SECRET_KEY` function secret added (new secret key, never in chat).
4. **Done.** `studio-spotify` redeployed (prefers `STUDIO_SECRET_KEY`). `studio-instagram` was removed.
5. **Done.** Tested: public site posts, admin and Studio login, Playlists and Discovery.
   **Found 2026-11-24:** `.env` still held the legacy anon key and also `VITE_APP_MODE=studio`, so a public build from it was a Studio build with the old key. Fix: `.env` gets the `sb_publishable_...` key and no `VITE_APP_MODE` line. Rebuild with `npm run build` (postbuild must print "Wrote N static post page(s)", not a 401), upload, test in a private window.
6. Replace the key in any local `.env.migration` used by the one-off scripts, and delete `scripts/.env.migration.save`.
7. **Done 2026-11-24.** Legacy keys deactivated (Settings, API Keys, Legacy tab); re-enable there if a site breaks. Still retest the public site, Studio login, Playlists and Discovery.
8. Later: move to JWT signing keys, then revoke the legacy JWT secret (the leaked key is a JWT signed by it). Check the effect on logged-in users first.
9. Remove the key text from `scripts/env.migration.example` (replace with a placeholder) and commit. It stays in git history, which is harmless once the key is dead.
