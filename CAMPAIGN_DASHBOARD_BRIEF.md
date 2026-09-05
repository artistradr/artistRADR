# Campaign Dashboard Session Brief

## Why
Promo page was funneling artists to "Submit Track" / "Explore Channels" — wrong model. Artist RADR promotion is campaign-based: artists should **Start a Campaign**, then manage it from a dashboard. This session replaced the CTA funnel and built that dashboard.

## What shipped

### 1. Real platform logos (replaces emoji icons everywhere)
- `src/components/PlatformLogos.jsx` — SVG brand marks: `SpotifyLogo`, `AppleMusicLogo`, `YoutubeLogo`, `TikTokLogo`, `AmazonMusicLogo`, `DeezerLogo` + `PLATFORM_LOGOS` lookup map. All accept `size`/`color` props.
- Wired into: `HomePromotion.jsx`, `EditorialPlaylists.jsx`, `MajorPlatformPromo.jsx`, `PromotionHero.jsx`, `YoutubeUGC.jsx` (subscribe icon only — campaign-type icons 📱🎬🔥 left as-is, not platform logos).

### 2. CTA funnel rewrite — everything points to /campaigns
| File | Old CTA | New CTA |
|---|---|---|
| `Promotion.jsx` (Navbar action) | Submit Track | Start Campaign |
| `Promotion.jsx` (bottom banner) | Submit Your Track | Start Campaign |
| `PromotionHero.jsx` (primary) | Submit Your Track | Start Campaign |
| `PromotionHero.jsx` (secondary) | Explore Channels | View Dashboard |
| `HomePromotion.jsx` | Explore Promotion Opportunities | Start Campaign |
| `EditorialPlaylists.jsx` | Submit to Playlists | Start Campaign |
| `MajorPlatformPromo.jsx` | Start Pitching | Start Campaign |
| `YoutubeUGC.jsx` | (unchanged — "Get Started with Video Promotion" link still points to submit-track flow, **not yet updated**) | — |

Untouched on purpose: "Read Success Stories" (blog link) and YouTube "Subscribe" — not funnel CTAs.

### 3. New Campaign Dashboard (`/campaigns`)
Built to mirror the Link (Stripe) wallet/recurring UI you screenshotted, mirrored so nav sits on the **right**:

- `pages/Campaigns/CampaignDashboard.jsx` — page shell, mock data, all state (select/create/pause/remove)
- `pages/Campaigns/components/CampaignList.jsx` — main list, also exports `PLATFORM_META` used by sibling components
- `pages/Campaigns/components/CampaignDetailPanel.jsx` — right-hand detail card: spend progress bar, status, actions (pause/resume, edit budget*, view history*, remove)
- `pages/Campaigns/components/NewCampaignPanel.jsx` — inline creation form (track name, platform picker, goal preset, budget) — replaces detail panel when "New Campaign" is clicked
- `pages/Campaigns/components/CampaignSidebar.jsx` — right-side nav (Dashboard/Campaigns/Billing/Settings), RADR brand mark, sticky, "+ Start Campaign" button, profile chip

Layout: `campaign-main` (flex, list) → `campaign-detail` (360px) → `campaign-sidebar` (240px, sticky) — sidebar last in DOM so it renders far right. Stacks vertically under 1080px.

*"Edit budget" and "View history" buttons render but have no handler yet — placeholders only.

### 4. Routing wired
- `App.jsx` — imports `CampaignDashboard` from `pages/Campaigns/CampaignDashboard`, registers `/campaigns` as a **bare, `PrivateRoute`-gated route** (same auth guard as `/profile`). Not in `routes.js`'s `getRoutes()` flatmap, same pattern as `/profile` and `/blog/:slug`.
- `routes.js` — added a **"My Campaigns"** nav entry under "Get Started" for discoverability. Deliberately has no `component` field so `getRoutes()` skips it (requires both `route` + `component`) — avoids double-registering `/campaigns`. Real route element lives only in `App.jsx`.

### 5. Layout matched to site-wide convention (was custom, now aligned to `BlogPage.jsx`)
`CampaignDashboard.jsx`'s width/grid was originally bespoke (1400px, flex, 240px sidebar, 24px gap, 3 columns). Rebuilt to match `BlogPage.jsx`'s established `.bp-layout` pattern exactly:

| | BlogPage | CampaignDashboard |
|---|---|---|
| Container | 1180px | 1180px |
| Top padding | 110px | 110px |
| Layout | `grid, 1fr 300px` | `grid, 1fr 300px` |
| Gap | 48px | 48px |
| Sidebar | 300px, sticky top 100px | 300px, sticky top 100px |
| Breakpoint | 860px → 1 column | 860px → 1 column |

Also collapsed 3 columns → 2: the separate detail-panel column is gone. `campaign-main` now swaps its contents in place — list by default, detail view or the new-campaign form when a campaign is selected / "New Campaign" is clicked — with a "← All Campaigns" back link. Only `campaign-main` (list) + sidebar remain as columns.

Mock campaign names also de-fictionalized: dropped song-title placeholders ("Midnight Hours," etc.) in favor of platform-labeled campaign types — **Spotify Editorial Playlist Campaign**, **YouTube Shorts & UGC Campaign**, **TikTok Sound Placement Campaign**.

### 6. Sidebar extracted into a shared, reusable component
`CampaignSidebar.jsx` (local to `pages/Campaigns/components/`) → **`src/components/AccountSidebar.jsx`** (shared, top-level). Reasoning: an account-area nav shouldn't live inside one feature's folder if it's meant to appear on Profile, Billing, Settings, etc. too.

Changes made in the move:
- **Self-contained styles** — carries its own `<style>` block (`.radr-acct-sidebar*` classes) so it works on any page without that page needing to duplicate sidebar CSS. `CampaignDashboard.jsx` had its sidebar CSS stripped out accordingly — single source of truth now lives in `AccountSidebar.jsx`.
- **Real auth user** — pulls `user` from `useSupabaseAuth()` instead of a hardcoded "Artist" placeholder name. Falls back to the email's local-part if no `displayName` is set.
- **Sign out wired in** — calls `logout()` from the same auth context Navbar uses, then navigates home.
- **New link added: Profile** (`/profile`) — nav is now Dashboard → My Campaigns → **Profile** → Billing → Settings.
- **`CampaignSidebar.jsx` is dead** — fully superseded, flagged for deletion from `pages/Campaigns/components/`, not left duplicated.

Usage anywhere else in the account area: `<AccountSidebar activeKey="profile" />` (or `"billing"`, `"settings"`, etc.) — same `1fr 300px` / 48px-gap grid as Blog/Campaigns, so it'll align automatically on any page already following that layout.

## Resolved this session
- **Vite import error** (`Failed to resolve import "./components/CampaignSidebar"`) — root cause was a typo'd folder: `src/pages/Campaigns/compoents/` instead of `components/`. Fixed by rename, not a code change.
- **Width/layout mismatch** — `CampaignDashboard.jsx` didn't match `BlogPage.jsx`'s established grid pattern (see table above). Rebuilt to match exactly.
- **3-column layout collapsed to 2** — detail panel no longer a separate column; renders inline in `campaign-main`.
- **Sidebar duplication risk** — extracted to shared `AccountSidebar.jsx` before a second page (Profile) could fork its own copy.

## Known gaps — flagged, not fabricated
- **No `campaigns` table in Supabase.** Dashboard runs entirely on local `MOCK_CAMPAIGNS` state. Refresh wipes any created/paused/removed campaign.
- **`AccountSidebar.jsx` not yet wired into Profile.** Component is built and ready (`<AccountSidebar activeKey="profile" />`), but I don't have `Profile.jsx` so haven't dropped it in.
- **`HomePromotion.jsx` file path guessed** (`pages/Home/components/`) — never confirmed against your actual tree.
- **`YoutubeUGC.jsx` bottom CTA missed** — still says "Get Started with Video Promotion" / links to `/submit-track`.
- **Sidebar nav links** (`/campaigns/billing`, `/campaigns/settings`) point to routes that don't exist yet — placeholders for future pages.
- **"Edit budget" / "View history"** buttons in `CampaignDetailPanel.jsx` are non-functional.
- **`CampaignDashboard` import path assumed** as `pages/Campaigns/CampaignDashboard` (matching the `pages/promotion/Promotion` casing already in your `App.jsx`) — confirmed correct now that the folder-name typo is fixed.
- **Delete `pages/Campaigns/components/CampaignSidebar.jsx` locally** — I can't delete files from your repo, only flag it. It's fully replaced by `components/AccountSidebar.jsx` and nothing imports it anymore; leaving it in place risks someone editing the dead copy later.

## Current file manifest (this feature)
```
src/components/PlatformLogos.jsx
src/components/AccountSidebar.jsx          ← shared, new
src/pages/Promotion/Promotion.jsx
src/pages/Promotion/components/PromotionHero.jsx
src/pages/Promotion/components/EditorialPlaylists.jsx
src/pages/Promotion/components/MajorPlatformPromo.jsx
src/pages/Promotion/components/YoutubeUGC.jsx
src/pages/Home/components/HomePromotion.jsx  ← path unconfirmed
src/pages/Campaigns/CampaignDashboard.jsx
src/pages/Campaigns/components/CampaignList.jsx
src/pages/Campaigns/components/CampaignDetailPanel.jsx
src/pages/Campaigns/components/NewCampaignPanel.jsx
src/pages/Campaigns/components/CampaignSidebar.jsx  ← DELETE, superseded
src/App.jsx
src/routes.js
```

## To-do
- [x] Register `/campaigns` route in `routes.js` + `App.jsx`
- [x] Fix Vite import error — folder was `compoents`, renamed to `components`
- [x] Match `CampaignDashboard.jsx` layout to `BlogPage.jsx`'s grid convention
- [x] Collapse 3-column layout to 2 (list/detail/form share one column)
- [x] Extract sidebar into shared `AccountSidebar.jsx`, wire real auth user + sign out
- [ ] Delete `pages/Campaigns/components/CampaignSidebar.jsx` from your repo
- [ ] Wire `<AccountSidebar activeKey="profile" />` into `Profile.jsx` — paste that file
- [ ] Confirm dev server compiles clean; check `Breadcrumbs`/`SEOHead` render correctly on `/campaigns`
- [ ] Add `campaigns` table in Supabase (columns roughly: `id`, `user_id`, `name`, `platform`, `status`, `budget`, `spent`, `goal`, `started_on`, `next_billing`, `payment_method`, `created_at`)
- [ ] Replace `MOCK_CAMPAIGNS` in `CampaignDashboard.jsx` with a real Supabase fetch (`execute_sql` verified) scoped to the logged-in artist
- [ ] Wire `handleCreate` to insert into `campaigns` table instead of local state
- [ ] Wire `handlePause`/`handleRemove` to update/delete against Supabase
- [ ] Confirm real path for `HomePromotion.jsx` in your tree — fix import path if it's not under `pages/Home/components/`
- [ ] Update `YoutubeUGC.jsx` bottom CTA to "Start Campaign" → `/campaigns`
- [ ] Decide on and build `/campaigns/billing` and `/campaigns/settings`, or repoint those sidebar links at something real
- [ ] Implement "Edit budget" (inline editor or modal) and "View history" (reuse Wallet-style transaction list pattern) in `CampaignDetailPanel.jsx`
- [ ] Vite alias check — confirm the `components` alias resolves `components/AccountSidebar` and `components/PlatformLogos` (same gotcha as the `data/` directory from earlier sessions)
