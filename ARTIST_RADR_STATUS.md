# Artist RADR — Project Status & Handoff

**As of:** 2026-11-26
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
| `main` | At `a27fc15` (checked 2026-11-26). Its history already contains `feature/studio`, `studio-campaigns-tab`, `fix/campaign-dashboard-no-remove` and `feature/billing` (`feature/billing` points at the same commit as `main`). Whether `main` is what is live on artistradr.com was not checked |
| Current work | `feature/campaign-flow` = `main` plus the campaign work (flow, packages, Studio Campaigns tab, campaign playlists, Campaign playlists page, preview redesign, migration files, docs). Merging it into `main` is a clean fast-forward. A pull request from it into `main` was started on 2026-11-26; confirm on GitHub whether it was submitted and merged. Not deployed |
| Older branches | `feature/studio`, `studio-campaigns-tab`, `fix/campaign-dashboard-no-remove`, `feature/billing` are all already inside `main`. `spotify-promo-setup` (`a0f9581`) not checked |
| Rollback tag | `live-before-studio` |
| Studio commits pushed | `88fa3ed` (Spotify, draft editor, approval and sync), `0f717ba` (Discovery, activity log), `61322dc` (release dates, test panel removed), `0004d37` (restored correct `studio-spotify`), `0586ca0` (Instagram function, migration, watchlist panel). Run `git log -1 --oneline` for the latest |
| Uncommitted | `package-lock.json` shows modified locally (2026-11-26); leave it out of commits. Run `git status --short` before starting work |

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
npx eslint src         # lint the app code (see the lint note under Gotchas)
```
Do not paste `# comment` text after a command in the terminal: zsh passes it to npm as arguments and `npm run build` fails.

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
Checked 2026-11-26: the repo has 24 migration files, from `20261123023154_radr_playlists_foundation.sql` to `20261126084037_campaign_playlists_drop_redundant_index.sql`, and every one matches a version and name on the remote. This covers the Studio, discovery, campaign, payments, packages and campaign playlists migrations. The seven campaign files that were missing are saved, and `campaigns_no_user_remove` is now `20261125200403` (the old `20261125200000` file is deleted).

The remote also has 22 older August/September migrations (`20260818225122_initial_schema` to `20260907193853_backfill_unstructured_editor_content`, including `create_campaigns_table`) that exist only there. Do not run `supabase db push`. Apply changes through the Supabase connector or SQL, then save a file with the version Supabase recorded.

### Edge Functions
| Function | Purpose | JWT check |
|---|---|---|
| `follow-on-spotify` | Public artist flow: follows RADR accounts for visitors (older Spotify app) | off |
| `studio-spotify` (v12 deployed, matches repo) | Studio, staff-only. Actions: `connect`, `disconnect`, `playlist_tracks`, `search` (returns `release_date`, optional `year_from`/`year_to`), `write_test`, `preview`, `sync`. Shared `getAccessToken` refreshes tokens | off (does its own staff check) |
| `spotify-track-search` (v1) | Artist-side song search / pasted Spotify track link in the campaign flow | off |
| `campaign-playlist-lookup` | Studio, staff-only. Looks up a pasted Spotify playlist link: title, cover, whether the campaign's song is in it | see function source |

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
supabase/migrations/                     24 migrations from 20261123 on (see Migrations above)
supabase/functions/studio-spotify/index.ts   function source (matches deployed v12)
```

`WriteTestPanel.jsx` was removed from the Playlists page and the repo. The `write_test` action stays in the function (staff-only, harmless).

Routes in Studio mode: `/studio` (overview), `/studio/discovery`, `/studio/playlists`, `/studio/spotify/callback`, other module placeholders, and the existing `/admin`, `/admin/new`, `/admin/edit/:id` (Magazine).

---

## Where we are

**Done and working:** Studio shell and deployment to `studio.artistradr.com`, staff-only security, Spotify connection and token refresh, Spotify search with release dates and a release-period filter, draft editor with numbered tracks, review → approve → sync (tested, including refusal after an outside edit), activity log, Discovery (candidates, review, accept into draft, sources).

**Built on `feature/campaign-flow`, run locally and reported working by the editor (2026-11-26), not merged into `main` or deployed:** artist account area and Billing page (no online payment), checkout-style new campaign flow with Spotify song search, campaign packages (Starter, Basic, Supercharge, Pre-save), redesigned artist campaign preview, Studio's "Playlists for the artist" attach screen, and Studio's Campaign playlists page (a campaign-by-campaign view and an all-playlists view; Partner curators is a placeholder). Database changes for all of these are live in Supabase and all their migration files are in the repo; the website and Studio builds are not live.

**Checks run 2026-11-26 (editor's Mac):** `npm run build:studio` passes. `npm run build` passes (the first attempt failed only because a `# comment` was pasted after the command). `npx eslint src` ran fine per the editor. `npm run lint` (`eslint .`) reports 541 problems, but the config only ignores `dist`, so it also lints the minified `dist-studio/` bundle and the Node scripts; fix the ignore list (see Gotchas) before trusting that number. The preview changes of 2026-11-26 (below) were pushed after these checks and are not yet re-checked.

**Instagram discovery: dropped 2026-11-25.** The Meta Connect step was blocked and the feature is out of scope. Code, function source, tables and panel are removed (see the cleanup note at the end).

**Next, in order (updated 2026-11-26):**
1. ~~Test the campaign work locally~~ Done 2026-11-26 (reported working by the editor: Campaign playlists page and attach flow).
2. ~~Save the missing migration files~~ Done 2026-11-26 (see Migrations).
3. ~~Work out which branch contains which~~ Done 2026-11-26: `main` already contains the other branches; `feature/campaign-flow` fast-forwards into it.
4. **Re-run `git pull`, `npx eslint src`, `npm run build` and `npm run build:studio`** after the 2026-11-26 preview changes, check the new tracker, Renew button and compact playlists in `npm run dev`, then submit and merge the pull request into `main`, rebuild and upload both sites. Deploy `campaign-playlist-lookup` if the live copy differs.
5. **Payments:** choose a provider, build a staff screen to record payments.
6. **Partner curators** (list, approval, partner playlists on campaigns, earnings) once payments exist.
7. **Friday auto-draft** (needs the artwork library, now built).
8. Finish rotating the exposed Supabase service-role key (plan section 7, steps 6 and 9).
9. Decide Apple Music approach.
10. Phase 4: Studio modules (artwork, spotlights).

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
- **Lint:** `eslint.config.js` only ignores `dist`. `eslint .` therefore also reads `dist-studio/` (minified, hundreds of false errors) and Node files such as `server.js`, `*.cjs` and `scripts/`. Use `npx eslint src` until the ignore list is fixed (open item in plan Phase 9).
- `npm install` reports 66 vulnerabilities (2026-11-26). Do not run `npm audit fix --force`; review separately.
- Open security item: a real legacy `service_role` key exists in git history (`scripts/env.migration.example`, first commit). Rotation is in progress: both sites and both functions now use the new keys and pass live checks; the remaining step is deactivating the legacy keys (plan section 7, step 7). `studio-spotify` now reads `STUDIO_SECRET_KEY` first and falls back to `SUPABASE_SERVICE_ROLE_KEY`.

---

## Paste-ready kickoff for Claude Code

> Read `ARTIST_RADR_STATUS.md` and `ARTIST_RADR_PLAN.md` in the repo root. We are on branch `feature/campaign-flow` in `~/artist-radr` (it fast-forwards into `main`). Studio is live at studio.artistradr.com. Do not change existing public-site behaviour, and do not run destructive migrations or external account actions without asking. Spotify sync, Discovery and the activity log are built and working. Continue with the remaining items in the plan. Every new table needs staff-only RLS using `public.radr_is_staff()`, and tokens must stay server-side. Never deploy an Edge Function without checking the file's first line and contents first. Show a change preview and require approval before any live playlist change. Add named paths to `git add`, never `git add -A`.

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
Update 2026-11-26: on `feature/campaign-flow` the Studio and RADR AI placeholders are gone, and Campaigns (live, /studio/campaigns) and Campaign playlists (live, /studio/campaign-playlists) sit after Submissions, before Magazine.

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
- Database (applied to project rjivkemajotafjvtalol, file `supabase/migrations/20261125200403_campaigns_no_user_remove.sql`, renamed 2026-11-26 to match the remote version): dropped policy "Users can delete their own campaigns" on `campaigns`; `studio_campaign_guard_update()` now rejects a non-staff change to status `removed`. The database still lets an artist pause and resume an active campaign, but the artist screen no longer has that button (removed 2026-11-26, see the preview update below).
- Dashboard (`src/pages/campaigns`): removed the Remove campaign, Edit budget and View history buttons and the remove handler.
- Wording: campaign goal "Editorial + algorithmic playlist placement" is now "Curated + algorithmic playlist placement" (existing rows keep the old text).
- Code was on branch `fix/campaign-dashboard-no-remove`, which is now inside `main`.
- Test: sign in as an artist, open /campaigns, open a campaign: no Remove, Edit budget or History; a direct delete or `status: 'removed'` update from the client should fail.
- Known gap: the earlier guard triggers on `campaigns` were never saved as migration files; add them if the schema is rebuilt from the repo.


## Account area and billing (2026-11-26)
- Branch `feature/billing`, now inside `main`. Syntax checked and Billing/Profile previewed with stand-in data; full lint and build were not run on it alone.
- Profile staff card now has one button, "Open RADR Studio". "Go to Admin" is gone; the public `/admin` route still exists.
- Account sidebar: Profile, My Campaigns, Billing. Dashboard and Settings removed; unused `CampaignSidebar.jsx` deleted.
- New `/campaigns/billing` page: budget totals, campaign billing, payment history. No online payment (no provider connected).
- The `payments` migration is applied (recorded as `20261126025112_payments`, saved in the repo). Staff have no screen for recording payments yet.
- Fixed the import casing `pages/Campaigns` to `pages/campaigns`. `App.jsx` also imports `pages/home/Home` while the file is `home.jsx` (matters on case-sensitive systems).
- `studio-campaigns-tab` (commit `52f450f`, Studio Campaigns tab) was merged into this branch on 2026-11-26.

## Studio overview cleanup (2026-11-26)
- On `feature/billing`: Playlists is marked live. The "Studio" and "RADR AI" modules are removed (overview cards, sidebar items, `/studio/create` and `/studio/ai` routes, and the unused `ModulePage.jsx`). Old addresses fall back to the overview. This replaces the sidebar order and file map listed earlier for these items.

## New campaign flow redesign (2026-11-26)
- Branch `feature/campaign-flow`, off `main`. Previewed with stand-in data; full lint and build not run at that time.
- Checkout-style flow: Track, Goal, Package, Review, with a live summary and a success screen. Saves the same fields as before. No online payment.
- `src/pages/campaigns/`: `CampaignDashboard.jsx`, `useCampaigns.js`, `rowToCampaign.js`, `flow/`, `styles/`. `NewCampaignPanel.jsx` removed. Keep these files at 300 lines or fewer.
- Studio's `CampaignsPage.jsx` was not changed.

## Campaign flow: layout and Spotify track search (2026-11-26)
- On `feature/campaign-flow`. The flow uses the account page layout with the sidebar. No amounts show until a budget is chosen.
- Artists search a song or paste a Spotify track link, then pick it. Artwork and details show in the flow, campaign list and campaign detail. Typing a name without picking still works.
- Applied and deployed (see "Supabase applied" below): the `campaigns_spotify_track` migration, then `spotify-track-search`. If the function is ever live without the column, sending a campaign with a picked song fails.
- Studio's Campaigns tab does not show the artwork yet.
- Earlier open issue (artist changing `name`, `platform`, `goal` or `budget` through the API) is closed by `campaigns_lock_artist_fields`.

## Supabase applied (2026-11-26)
- Applied: `payments`, `campaigns_spotify_track`, `campaigns_lock_artist_fields`. Deployed `spotify-track-search` (v1). This replaces the earlier "not applied" and "not yet live" notes, and closes the open issue about artists editing campaign fields.
- Rolled-back database test passed: artists cannot edit locked fields, remove or self-approve campaigns, or add payments; staff can approve, edit and add payments; artists can pause and resume.
- Function logs show successful (200) searches, and one campaign is saved with a Spotify track.
- The database also has `campaigns_release_day_reserve` (20261126072323). Its SQL file is now saved in the repo.
- Staff still have no screen for recording payments. Studio's Campaigns tab does not show artwork.

## Campaign packages (2026-11-26, branch `feature/campaign-flow`, not deployed)

- Budget step is now packages: 1 Week $25, 2 Weeks $50 (Recommended), 1 Month $100, Custom from $50 (1 week to 2 months), Pre-save from $50 (future release date, optional release-day spot request). One price per campaign.
- Prices, lengths and wording: `src/pages/campaigns/packages.js`. The database checks the same prices and lengths, so change both together.
- Playlist, listener and stream figures are shown as targets, not guarantees. Open: confirm which package "10K+ streams" belongs to (shown on 1 Month), and review the wording against Spotify's rules on paid services that advertise streams or guarantee placement.
- Supabase: migration `20261126073345_campaigns_packages` applied (new `package` column, price/length check on insert, `package` locked for artists). `release_date` and `reserve_release_spots` came from `20261126072323_campaigns_release_day_reserve` (SQL file now in the repo).
- Studio Campaigns tab shows package, release date, spot request and song; approval suggests the package length (pre-save: through release day). Live Studio keeps the 14-day default until redeployed.
- Release-day spots are a request only; nothing holds playlist slots automatically. No payment is taken.
- Tested: database rules (rolled back), flow and Studio page in a browser with sample data, syntax check.

### Package update (2026-11-26, replaces the package list above)

- Packages: Starter $25, Basic $50 (Recommended), Supercharge $100 to $999 (replaces 1 Month and Custom), Pre-save from $50. No durations are shown or chosen; staff set days at approval (14 suggested; pre-save: through release day).
- Supercharge: slider, +$25/+$50/+$100 add-funds buttons or typed whole dollars. Target steps are in `SUPERCHARGE_TIERS` in `packages.js` ($100, 200, 300, 500, 750, 999). The numbers above $100 were proposed by Claude and need confirmation that RADR can deliver them.
- Supabase: migration `20261126075217_campaigns_supercharge` applied.
- Adding funds applies only before a campaign is sent. Topping up a running campaign is not built (no payments yet).
- Tested: database rules (rolled back), flow and Studio page in a browser with sample data, syntax check.
- Still open: Spotify rules on paid services that advertise streams or guarantee placement.

## Campaign playlists (2026-11-26, branch `feature/campaign-flow`, not deployed)

**Artist side (campaign preview redesign)**
- Header: bigger song artwork, song name, status chip and package chip. The balance and progress bar at the top are removed; the package row shows plain price text (e.g. "Basic · $50").
- Progress tracker: see "Campaign preview update" below (it replaced the first four-step version).
- Playlists section: each attached playlist's cover and title, linking to Spotify. Until playlists are attached it shows a short waiting message that depends on the campaign status. Only Spotify-hosted images are shown.
- An artist sees newly attached playlists the next time the campaigns page loads.

**Studio side**
- Campaigns tab, open a campaign: new "Playlists for the artist" section (`src/studio/components/CampaignPlaylists.jsx`, `campaignPlaylists.css`; `CampaignsPage.jsx` gained 3 lines). Paste a Spotify playlist link, look it up (title, cover, whether the campaign's song is in it), then "Attach to campaign". Remove deletes the attached row.
- The song check is a best-effort guide, not a block: a playlist can be attached even if the song was not found.

**Database and functions (applied live)**
- Table `campaign_playlists` (columns: `id`, `campaign_id`, `spotify_playlist_id`, `title`, `image_url`, `added_by`, `created_at`); migrations `20261126082204_campaign_playlists`, `20261126084025_campaign_playlists_unique_and_added_by`, `20261126084037_campaign_playlists_drop_redundant_index`. The same playlist cannot be attached twice to a campaign; `added_by` is filled automatically.
- RLS: artists read only playlists on their own campaigns; only staff add or remove.
- Edge Function `campaign-playlist-lookup` (staff-only) deployed; source in `supabase/functions/campaign-playlist-lookup`.
- Security advisor flagged nothing new from this work.
- The three migration SQL files are now saved in the repo (2026-11-26).
- Checked 2026-11-26: the table still has two identical unique indexes on (`campaign_id`, `spotify_playlist_id`). Harmless, but the "drop redundant index" migration did not leave just one. Tidy later.

**Verification**
- Run locally by the editor on 2026-11-26 and reported working (attach flow and the Campaign playlists page).
- All new or changed artist-side files are under 300 lines.
- Studio and the public site both need rebuilding and uploading before any of this is live. The playlist must be public.

**Test on the Mac**
```bash
cd ~/artist-radr && git fetch origin && git switch feature/campaign-flow && git pull --ff-only origin feature/campaign-flow && npm run build && npm run dev
```
If Git refuses to switch, do not force it. In a second terminal run `npm run dev:studio`, open a clearly labeled test campaign, attach a public playlist, then open the campaign as the artist. Attaching saves real rows in the live Supabase project; Remove deletes them.

**Possible follow-ups:** show attached playlists on the artist's campaign list; email the artist when playlists are added; show song artwork in Studio's Campaigns tab.

## Campaign playlists page in Studio (2026-11-26, commit `554a2c2`, `feature/campaign-flow`, not deployed)

A Studio place where admins post and see the playlist links attached to campaigns. Sidebar item "Campaign playlists" at `/studio/campaign-playlists` (after Campaigns). No database change: it uses the existing `campaign_playlists` table and the `campaign-playlist-lookup` function.

- **Our playlists tab, "By campaign" view:** campaign list on the left (song artwork, title, artist, status chip, how many playlists are attached or "None yet"), with search, a status filter (default: waiting or running) and an "only campaigns with no playlists yet" box. The selected campaign's attach panel is on the right: paste a Spotify playlist link, look it up (title, cover, whether the song is in it), attach, or remove. Same attach panel as the Campaigns tab.
- **"All playlists" view:** every attached playlist across campaigns, grouped so a playlist carrying several songs shows once, with the campaigns it is attached to. Click a campaign to jump to it. Search by playlist, song or artist.
- **Top of page:** three counts: open campaigns with no playlist yet, playlist links attached, different playlists.
- **Partner curators tab:** placeholder only ("Coming soon"). Curators with active playlists will be able to earn from Artist RADR; nothing is stored or built yet. See plan Phase 10.
- Files: `src/studio/pages/CampaignPlaylistsPage.jsx` (277 lines), `campaignPlaylistsPage.css`, `src/studio/components/AllCampaignPlaylists.jsx`, `PartnerCurators.jsx`, `campaignSong.js` (helpers). `CampaignPlaylists.jsx` gained an optional `onChange` prop so the page's counts refresh after an attach or remove. `modules.js` and `App.jsx` gained one entry each.
- Playlists are found by hand: staff look for playlists that carry the song and paste the links. There is no automatic scan of RADR's own playlists for the song yet.
- Artwork shows only when it is Spotify-hosted (`i.scdn.co`), as on the artist side.
- Run locally by the editor on 2026-11-26 and reported working. Not fully linted. Test: open the page, pick a test campaign, attach and remove a public playlist, check the counts and the All playlists view, then view the campaign as the artist.

## Campaign preview update (2026-11-26, branch `feature/campaign-flow`, commits `91dc59b`, `b2d2c04`, `4648108`; not run, linted or built; not deployed)

Changes to the artist's campaign page (`src/pages/campaigns/`):
- **Tracker:** two steps, **Running → Completed** ("Submitted", "In review" and "Live" are gone). A campaign shows Running from the moment it is sent (statuses pending, active and paused); Completed shows when the status is completed. Restyled as a slim, Stripe-style timeline: small dots joined by a thin line, a check mark on finished steps, a softly pulsing dot on the current step (`StatusTracker.jsx`, `styles/detail.css`).
- **Pause removed:** the Pause/Resume campaign button is gone from the artist screen (`CampaignDetailPanel.jsx`, `CampaignDashboard.jsx`). `togglePause` is still in `useCampaigns.js`, unused. The database still allows an artist to pause through the API, and staff can still pause in Studio. A paused campaign shows a "Paused" status chip.
- **Renew campaign:** a "Renew campaign" button appears only when the campaign is Completed. It opens the new campaign flow titled "Renew Campaign" with the song, goal and platform filled in, starting at the Package step (`renewDraft` in `flow/flowConfig.js`, `renewFrom` prop on `NewCampaignFlow.jsx`). The package, price and release date are chosen again, and it is sent for review like any new campaign. A goal that is no longer in the list falls back to the first goal.
- **Playlists:** attached playlists are compact rows with a 44px cover (was 132px, about 3 times smaller) and the title and "Open on Spotify" link beside it (`PlaylistCovers.jsx`, `styles/detail.css`).
- Test: pull, run `npm run dev`, open a pending, an active and a completed campaign. Check the tracker on each, that no Pause button shows, that Renew shows only on the completed one and opens with the song filled in, and that attached playlists look right on a phone width.

## Paystack checkout connected (2026-11-26, branch `feature/campaign-flow`, not deployed)
- Cause of "campaigns send without payment": the `paystack` Edge Function was deployed but no page called it.
- New campaigns are saved as pending, then the browser goes to Paystack checkout. If checkout can't open, the campaign stays saved with a **Pay now** retry.
- **Pay now** also shows on unpaid pending campaigns (campaign preview and Billing). Billing verifies the returning `reference` with the server.
- Currency is USD (function default). Whether the Paystack account accepts USD has not been confirmed.
- Billing styles moved to `styles/billing.css`.
- Checked: syntax and local imports only. Not built, linted or run; no test payment made yet. The older "no online payment" notes above are replaced by this section.
- Still open: Studio does not show paid/unpaid before approval; approval does not require payment; test webhook URL to be confirmed in Paystack.
