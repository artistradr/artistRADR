# Artist RADR — Project Status & Handoff

**As of:** 2026-11-25
Compact summary of everything built and decided so far. Paste this into a new chat or Claude Code to restore context. The roadmap and full TODO are in `ARTIST_RADR_PLAN.md`.

---

## What this is

Artist RADR (artistradr.com) is an independent music discovery and editorial platform with a focus on emerging African artists. It is separate from Free Republick. We are adding **RADR Studio**, a staff-only workspace for discovery, playlist curation, content creation. Staff post to social manually. The editor stays in control: nothing goes live without approval.

**First milestone:** Discovery → editorial selection → playlist draft → approved Spotify sync. **Reached and working** (2026-11-23).

**Studio is live at https://studio.artistradr.com** (deployed 2026-11-23, confirmed working).

---

## Repo and branches

| Item | Value |
|---|---|
| Repo | `github.com/artistradr/artistRADR` (private) |
| Local folder | `~/artist-radr` |
| Working branch | `feature/studio` (Studio is built and deployed from this branch; not merged to `main`) |
| `main` | fast-forwarded to `a0f9581` (promo work) |
| Rollback tag | `live-before-studio` |
| Studio commits pushed | `88fa3ed` (Spotify, draft editor, approval and sync), `0f717ba` (Discovery, activity log), `61322dc` (release dates, test panel removed), `0004d37` (restored correct `studio-spotify`), `0586ca0` (Instagram function, migration, watchlist panel). Run `git log -1 --oneline` for the latest |
| Uncommitted | Nothing known. Run `git status --short` before starting work |

**Warnings**
- A different repo, `freerepublick.com`, is on the same machine. An earlier commit meant for Artist RADR landed there by mistake and was undone with `git reset --mixed HEAD~1`. Before every commit, check `pwd`, `git remote -v` and `git branch --show-current`.
- On 2026-11-23 the wrong file (a Free Republick function, `r2-video`) was copied over `studio-spotify/index.ts`, deployed and committed (`61322dc`). It was restored from git and redeployed the same day. The wrong file remains in git history (no secrets in it, only setting names). Do not make the repo public without checking history.
- Add named paths to `git add`, never `git add -A` (the repo root holds ignored secret files such as `serviceaccount.json`).

---

## Stack

Vite 8, React 19, react-router-dom 7, MUI 9, `@dnd-kit` (drag and drop), Supabase (auth, DB, Edge Functions). Deployed manually via cPanel (build locally, upload).

### Commands
```bash
npm run dev            # public site      http://localhost:5173
npm run dev:studio     # Studio           http://127.0.0.1:5174/studio   (use 127.0.0.1)
npm run build          # public build (runs postbuild blog HTML step)
npm run build:studio   # Studio build -> dist-studio/
```

### Deploy Studio (manual, cPanel)
```bash
cd ~/artist-radr && pwd
npm run build:studio
cd dist-studio && zip -r ../dist-studio.zip . && cd ..
```
Upload `dist-studio.zip` to the `studio.artistradr.com` folder in cPanel File Manager, extract it so `index.html` sits directly in that folder, delete the zip. The folder also needs this `.htaccess` (React Router rewrite plus noindex header), which is not part of the build:
```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
<IfModule mod_headers.c>
  Header set X-Robots-Tag "noindex, nofollow"
</IfModule>
```
Do not delete `.htaccess` when replacing files on later deploys. `https://studio.artistradr.com` is in Supabase Auth redirect URLs.

### Deploy the Edge Function
```bash
cd ~/artist-radr && pwd
head -1 supabase/functions/studio-spotify/index.ts     # must be: // supabase/functions/studio-spotify/index.ts
grep -c "release_date" supabase/functions/studio-spotify/index.ts   # must be above 0
supabase functions deploy studio-spotify --no-verify-jwt --use-api
```
Only deploy if both checks pass. `--no-verify-jwt` is required (the function does its own staff check). To read what is deployed: `supabase functions download studio-spotify --use-api`.

### Env files (all gitignored)
| File | Variable | Purpose |
|---|---|---|
| `.env` | Supabase URL and publishable key | Shared by both builds |
| `.env` | `VITE_STUDIO_URL` | Where the Profile "Open RADR Studio" button points (`http://127.0.0.1:5174` locally; set the studio URL for production builds of the public site) |
| `.env.studio` | `VITE_APP_MODE=studio` | Turns on Studio mode |
| `.env.studio` | `VITE_STUDIO_SPOTIFY_CLIENT_ID` | Public Client ID of the Studio Spotify app |

---

## Supabase

**Project ref:** `rjivkemajotafjvtalol` (CLI is linked)

### Access model
- Role lives in `profiles.role` (`subscriber` or `radrStaff`).
- App auth context: `src/context/SupabaseAuthContext.jsx` (`user`, `userRole`, `login`, `logout`, `loading`, `roleLoading`).
- Staff check in SQL: `public.radr_is_staff()` (duplicate of the older `public.is_radr_staff()`).

### Tables
- **Existing:** `posts` (26 rows), `playlist_submissions`, `profiles` (3 rows), `campaigns`.
- **Playlists foundation** (all with staff-only RLS): `connected_accounts`, `connected_account_secrets` (no policies: service role only), `radr_playlists`, `tracks`, `track_platform_matches`, `playlist_drafts`, `playlist_draft_items`, `playlist_sync_jobs`, `activity_logs`.
- **Discovery** (staff-only RLS): `discovery_sources` (name, kind, url, active flag) and `discovery_candidates` (artist, title, link, note, `spotify_track` jsonb, `signals` jsonb reserved for later, status `new`/`saved`/`accepted`/`rejected`, accepted playlist and track).
- **Seeded playlists:** New Music Friday, RADR Discoveries, RADR Spotlight.
- **Draft rules:** one open draft per playlist (unique index). Status flow `draft` → `approved` → `applied`, or `cancelled` (discarded). `ready` is still allowed; the UI shows it as "draft". A database trigger returns an approved draft to `draft` on any item change, so any edit cancels the approval. `playlist_draft_items` is unique on (draft, track). Item `source` is `existing`, `discovery` or `manual`. Tracks are canonical rows in `tracks`, linked to Spotify by `track_platform_matches`.

### SQL functions (security invoker, staff-checked, execute for `authenticated` only)
| Function | Purpose |
|---|---|
| `studio_add_track_to_draft(playlist_id, track jsonb, source)` | Find or create the open draft, reuse or create the canonical track and match, append at next position |
| `studio_seed_draft_from_tracks(playlist_id, tracks jsonb)` | Copy live playlist tracks into the draft as `existing`. Skips local files |
| `studio_reorder_draft(draft_id, item_ids uuid[])` | Save a drag-and-drop order. Rejects the save if the id list does not match |
| `studio_approve_draft(draft_id, live_hash, item_ids)` | Approve exactly what the preview showed. Records approver and time |
| `studio_discard_draft(draft_id)` | Discard an open draft. Spotify is not changed |
| `studio_accept_candidate(candidate_id, playlist_id)` | Add a matched candidate to the playlist's draft as `discovery`, mark accepted, log `discovery.accepted`. Needs a Spotify match. Never touches Spotify |

### Migrations (in `supabase/migrations/`, versions match the remote)
- `20261123023154_radr_playlists_foundation.sql`
- `20261123031717_studio_add_track_to_draft.sql`
- `20261123032434_studio_draft_seed_and_reorder.sql`
- `20261123034348_studio_approval_flow.sql`
- `20261123090115_studio_discovery_foundation.sql`
- `20261124215423_studio_top10_artworks.sql`

The remote also has 22 older August/September migrations that exist only there. Do not run `supabase db push`. Apply changes through the Supabase connector or SQL, then save a file with the version Supabase recorded.

### Edge Functions
| Function | Purpose | JWT check |
|---|---|---|
| `follow-on-spotify` | Public artist flow: follows RADR accounts for visitors (older Spotify app) | off |
| `studio-spotify` (v12 deployed, matches repo) | Studio, staff-only. Actions: `connect`, `disconnect`, `playlist_tracks`, `search` (returns `release_date`, optional `year_from`/`year_to`), `write_test`, `preview`, `sync`. Shared `getAccessToken` refreshes tokens | off (does its own staff check) |

Responses: `409 {needs_reconnect: true}` when the Spotify login is gone or expired; `502 {spotify_status}` when Spotify itself errors.

### Secrets
- Public flow: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- Studio: `STUDIO_SPOTIFY_CLIENT_ID`, `STUDIO_SPOTIFY_CLIENT_SECRET`

---

## Spotify (Studio app)

- Separate app from the public follow app. Owner: `admin@artistradr.com` (Premium). Only user in User Management.
- Redirect URIs: `http://127.0.0.1:5174/studio/spotify/callback` and `https://studio.artistradr.com/studio/spotify/callback`.
- Scopes: `playlist-read-private`, `playlist-read-collaborative`, `playlist-modify-public`, `playlist-modify-private`.
- **Status: connected. Reads, search and writes verified. Approved sync works end to end, conflict detection confirmed.**

### Provider limits (verified Nov 2026)
- Spotify Development Mode: Premium owner, 5 users, restricted endpoints after the Feb 2026 migration. Editorial playlists likely unreadable; new-releases and popularity data removed. Search max 10 results.
- Apple Music web API: create and add only; no remove or reorder.

---

## Studio file map

```
src/App.jsx                              StudioRoutes + build-mode switch (/studio/discovery is the real page)
src/studio/StudioLayout.jsx              sidebar + outlet
src/studio/StudioHome.jsx                overview cards
src/studio/ModulePage.jsx                placeholder page for unbuilt modules
src/studio/modules.js                    module registry (nav, status, features); Discovery may still be marked "coming soon" here
src/studio/studio.css                    shell styles (--rs-accent)
src/studio/spotify.js                    connect helpers (browser side, no secrets)
src/studio/StudioSpotifyCallback.jsx     finishes the Spotify login
src/studio/pages/PlaylistsPage.jsx       connection status, playlist list, "Open draft", live tracks behind a button, activity log panel
src/studio/pages/PlaylistTracks.jsx      read-only live tracks
src/studio/pages/PlaylistDraft.jsx       draft editor: numbered tracks, copy current, search, add, remove, drag reorder, review, approve, sync, discard
src/studio/pages/SpotifySearch.jsx       shared search: release dates, release-period filter, newest-first sort
src/studio/pages/DiscoveryPage.jsx       Discovery: add candidates (search or by hand), review, accept into a draft, manage sources
src/studio/pages/ActivityLog.jsx         activity log list (reads activity_logs)
src/studio/pages/playlists.css           page styles
src/pages/Admin/AdminDashboard/components/DashboardHeader.jsx   "← RADR Studio" button
src/pages/Auth/Profile.jsx               "Open RADR Studio" button (staff)
supabase/migrations/                     eight migrations listed above
supabase/functions/studio-spotify/index.ts   function source (matches deployed v12)
```

`WriteTestPanel.jsx` was removed from the Playlists page and the repo. The `write_test` action stays in the function (staff-only, harmless).

Routes in Studio mode: `/studio` (overview), `/studio/discovery`, `/studio/playlists`, `/studio/spotify/callback`, other module placeholders, and the existing `/admin`, `/admin/new`, `/admin/edit/:id` (Magazine).

---

## Where we are

**Done and working:** Studio shell and deployment to `studio.artistradr.com`, staff-only security, Spotify connection and token refresh, Spotify search with release dates and a release-period filter, draft editor with numbered tracks, review → approve → sync (tested, including refusal after an outside edit), activity log, Discovery (candidates, review, accept into draft, sources).

**Instagram discovery: dropped 2026-11-25.** The Meta Connect step was blocked and the feature is out of scope. Code, function source, tables and panel are removed (see the cleanup note at the end).

**Next, in order:**
1. **Friday auto-draft** (needs the artwork library, now built).
2. Finish rotating the exposed Supabase service-role key.
3. Decide Apple Music approach.
4. Phase 4: Studio modules (artwork, spotlights).

---

## Gotchas

- Use `127.0.0.1`, not `localhost`, for Studio locally (Spotify redirect rule). It is a separate origin, so sign in again.
- Vite reads env files only at startup. Restart the dev server after editing them.
- A Spotify login code works once. The callback page guards against React StrictMode running twice.
- Studio login goes to `/admin/login` and now lands on `/studio` (Studio build only; the public site still lands on `/admin`).
- Never paste secrets into chat or commit them. The Spotify Client ID is public; the Client Secret is not.
- supabase-js hides error bodies from Edge Functions in `error.context`; the Studio components read it to show plain-English messages.
- If Spotify shows `needs_reconnect`, disconnect and connect again on the Playlists page.
- Anything applied to the remote database must also be saved as a file in `supabase/migrations/`, named with the version Supabase recorded.
- Browsers rename repeated downloads (`index (1).ts`). Always check a file's first line and a `grep` before copying or deploying it.
- **Studio mode is set only in `.env.studio`.** Never put `VITE_APP_MODE=studio` in `.env`: it forces Studio mode on `npm run dev` and `npm run build` (public site redirects to the login). `npm run dev:studio` / `build:studio` set the mode themselves. Check a public build: postbuild prints "Wrote N static post page(s)" and `/admin/login` lands on `/admin`.
- Vite reads env only at startup, and moves to the next port if one is busy: stop old servers (`pkill -f vite`) before checking.
- Browser Supabase key is the `sb_publishable_...` key in `.env` and `.env.studio` (never the old `eyJ...` anon key, which is now rejected).
- Open security item: a real legacy `service_role` key exists in git history (`scripts/env.migration.example`, first commit). Rotation is in progress: both sites and both functions now use the new keys and pass live checks; the remaining step is deactivating the legacy keys (plan section 7, step 7). `studio-spotify` now reads `STUDIO_SECRET_KEY` first and falls back to `SUPABASE_SERVICE_ROLE_KEY`.

---

## Paste-ready kickoff for Claude Code

> Read `ARTIST_RADR_STATUS.md` and `ARTIST_RADR_PLAN.md` in the repo root. We are on branch `feature/studio` in `~/artist-radr`. Studio is live at studio.artistradr.com. Do not change existing public-site behaviour, and do not run destructive migrations or external account actions without asking. Spotify sync, Discovery and the activity log are built and working. Continue with the remaining items in the plan. Every new table needs staff-only RLS using `public.radr_is_staff()`, and tokens must stay server-side. Never deploy an Edge Function without checking the file's first line and contents first. Show a change preview and require approval before any live playlist change. Add named paths to `git add`, never `git add -A`.

## Top 10 Generator (2026-11-24)
- Added Studio page /studio/artwork/top10 (src/studio/pages/Top10Generator.jsx), menu item "Top 10 Generator" in modules.js.
- Loads tracks from radr_playlists via the studio-spotify edge function (playlist_tracks). Design C locked. Approve gates Download PNG.
- Added @fontsource/montserrat to package.json: run npm install before testing.
- Not done yet: Save to library (needs a storage bucket + table), Friday auto-run, monthly/random title presets.

## Submissions in Studio (2026-11-24)
- The "Originals" placeholder is replaced by "Submissions" at /studio/submissions (src/studio/pages/SubmissionsPage.jsx). It reuses the Magazine admin's useSubmissions hook and SubmissionsTab, so playlist_submissions approve/reject (and the Resend emails) work the same. /admin still works.
- Top 10 Generator: Save to library is live (bucket studio-artwork, table top10_artworks, migration 20261124215423 applied to project rjivkemajotafjvtalol).

## Publishing and Buffer removed (2026-11-24)
- Decision: staff post manually. Buffer and the Publishing module are out of scope. The Publishing item and `/studio/publishing` route are removed.
- Buffer code (Studio panel and `studio-buffer` function) was removed and never deployed. No BUFFER_API_KEY is needed.
- Cleaned up 2026-11-25: table `buffer_posts` dropped (migration 20261125063410). The empty public bucket `studio-public` could not be removed with SQL; delete it in Supabase, Storage.

## Studio layout (2026-11-24)
Sidebar and Overview cards come from `src/studio/modules.js`. Current order:
Overview, Discovery (live), Playlists (live), Studio (planned), Top 10 Generator (live, /studio/artwork/top10), Artwork library (live, /studio/artwork/library, added 2026-11-25), Submissions (live, /studio/submissions, replaces Originals), Magazine (live, /studio/magazine), RADR AI (planned).

## Open checks (2026-11-25)
- Not yet tested by a human: Save to library (`top10_artworks` has 0 rows) and Submissions approve/reject (`playlist_submissions` has 0 rows; make a test submission first, approval sends an email).
- Supabase advisor warnings, left as is: `is_radr_staff()` callable by anon (RLS policies may rely on it, so do not revoke without checking), `pg_net` in `public`, leaked-password protection off. `set_user_role` checks staff inside the function.
- Key rotation: steps 6 and 9 in the plan still open.

## Artwork library (2026-11-25)
- New page `src/studio/pages/ArtworkLibrary.jsx` at `/studio/artwork/library`. Lists `top10_artworks` (Approved / Archived), previews both images through 1-hour signed URLs from the private `studio-artwork` bucket, downloads dark and light, copies a caption built from the saved header, title line, date and tracks (ends with #RADRTOP10), and archives or restores a row. No new database change.
- Not yet run or tested.

## Magazine moved into Studio (2026-11-25)
- In the Studio build, blog posts live at `/studio/magazine` (list, stats, publish, feature, delete), `/studio/magazine/new` and `/studio/magazine/edit/:id`. They render inside the Studio sidebar, without the old admin sidebar. Wrappers: `src/studio/pages/MagazinePages.jsx`.
- `AdminDashboard` and `PostEditor` take an `embedded` prop. `src/pages/Admin/adminBase.js` exports `ADMIN_BASE` (`/studio/magazine` in Studio mode, `/admin` on the public site), used by every post link and redirect.
- In the Studio build `/admin`, `/admin/new` and `/admin/edit/:id` redirect to the new addresses. `/admin/login` stays. The public site (artistradr.com) keeps its own `/admin` unchanged.
- Playlist submissions are no longer shown inside the Magazine page in Studio; they are the Submissions item.
- Not yet run or tested. Test: list, New Post, save a draft, edit, publish, pin a featured post, delete a test post.

## Campaigns for approved submissions (2026-11-25)
- Approving a submission now sets a **campaign length in days** (box next to Approve, default 14; submissions approved from an old screen get 14). Columns on `playlist_submissions`: `campaign_days`, `campaign_started_at`, `campaign_ends_at`, `track_id`. New status `resolved`.
- **Countdown start:** the first time a playlist draft containing the song is applied (synced live), a trigger sets `campaign_started_at` and `campaign_ends_at`. All RADR playlists are treated as public. Changing the days after the start moves the end date.
- **Active campaigns** panel on the Playlists page, above the playlist list: countdown, change days, and "Add to playlist" (pick any RADR playlist; first time you pick the Spotify track, after that it is reused). It only adds to the draft; sync still needs review and approval. Component `src/studio/pages/ActiveCampaigns.jsx`.
- **Resolve:** when time is up the status becomes `resolved` (no email is sent; only approved and rejected send email). It runs hourly through pg_cron (`studio-resolve-campaigns`) and also whenever the Playlists or Submissions page loads. The song is not removed from the playlist automatically.
- SQL: `studio_add_submission_to_draft`, `studio_resolve_expired_campaigns`, triggers `studio_submission_campaign_defaults` and `studio_start_campaigns_on_apply`. Migrations `20261125063359_studio_campaigns.sql` and `20261125063403_studio_campaign_cron.sql`.
- Not yet run or tested in the app.

## Instagram and Buffer cleanup (2026-11-25)
- Removed code: `InstagramPanel.jsx`, `instagram.js`, `StudioInstagramCallback.jsx`, the `/studio/instagram/callback` route and the `supabase/functions/studio-instagram` source.
- Dropped empty tables `discovery_ig_accounts`, `discovery_ig_snapshots`, `buffer_posts` (migration `20261125063410_studio_cleanup_buffer_instagram.sql`). Old migration files stay in the repo so history matches the remote.
- Still to do by hand: delete the deployed function (`supabase functions delete studio-instagram`), delete the Supabase secrets `META_APP_ID` and `META_APP_SECRET`, delete the empty `studio-public` bucket in Storage, remove `VITE_STUDIO_META_APP_ID` from `.env.studio`, and delete or archive the Meta app "radr Studio".

## Artist campaigns: no user remove (2026-11-25)
- Artists can no longer delete or remove a campaign once it is sent. Sending = submitting, so every artist campaign is covered; only RADR staff can remove one.
- Database (applied to project rjivkemajotafjvtalol, file `supabase/migrations/20261125200000_campaigns_no_user_remove.sql`): dropped policy "Users can delete their own campaigns" on `campaigns`; `studio_campaign_guard_update()` now rejects a non-staff change to status `removed`. Pause and resume of active/paused campaigns still works for the artist.
- Dashboard (`src/pages/campaigns`): removed the Remove campaign, Edit budget and View history buttons and the remove handler. Pause/Resume shows only for active or paused campaigns.
- Wording: campaign goal "Editorial + algorithmic playlist placement" is now "Curated + algorithmic playlist placement" (existing rows keep the old text).
- Code is on branch `fix/campaign-dashboard-no-remove` (off `feature/studio`), pushed, not merged. Not linted, built or tested (no package installs in that session).
- Test: sign in as an artist, open /campaigns, open a campaign: no Remove, Edit budget or History; a direct delete or `status: 'removed'` update from the client should fail.
- Known gap: the new migration file is in the repo and live in Supabase, but the earlier guard triggers on `campaigns` were never saved as migration files; add them if the schema is rebuilt from the repo.


## Account area and billing (2026-11-26)
- Branch `feature/billing`, off `fix/campaign-dashboard-no-remove`. Not merged. Syntax checked and Billing/Profile previewed with stand-in data; full lint and build not run.
- Profile staff card now has one button, "Open RADR Studio". "Go to Admin" is gone; the public `/admin` route still exists.
- Account sidebar: Profile, My Campaigns, Billing. Dashboard and Settings removed; unused `CampaignSidebar.jsx` deleted.
- New `/campaigns/billing` page: budget totals, campaign billing, payment history. No online payment (no provider connected).
- `supabase/migrations/20261126000000_payments.sql` is **not applied**. Until it is, history shows as empty. After applying, rename the file to the recorded version. Staff have no screen for recording payments yet.
- Fixed the import casing `pages/Campaigns` to `pages/campaigns`. `App.jsx` also imports `pages/home/Home` while the file is `home.jsx` (matters on case-sensitive systems).
- `studio-campaigns-tab` (commit `52f450f`, Studio Campaigns tab) was merged into this branch on 2026-11-26.

## Studio overview cleanup (2026-11-26)
- On `feature/billing`: Playlists is marked live. The "Studio" and "RADR AI" modules are removed (overview cards, sidebar items, `/studio/create` and `/studio/ai` routes, and the unused `ModulePage.jsx`). Old addresses fall back to the overview. This replaces the sidebar order and file map listed earlier for these items.
