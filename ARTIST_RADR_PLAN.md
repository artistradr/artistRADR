# Artist RADR — Plan & TODO

**Last updated:** 2026-11-24 (Instagram backend deployed)
**Companion file:** `ARTIST_RADR_STATUS.md` (current state, commands, env, handoff)
**Product brief:** the original "Artist RADR — Product Vision & Development Brief" still applies, with the changes recorded in section 1.

---

## Progress at a glance

| Phase | Area | Status |
|---|---|---|
| 0 | Audit (code + Supabase) | Mostly done |
| 1 | Studio app shell on `studio.artistradr.com` | **Done. Live since 2026-11-23.** Login still lands on `/admin` |
| 2 | Playlists (Spotify first) | **Done for Spotify.** Search with release dates, draft editor, review, approve, sync, conflict detection and activity log all working. Apple Music undecided |
| 3 | Discovery | **In progress.** Manual candidates, review and accept-into-draft built. Instagram: backend and Studio panel built and pushed, but **the Facebook login step is blocked (parked 2026-11-24)** |
| 4 | RADR Studio modules (artwork, spotlights) | Not started |
| 5 | Buffer publishing | Not started |
| 6 | RADR AI | Not started |
| 7 | Friday automation | Not started |
| 8 | Magazine & RADR Originals | Not started (existing posts admin stays live) |

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
- **Instagram (checked Nov 2026):** the official Business Discovery API returns followers, post counts, and per-post likes, comments and views for other **Business or Creator** accounts only (not personal accounts). It gives point-in-time counts, so "growing" needs repeated snapshots we store ourselves. Reels carry an audio type (`MUSIC` or `ORIGINAL_SOUND`) but no track title. Meta's Audio API can list trending music and sounds, but it is built for attaching audio to Reels. Needs a Meta developer app and a Facebook Page linked to an Instagram professional account. Scraping Instagram is not an option (terms of use).

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
- [ ] Apple Music: decision on approach, then MusicKit connection and matching

### Phase 3 — Discovery
- [x] Source management table and UI (add, disable, categorise): `discovery_sources`, Sources panel
- [x] Manual candidate entry (Spotify search or by hand, with a later "Match on Spotify" step)
- [ ] **Instagram source (in progress):** see section 6
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

### Phase 5 — Buffer
- [ ] Verify current Buffer API and supported channels
- [ ] Connect Buffer, read channels
- [ ] Post drafts, per-channel preview, approval
- [ ] Schedule, track status, safe retry

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

---

## 4. Open risks and security items

| Item | Detail | Action |
|---|---|---|
| **Service-role key in git history** | A real Supabase service-role key is in `scripts/env.migration.example` (first commit `f33388e`) and in a local `scripts/.env.migration.save`. The repo is private. Chosen to leave for now. | Rotate the key before the repo is shared or made public. |
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
| Import path case | `pages/Campaigns/...` vs folder `campaigns`. Works on macOS only. | Fix before building on Linux. |
| Public follow flow | Old Spotify app may be limited to 5 allowlisted users. | Test with a non-staff account. |

---

## 5. Decisions still needed

1. Apple Music: add-only, rebuild each time, or skip for now?
2. Which non-Spotify sources to use for Discovery?
3. Podcast hosting and RSS provider.
4. Final accent colour (`--rs-accent`) for Studio.
5. When to rotate the exposed service-role key.
6. Which Instagram accounts to watch first (artists, labels, blogs)? Business and Creator accounts only.

**Resolved:** which test playlist to use for the first write check (a private throwaway on `admin@artistradr.com`, done 2026-11-23).

---

## 6. Instagram discovery (Phase 3, in progress)

**Goal:** find emerging African artists gaining traction on Instagram and feed them to Discovery as candidates. Staff still review and accept every one.

**Done (2026-11-24)**
- Instagram account `artistradr` is a professional account linked to the Artistradr Facebook Page.
- Meta app **radr Studio** (App ID `1182413560930197`, Business type, Instagram API with Facebook login, Unpublished). App ID and secret stored as Supabase secrets `META_APP_ID` and `META_APP_SECRET`.
- Permissions granted on the test token: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`, `pages_show_list`, `business_management`.
- **Verified in Graph API Explorer, Development mode, no App Review:** Business Discovery returned followers, post count and the last 5 posts (likes, comments, type, date, link) for a public business account. Some posts have no `like_count` (account hides likes), so likes are optional.
- Migration `studio_instagram_discovery_foundation` applied: tables `discovery_ig_accounts` (watchlist) and `discovery_ig_snapshots`, both staff-only RLS, and `instagram` allowed as a `connected_accounts` provider. Migration version `20261124033929`; file still to be saved in the repo.
- Edge Function `studio-instagram` v1 deployed (JWT check off, does its own staff check). Actions: `status`, `connect`, `disconnect`, `lookup`, `add_account`, `remove_account`, `snapshot`. Source in `supabase/functions/studio-instagram/index.ts` (still to be saved in the repo).

**Built and pushed (commit `0586ca0` on `feature/studio`, 2026-11-24)**
- Function and migration saved in the repo (`supabase/functions/studio-instagram/index.ts`, `supabase/migrations/20261124033929_studio_instagram_discovery_foundation.sql`).
- Studio: `src/studio/instagram.js` (Connect helpers), `src/studio/StudioInstagramCallback.jsx` (route `/studio/instagram/callback`), `src/studio/pages/InstagramPanel.jsx` (connect, watchlist, check account, refresh, remove, recent posts), wired into `DiscoveryPage.jsx` and `App.jsx`. Discovery marked live in `modules.js`.
- `.env.studio` needs `VITE_STUDIO_META_APP_ID=1182413560930197` (public). A `VITE_STUDIO_META_CONFIG_ID` is only needed if Meta asks for a Facebook Login for Business configuration.

**BLOCKED (parked 2026-11-24): Connect Instagram**
Facebook shows: *"Facebook has detected that radr Studio isn't using a secure connection to transfer information. Until radr Studio updates its security settings, you won't be able to use Facebook to log in to it."*
Meta only accepts **https** redirect URIs, so the Connect flow cannot be tested locally on `http://127.0.0.1`; it must be tested on `https://studio.artistradr.com`.
Things to check when we resume, in this order:
1. Meta app dashboard, Facebook Login for Business, Settings: `https://studio.artistradr.com/studio/instagram/callback` is saved exactly (no trailing slash, no spaces) and the page says it saved. Do not add the `http://127.0.0.1` one.
2. Same page: **Client OAuth Login** and **Web OAuth Login** are on; **Enforce HTTPS** is on; **Login with the JavaScript SDK** can stay off.
3. App settings, Basic: add `studio.artistradr.com` under **App domains** (and `artistradr.com` if asked).
4. Confirm the live Studio build actually contains the new code and `VITE_STUDIO_META_APP_ID` (the Instagram panel shows and the Connect button is enabled).
5. If Meta asks for a configuration ID, create one under Facebook Login for Business, Configurations, and set `VITE_STUDIO_META_CONFIG_ID`.
6. Fallback that avoids the login screen: a one-off server-side connection using a long-lived token created in the Graph API Explorer (never pasted in chat; set as a Supabase secret).

**Still to do after Connect works**
4. Scheduled snapshots (`pg_cron` calling the function) so growth can be calculated from our own history. Growth only shows once there are at least two snapshots.
5. Ranking by engagement and growth, with observation dates shown.
6. Trending audio (Meta Audio API), match songs on Spotify, create candidates with `signals` filled in.

**Limits to remember:** Business and Creator accounts only; point-in-time counts; reels give audio type but no track title; no scraping. Development mode works for people with a role on the app; check whether Advanced access or App Review is needed before wider use.
