# Artist RADR — Plan & TODO

**Last updated:** 2026-11-26 (account area and billing page, campaign flow with Spotify song search, campaign packages, campaign playlists attached by staff, Campaign playlists page in Studio; all on unmerged branches, database changes live; campaign work run locally and reported working; all campaign migration files saved in the repo)
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
| 9 | Artist campaigns and billing | **Built, run locally and reported working (2026-11-26), not linted or fully built, not merged.** Account area, Billing page, campaign flow, packages, Studio Campaigns tab, campaign playlists, Campaign playlists page. No online payments yet |
| 10 | Partner curators | **Planned, not started.** Placeholder tab on the Campaign playlists page (2026-11-26) |

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
15. **Artists cannot remove or edit sent campaigns.** Only staff approve, set days, attach playlists and remove (2026-11-25/26).
16. **No online payment yet.** Billing shows totals and history only; payments are recorded by staff once that screen exists (2026-11-26).
17. **Campaign playlists are attached by staff in Studio** by pasting a Spotify playlist link; artists only see cover and link (2026-11-26).
18. **Campaign playlists have their own Studio page** (`/studio/campaign-playlists`), with RADR's own playlists first and a partner curators list added later. The Campaigns tab keeps the same attach panel (2026-11-26).
19. **Partner curators are a future list.** Artist RADR is open to curators with active playlists earning from artist campaigns; nothing is built or stored for it yet (2026-11-26).

---

## 2. Provider findings (checked Nov 2026)

### Spotify
- Development Mode requires a Premium owner and allows only 5 authorised users. Extended quota needs a registered business with a large user base, so assume Development Mode.
- The February 2026 migration changed endpoints (e.g. playlist items, `PUT /me/library`). Old tutorials are wrong. Your own `follow-on-spotify` function already hit this: the old follow endpoint returns 403.
- Spotify's own editorial playlists (including New Music Naija) are very likely **not readable** through the API.
- New-releases listing, artist popularity and some bulk lookups were removed. Search returns at most 10 results.
- **Confirmed working in Development Mode (2026-11-23):** token refresh, reading RADR playlist tracks via `/playlists/{id}/items`, creating a private playlist, adding a track (via `/items`), reading it back, removing the track, and removing the playlist from the profile.
- **Consequence:** Spotify is for searching, matching and managing RADR's own playlists. It cannot be the discovery engine.

### Apple Music
- The web API can create playlists and add tracks. It cannot reorder or remove tracks.
- Removal through MusicKit works only on Apple platforms and only for playlists the app created.
- **Consequence:** Apple support is "match + create/append", or rebuild a fresh playlist each time (which changes the share link). Decide later whether that is worth it.

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
- [ ] Check whether the public Spotify follow flow works for non-allowlisted users

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
- [x] Artist campaigns: users cannot remove or delete sent campaigns; Edit budget, History and Remove buttons dropped; goal wording "Curated + algorithmic" (2026-11-25, branch `fix/campaign-dashboard-no-remove`, untested, not merged)
- [ ] Merge `fix/campaign-dashboard-no-remove` into `feature/studio` after a test as an artist (see Phase 9: branch order still to decide)
- [x] Studio campaigns tab for artist campaigns: staff approve, set duration, separate from Submissions (built 2026-11-26, `studio-campaigns-tab`, merged into `feature/billing`; untested)
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
Built (run locally and reported working by the editor on 2026-11-26; none merged or deployed; lint and full build not run):
- [x] Account area: sidebar Profile, My Campaigns, Billing; Dashboard and Settings removed; one "Open RADR Studio" button for staff on Profile (`feature/billing`)
- [x] Billing page `/campaigns/billing`: totals, campaign billing, payment history; `payments` migration applied
- [x] Checkout-style campaign flow (Track, Goal, Budget, Review) with Spotify song search or pasted link (`spotify-track-search` v1 deployed, `campaigns_spotify_track` applied)
- [x] Artists cannot edit locked campaign fields (`campaigns_lock_artist_fields` applied, rolled-back test passed)
- [x] Packages: Starter $25, Basic $50, Supercharge $100 to $999, Pre-save from $50; staff set days at approval
- [x] Redesigned artist campaign preview: artwork header, status and package chips, four-step tracker, playlist covers
- [x] Studio: attach playlists to a campaign by Spotify link (`campaign_playlists`, `campaign-playlist-lookup`)
- [x] Studio: Campaign playlists page `/studio/campaign-playlists` (2026-11-26, commit `554a2c2`): by-campaign attach view, all-playlists view, counts, Partner curators placeholder tab

Still to do, in order:
- [x] Test the artist journey locally and the Campaign playlists page (reported working by the editor, 2026-11-26)
- [x] Save the seven missing migration SQL files into `supabase/migrations/` and fix the `campaigns_no_user_remove` file name (done 2026-11-26; all 24 files from 20261123 on match the remote)
- [ ] Run lint and a full build on the branch
- [ ] Work out which branch contains which, decide merge order for `feature/studio`, `fix/campaign-dashboard-no-remove`, `feature/billing`, `feature/campaign-flow`, merge, rebuild both sites and upload
- [ ] Confirm the Supercharge targets above $100 (proposed by Claude, RADR must be able to deliver them) and which package "10K+ streams" belongs to
- [ ] Review package wording against Spotify's rules on paid services that advertise streams or guarantee placement
- [ ] Choose a payment provider; verify payments server-side before marking them paid
- [ ] Studio screen for staff to record payments
- [ ] Top-up of a running campaign (needs payments first)
- [ ] Show song artwork in Studio's Campaigns tab
- [ ] Optional: scan RADR's own playlists for a campaign's song and suggest them on the Campaign playlists page (today staff find and paste each link by hand)
- [ ] Optional: show attached playlists on the artist's campaign list; email the artist when playlists are added
- [ ] Tidy: `campaign_playlists` has two identical unique indexes on (`campaign_id`, `spotify_playlist_id`); keep one
- [ ] Optional: save the earlier `campaigns` guard triggers as migration files (they were never saved) if the schema is ever rebuilt from the repo

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

---

## 4. Open risks and security items

| Item | Detail | Action |
|---|---|---|
| **Service-role key in git history** | A real **legacy JWT** `service_role` key (expires 2036) is in `scripts/env.migration.example` (first commit `f33388e`) and in a local `scripts/.env.migration.save`. The repo is private. | **In progress 2026-11-24.** Steps 1 to 5 done. Legacy keys are now rejected (401 seen 2026-11-24). Still to verify: the public site rebuilt with the new key AND in public mode is uploaded and working (see section 7 notes). Then cleanup steps 6, 8, 9. Only `studio-spotify` uses it; the older functions and the database triggers do not. |
| ~~Migration files missing from the repo~~ | **Resolved 2026-11-26.** The seven campaign migrations are saved and `campaigns_no_user_remove` is renamed to the remote version `20261125200403`. All 24 migration files from `20261123023154` on match the remote. | Remaining gap: the 22 August/September migrations and the early `campaigns` guard triggers (see the remote-only row below). |
| **Campaign work not linted, built or merged** | Billing, campaign flow, packages, campaign playlists and the Campaign playlists page are on unmerged branches and were run locally and reported working (2026-11-26); the database changes are already live. Lint and full build were not run. | Run lint and a full build, then merge and deploy (Phase 9). |
| **Paid-stream wording** | Package copy mentions playlist, listener and stream targets. Spotify has rules on paid services that advertise streams or guarantee placement. | Review the wording before launch. |
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
| Public follow flow | Old Spotify app may be limited to 5 allowlisted users. | Test with a non-staff account. |

---

## 5. Decisions still needed

1. Apple Music: add-only, rebuild each time, or skip for now?
2. Which non-Spotify sources to use for Discovery?
3. Podcast hosting and RSS provider.
4. Final accent colour (`--rs-accent`) for Studio.
5. ~~When to rotate the exposed service-role key.~~ In progress, see section 7.
6. Payment provider for artist campaigns.
7. Final Supercharge targets and the package wording (see Phase 9).
8. Partner curator terms: how curators apply, how and when they are paid, what they must deliver (see Phase 10).

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
