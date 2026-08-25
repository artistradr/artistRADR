# Artist RADR — Firebase → Supabase Migration Log

**Stack:** React + Vite SPA
**Supabase project:** `rjivkemajotafjvtalol` (eu-west-2)
**Firebase:** legacy, being fully retired
**Repo:** https://github.com/artistradr/artistRADR (private)

Order of operations: **content first, auth last.** Firebase stays live for auth only until explicitly cut over.

---

## Status Summary

| Area | Status |
|---|---|
| Content migration (WordPress → Supabase `posts`) | ✅ Complete, verified |
| Auth migration (Firebase → Supabase) | 🟡 In progress — core rewritten, untested end-to-end |
| Firebase code removal | ✅ Complete (this session) |
| Git repo setup | ✅ Complete (this session) |
| `home.jsx` posts source | ❌ Still on WordPress REST API, not Supabase |
| Promotion page | ✅ Built, reviewed |
| SEO infrastructure | ✅ Built, integrated into `App.jsx` |
| Data integrity (stats/playlists) | ✅ Shared source-of-truth files written |
| Vite `data/` alias | ⚠️ Gap — relative imports used as workaround |

---

## Completed

### Content Migration
- WordPress posts migrated to Supabase `posts` table, `wp_id` used as upsert key, `author_name` added.
- 13/13 posts migrated, 0 failures, verified via `execute_sql` (count + non-null checks).

### Auth Migration (partial)
- Fixed: `PrivateRoute`, `AppRoutes`, `ForgotPassword.jsx` (was a duplicate of `ResetPassword.jsx`), Supabase redirect URLs, profile role assignment.
- `AuthGateContext.jsx` rewritten to use Supabase (`signUp` / `signInWithPassword`), writing to `public.profiles` (`full_name`, `role`) instead of Firestore.
- Dead `<AuthProvider>` (Firebase) wrapper removed from `App.jsx`.
- **Not yet confirmed:** `Navbar.jsx` swap from `useAuth` → `useSupabaseAuth` — flagged as claimed but not verified in a prior session.

### Firebase Code Removal (this session)
- Deleted: `src/firebase.js`, `.firebaserc`, `firebase.json`, `functions/` (old Cloud Functions), `src/context/AuthContext.jsx` (unused Firebase auth context), orphaned duplicate `src/functions/`.
- Deleted `src/hooks/usePosts.js` — was unused; confirmed `home.jsx` fetches posts directly from WordPress REST API, not Supabase (see Open Items).

### Git Repository Setup (this session)
- `git init`, `.gitignore` built (secrets: `.env`, `serviceaccount.json`, Firebase admin keys; junk: `node_modules/`, `dist/`, `dist.zip`, `*-export.json`, `uid-mapping.json`).
- Verified no secrets staged, initial commit (162 files).
- Remote connected to `https://github.com/artistradr/artistRADR.git` (GitHub auto-renamed casing to `artistRADR`).
- Resolved push blocker: macOS Keychain had a stale cached GitHub credential (different account, numeric ID `305291348`) overriding the correct `artistradr` token (account ID `318411458`). Bypassed via one-time token-embedded remote URL push, then cleaned the URL back to plain form. Repo confirmed private, push/admin access verified via GitHub API.
- Firebase cleanup + Supabase auth rewrite committed and pushed to `origin/main`.

### Promotion Page
- `/promotion` route built: `Promotion.jsx`, `PromotionHero.jsx`, `EditorialPlaylists.jsx`, `MajorPlatformPromo.jsx`, `YoutubeUGC.jsx` — reviewed and documented.

### SEO Infrastructure
- `SEOHead.jsx`, `Breadcrumbs.jsx`, `getSeoRoutes.jsx`, `RouteSEO.jsx` built and integrated into `App.jsx`.
- `index.html` static layer confirmed solid for Google OAuth crawler.
- **Not yet confirmed:** correct mounting of `RouteSEO.jsx` inside Router context — needs `App.jsx` review.

### Data Integrity Fixes
- `src/data/spotifyFollows.js` — single source of truth for playlist data (was previously advertising playlists that didn't match real Spotify follow flows).
- `src/data/siteStats.js` — resolved contradicting stat claims across pages.
- Both written and ready to drop in.

---

## Open Items

1. **Test Supabase auth flow end-to-end** — register + sign-in. Watch for email confirmation step and RLS policy on `profiles` insert (flagged as a likely snag in the rewritten `AuthGateContext.jsx` comments).
2. **`home.jsx` posts source** — still fetching from WordPress REST API instead of Supabase `posts` table. Fix held pending file review.
3. **Confirm `Navbar.jsx` auth swap** — verify `useSupabaseAuth` import was actually applied.
4. **Confirm `RouteSEO.jsx` mounting** — review `App.jsx` for correct Router-context placement.
5. **Blog post pages** — reported broken at end of content migration session; triage started, not completed.
6. **`serviceaccount.json`** — open question whether it's git-tracked anywhere (potential secret exposure). Should audit git history, not just current `.gitignore` state.
7. **Vite `data/` alias** — no root-level alias for `src/data/`; relative imports used as stopgap. Same issue will recur when `HomeStats.jsx` / `PromotionHero.jsx` are dropped in.
8. **Auth cutover finalization** — Firebase stays live until explicit switch; full cutover is last step of migration.

---

## Key Learnings & Principles

- Never mark items done on assertion alone — flag "claimed but not shown" until the file is reviewed.
- Fabricated/contradicting data is a real risk — always cross-reference UI claims against actual data sources.
- Shared data files prevent contradiction drift — stats/playlists live in one source of truth, not duplicated per component.
- Vite alias config is a recurring gotcha — no bare root-level alias for `src/` utilities or `data/`; relative imports are the safe fallback until aliases are registered.
- Supabase auth context mismatch is the dominant bug pattern — converting components one at a time while guards remain on Firebase creates auth disagreement across the app.
- `dotenv` resolves relative to CWD, not script location — `.env.migration` must live at repo root when scripts run from there.
- PATs are tied to the account that created them — keychain-cached credentials can silently override the correct one; verify via `curl` against the GitHub API when push fails with "repository not found" despite correct-looking setup.

---

*Last updated: 2026-08-25 — session covering git repo setup, Firebase code removal, and Supabase auth rewrite.*
