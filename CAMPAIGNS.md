# Artist RADR — Campaign System Spec
`CAMPAIGNS.md` — companion to `MIGRATION.md`, Section 26+

## 0. Why this doc exists

The `/promotion` page CTAs were switched from "Submit Track" / "Explore Channels" to
**Start Campaign**, and they all point at `/campaigns`. That route doesn't exist yet.
This doc defines what `/campaigns` actually is before any more code gets written, so
we don't end up with a dashboard that has nothing to show and no gate stopping someone
from landing on an empty state.

**Core rule driving everything below:**

> An artist cannot see a Campaign Dashboard until they have started at least one
> campaign. `/campaigns` is a gate, not a dashboard. It shows a dashboard *only if*
> the artist has ≥1 campaign; otherwise it shows the Start Campaign flow.

---

## 1. User Flow

```
Artist clicks "Start Campaign" anywhere on the site
              │
              ▼
        GET /campaigns
              │
   ┌──────────┴──────────┐
   │                      │
No campaigns yet     Has ≥1 campaign
   │                      │
   ▼                      ▼
Show StartCampaign     Show CampaignDashboard
   (form/wizard)        (sidebar on the RIGHT)
   │
   ▼
Submit → create campaign record → redirect to
/campaigns (now resolves to CampaignDashboard)
```

Secondary entry point: `/campaigns/new` — a direct, bookmarkable link to the Start
Campaign form, used by CTAs that specifically mean "start a new one" even when the
artist already has campaigns (e.g. a "+ New Campaign" button inside the dashboard
itself).

Every CTA that currently says **Start Campaign** across `Promotion.jsx`,
`HomePromotion.jsx`, `PromotionHero.jsx`, `EditorialPlaylists.jsx`, and
`MajorPlatformPromo.jsx` continues to link to `/campaigns` — the gate logic decides
what the artist actually sees, so the links don't need to change again.

---

## 2. Routes

| Route | Component | Behavior |
|---|---|---|
| `/campaigns` | `CampaignsRoute.jsx` (thin wrapper) | Checks for existing campaigns. Renders `StartCampaign` or `CampaignDashboard`. |
| `/campaigns/new` | `StartCampaign.jsx` | Always shows the start form, regardless of existing campaigns. |
| `/campaigns/:campaignId` | `CampaignDashboard.jsx` | Dashboard scoped to one campaign, sidebar on the right. |

`routes.js` needs three new entries mirroring the existing pattern used for
`/promotion` and `/submit-track`.

---

## 3. Data model

No backend yet, so campaigns live in `localStorage` under key `radr_campaigns`,
shaped as an array. This keeps the gate logic (`campaigns.length > 0`) trivial and
gives us a real shape to swap for an API call later without touching components.

```js
// data/campaignModel.js (shape reference, not enforced at runtime yet)
{
  id: "camp_8f2ac1",              // nanoid or crypto.randomUUID()
  status: "active",                // "active" | "paused" | "completed" | "draft"
  createdAt: "2026-08-25T19:00:00Z",

  track: {
    title: "",
    artistName: "",
    coverArtUrl: "",
    releaseDate: ""
  },

  platforms: ["spotify", "apple-music", "youtube", "tiktok"], // subset selected in the wizard

  goal: "playlist-placement",      // "playlist-placement" | "ugc-shorts" | "editorial-pitch" | "full-push"

  budget: {
    amount: 0,
    currency: "USD"
  },

  metrics: {                       // populated later; zeroed/mock at creation
    reach: 0,
    placements: 0,
    streams: 0,
    engagementRate: 0
  }
}
```

Helper module `data/campaignStore.js` exposes `getCampaigns()`, `getCampaign(id)`,
`createCampaign(payload)`, `updateCampaign(id, patch)` — all sync, all reading/writing
`localStorage`. This is the only file that touches storage directly.

---

## 4. Pages & components to build

```
src/pages/Campaigns/
├── CampaignsRoute.jsx          # gate: no campaigns → StartCampaign, else → CampaignDashboard
├── StartCampaign.jsx           # the "start a campaign" page/wizard
├── CampaignDashboard.jsx       # dashboard shell, sidebar on the RIGHT
├── components/
│   ├── StartCampaignForm.jsx   # multi-step or single-page form
│   ├── PlatformPicker.jsx      # reuse PlatformLogos.jsx, multi-select chips
│   ├── DashboardSidebar.jsx    # right-aligned nav: Overview / Analytics / Platforms / Budget / Settings
│   ├── DashboardOverview.jsx   # main panel: campaign summary + metric cards
│   ├── CampaignCard.jsx        # used if artist has multiple campaigns (a picker/list view)
│   └── EmptyDashboardState.jsx # fallback illustration/copy if a campaignId is invalid
└── data/
    └── campaignStore.js
```

### StartCampaign.jsx
- Reuses `promo-section-label` / `promo-section-title` pattern already established.
- Form fields: track title, artist name, cover art (optional upload/url), release
  date, platform picker (`PlatformLogos.jsx` — Spotify/Apple Music/YouTube/
  TikTok/Amazon), goal (radio cards), budget (optional).
- Submit button: **Launch Campaign** — calls `createCampaign()`, redirects to
  `/campaigns/{newId}`.
- Same visual language as `PromotionHero`: `#f7f6f3` → white gradient, white cards,
  `0.5px solid rgba(0,0,0,0.06)` borders, `#D94F2B` accent.

### CampaignDashboard.jsx
- Layout: **content on the left, sidebar nav on the right** — this is the one
  layout inversion from the reference screenshots, everything else (card style,
  spacing, color) stays identical to `Promotion.jsx`'s conventions.
- Grid: `grid-template-columns: 1fr 280px;` (content, then sidebar) so the sidebar
  sits on the right without needing `order` hacks — just column order in the
  markup matches visual order here since we want it right-aligned by default.
- Top bar: campaign track title + status pill (`active`/`paused`/etc, same pill
  style as "Open for Submissions" in `EditorialPlaylists.jsx`).
- Main panel: metric cards (reach, placements, streams, engagement) using the
  same white-card/hover-lift pattern as `MajorPlatformPromo.jsx` platform cards.
- Sidebar (right): sticky nav, `#D94F2B` active-state left border (mirrored to
  right border since it's now on the right edge of content), sections —
  Overview, Analytics, Platforms, Budget, Settings, **+ New Campaign** button
  pinned at the bottom.

---

## 5. Branding constants to reuse (do not redefine)

| Token | Value | Source |
|---|---|---|
| Accent | `#D94F2B` | used everywhere already |
| Display font | `var(--font-display)` | `F.d` in every component |
| Body font | `var(--font-body)` | `F.b` |
| Card bg | `white` | |
| Card border | `0.5px solid rgba(0,0,0,0.06)` | |
| Card radius | `16px`–`20px` | 16 for compact cards, 20 for feature cards |
| Card shadow (rest) | `0 2px 12px rgba(0,0,0,0.04)` | |
| Card shadow (hover) | `0 12px 40px rgba(0,0,0,0.08)` | |
| Section bg alternation | `#f7f6f3` / `#fff` | `.promo-section:nth-child(even)` |
| Pill/tag style | `rgba(217,79,43,0.06)` bg, `rgba(217,79,43,0.15-0.2)` border, `#D94F2B` text | "Open for Submissions" pattern |

`CampaignDashboard.jsx` will need its own local `promo-section-label` /
`promo-section-title` style block, same fix already applied once for the
sidebar-switch work, since the dashboard doesn't nest under `Promotion.jsx`.

---

## 6. Navbar

`Promotion.jsx` currently passes:
```js
action={{ type: "internal", route: "/submit-track", label: "Submit Track" }}
```
This should become:
```js
action={{ type: "internal", route: "/campaigns", label: "Start Campaign" }}
```
so the persistent nav CTA matches the rest of the page. Worth confirming whether
other pages' Navbars should also point here, or just Promotion's.

---

## 7. Open questions before build

1. **Multiple campaigns**: if an artist has 2+ campaigns, does `/campaigns` show
   the *most recent* dashboard directly, or a picker (`CampaignCard.jsx` grid)
   first? (Spec above assumes: 1 campaign → straight to dashboard, 2+ → picker
   grid, then into `/campaigns/:id`.) Confirm this is the intended behavior.
2. **Metrics source**: mock/random data for now, or wire to something real later?
3. **Budget field**: required at launch, or optional/edit-later from the
   dashboard's Budget tab?
4. **Draft campaigns**: does "Save as Draft" exist on the Start Campaign form, or
   is it launch-only for v1?

---

## 8. Build order

1. `data/campaignStore.js` + `campaignModel.js` (shape + localStorage helpers)
2. `StartCampaign.jsx` + `StartCampaignForm.jsx` + `PlatformPicker.jsx`
3. `CampaignsRoute.jsx` (the gate)
4. `CampaignDashboard.jsx` shell + `DashboardSidebar.jsx` (right-aligned)
5. `DashboardOverview.jsx` + metric cards
6. `CampaignCard.jsx` picker (only if answer to Q1 above needs it)
7. Route wiring in `routes.js`, Navbar CTA update
8. Re-verify every existing "Start Campaign" link across the 5 files still
   resolves correctly through the new gate

