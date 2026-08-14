# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current implementation status (verified 2026-08-13)

The repository has completed the migration foundation and the first two protected frontend features. Treat the status below as the current baseline; do not describe planned work as implemented.

| Area | Status | Verified implementation / boundary |
| --- | --- | --- |
| Phases 0-2 | Complete | The backend runs on Node.js with `better-sqlite3`; the API contract is frozen in `docs/api-contract.md`; ADR 0001 locks the same-origin SvelteKit `/api` proxy topology. |
| Phase 3 - frontend foundation | Complete | `frontend/` is a SvelteKit + TypeScript app using `@sveltejs/adapter-node`, shared UI primitives, app styling, an API client, frontend contract types, toast/auth/activity/polling stores, and the rescued sample workbook at `frontend/static/samples/sample-contacts.xlsx`. |
| Phase 4 - authentication | Complete | Login/register, server-side protected/public layout guards, cookie-aware session lookup, safe post-login redirects, central 401 handling, app chrome, and logout invalidation are implemented. |
| Phase 5 - SMTP configuration | Complete | `/configs` loads saved configurations and supports create, view, edit, delete, set-default, test-connection, Gmail app-password help, masked passwords, and refetch-after-mutation behavior. Editing omits `pass` unless the user supplies a replacement. |
| Phase 6 - compose and upload | Complete | `/send` is fully implemented; `lib/api/email.ts` wraps `POST /parse-excel` and `POST /provider-info`. Reusable components `ConfigSelector`, `ContactUploader`, `ContactPreviewTable`, `EmailRangeSelector`, `SubjectField`, `PlaceholderHelp`, `TemplateUploader`, `ProviderLimitPanel`, and `EmailPreviewModal` handle composition, recipient range math, browser template reading, provider caps, and live personalized previews. `RichTextEditor` is upgraded to a browser-only TipTap editor with HTML source toggle. |
| Phase 7 - sending modes | Complete | Full 16-field multipart `POST /send` pipeline is implemented via `buildSendFormData()`; boolean fields serialize as literal `"on"`; `BatchSettings`, `ScheduleSettings`, and `SendSuccessModal` handle batch estimation, scheduling with IANA timezone detection & UTC ISO conversion, email notification tests via `POST /test-notification`, desktop notifications, `activities` store logging, and 3-mode dispatch outcomes. |
| Phase 8 - dashboard & monitoring | Complete | Adaptive monitoring driven by `GET /dashboard/poll-status` (3s active batch, 10s running scheduled, 30s pending scheduled, 0 requests when idle); `BatchMonitor` provides live progress bar, sent/failed metrics, next-batch display countdown, and Pause/Resume/Cancel (`DELETE /batch-cancel`) controls; `ScheduledJobsPreview` renders up to 5 scheduled jobs in local timezone; `ActivityTimeline` consumes persisted `activities` store. Full timer teardown on route unmount. |
| Phases 9-14 | Planned, not implemented | Scheduled jobs management, reports, old-frontend removal, final polish, documentation, and submission verification remain future work. `/scheduled` and `/reports` are intentionally scaffold pages. |

Latest code checks for this baseline:

- Backend `npm.cmd run typecheck` passed (0 errors).
- Frontend `npm.cmd run check` passed with 0 errors and 0 warnings; `npm.cmd run lint` passed (0 errors, 0 warnings).
- Frontend `npm.cmd run build` completed successfully with `@sveltejs/adapter-node`.

### Immediate next work

Implement Phase 9 from `../mainplan.md` (Scheduled Jobs Management). Phase 8 dashboard and adaptive monitoring workspace is complete. Phase 9 will implement `/scheduled` full management, cancellation with `DELETE /scheduled-jobs/:id`, local timezone formatting, running job cancel guards, and auto-refresh.

## What this is

A **Bulk Email Sender**, split into two independently-run processes in this repo:

- **Backend** (repo root, `src/`) — Hono on Node.js, SQLite (`better-sqlite3`), Nodemailer. This is a migration target frozen by the assignment brief (`task1.md`): **do not modify backend logic, routes, or DB schema.** It was itself just migrated off Bun onto Node (`git log`: "migrate runtime from Bun to Node.js") — `bun:sqlite` → `better-sqlite3`, `Bun.serve` → `@hono/node-server`.
- **Frontend** (`frontend/`) — SvelteKit (Svelte 5, TypeScript, Tailwind v4), replacing the legacy vanilla-JS UI in `public/`. This is the part actually being built/graded.

The two run as separate dev servers (backend `:3000`, frontend `:5173`) and are wired together by a same-origin proxy — see Architecture below before touching any cross-cutting auth/API code.

## Authoritative docs — read before inferring behavior

This repo carries its own planning trail; don't re-derive decisions that are already recorded:

- **`docs/api-contract.md`** — the frozen, source-verified contract for all 28 backend routes (request/response shapes, quirks, footguns). Treat this as ground truth for any frontend API call; it also lists where `PROJECT_ASSIGNMENT.md`'s example endpoints don't match the real routes.
- **`docs/adr/0001-frontend-backend-topology.md`** — why the frontend proxies `/api/*` to the backend server-side instead of calling it cross-origin with CORS (the backend's `cors()` wildcard + `sameSite: "Lax"` cookie make direct cross-origin calls unfixable without editing backend auth code, which is off-limits).
- **`detailedplan.md`** — the full implementation plan, phase roadmap, and a risk register (§16) of specific footguns ported from the old frontend (timezone handling for `scheduledTime`, `FormData` boundary corruption, `"on"`-vs-`"true"` boolean fields, etc.).
- **`task1.md`** / **`PROJECT_ASSIGNMENT.md`** — the hiring brief and project brief. Co-equal top authority per `detailedplan.md` §0.1, but where either disagrees with the actual backend code, **the code (and `docs/api-contract.md`) wins**.

**Workspace planning artifact:** `../mainplan.md` is outside this repository and now contains the master completion plan plus a detailed Phase 6 plan. Use it to sequence the next implementation, but treat source code and the frozen API contract as the proof of what has actually been completed.

## Commands

### Backend (run from repo root)

```
npm install
cp .env.example .env        # fill in SMTP_* etc.
npm run dev                 # tsx watch src/app.ts — serves on :3000
npm run typecheck           # tsc --noEmit (same as `npm run build`; no compiled output is committed)
npm run reset-db            # deletes data/users.db and data/scheduler.db
npm run clean                # deletes dist, uploads/*, logs/*, data/users.db
```

There is no automated backend test suite — `npm test` is a stub that just echoes a pointer to `detailedplan.md` §11's manual verification protocol.

### Frontend (run from `frontend/`)

```
npm install
cp .env.example .env        # BACKEND_ORIGIN must point at the running backend
npm run dev                 # vite dev — serves on :5173
npm run check                # svelte-kit sync && svelte-check (type-checks .svelte files too)
npm run lint                 # eslint .
npm run format                # prettier --write .
npm run build && npm run preview
```

No automated frontend test suite exists either — same situation as the backend.

### Running the full stack locally

Start the backend first (`npm run dev` at repo root, port 3000), then the frontend (`npm run dev` in `frontend/`, port 5173). The frontend's `.env` needs `BACKEND_ORIGIN=http://localhost:3000` and `PUBLIC_API_BASE_URL=/api`. Always go through the frontend origin (`:5173`) in a browser — hitting the backend directly bypasses the proxy and the session cookie won't behave the same way.

## Architecture

### The `/api` proxy is load-bearing, not incidental

The browser only ever talks to the SvelteKit origin. `frontend/src/routes/api/[...path]/+server.ts` is a catch-all that strips the `/api` prefix and forwards everything (including multipart bodies and cookies) to `BACKEND_ORIGIN`, then relays `Set-Cookie` back down verbatim. This exists because the backend's `cors()` call (`src/app.ts`) allows only wildcard origins (no credentials) and its session cookie is `sameSite: "Lax"` — both are backend auth code that `task1.md` forbids changing, so cross-origin `fetch` with credentials cannot work directly. See ADR 0001 for the full reasoning and for hard requirements the proxy must keep honoring (strip `content-encoding`/`content-length`/`transfer-encoding`, use `getSetCookie()`, forward with `redirect: 'manual'`, never set `Content-Type` on a forwarded body, set `x-forwarded-proto` from the real inbound protocol only).

`frontend/src/lib/api/client.ts` is the single fetch wrapper every frontend API call should go through — it always sends `credentials: 'include'`, sets `Content-Type: application/json` for string bodies but deliberately leaves it unset for `FormData` (so the browser generates the multipart boundary), and on a `401`/`success:false` response clears the auth store and redirects to `/login` (except for `/auth/me`, where a 401 is an expected "not logged in" answer, not a failure).

### Authentication (implemented — Phase 4)

Two independent guards, both built on `lib/server/session.ts`'s `getSessionUser(cookies, fetch)`, which calls the backend's `/auth/me` **directly via `BACKEND_ORIGIN`** (not through the app's own `/api` proxy — that would be a pointless self-request) with a hand-set `Cookie` header, since SvelteKit's load-`fetch` only auto-forwards cookies to same-origin/relative URLs, never to an absolute cross-origin one:

- **`(app)/+layout.server.ts`** — protects the app shell. No session → `redirect(302, '/login?redirectTo=…')`. Backend unreachable → `error(503, …)`, deliberately **not** treated the same as "logged out" (a restart shouldn't look like a logout). A live session's `user` flows into `LayoutData`, so any page under `(app)` gets `data.user` for free.
- **`(auth)/+layout.server.ts`** — the inverse guard on `/login`/`/register`. Already-authenticated visitor → `redirect(302, '/dashboard')`. Backend unreachable → renders the form anyway (no protected content is at risk, and blocking the only way back into the app during an outage would be worse than letting the submit fail with a real error). This guard redirects on `user` truthy, into the *other* group only — that asymmetry with `(app)`'s `!user` check is what makes a redirect loop impossible.

`lib/api/auth.ts` (`login`/`register`/`logout`/`me`) is the client-side counterpart — it owns writing to the `authUser` store on every call that establishes or confirms a session, matching the precedent in `client.ts` where `handleUnauthorized()` already mutates the store on 401. `me()` isn't on this app's own control-flow path (the guards above call the backend directly instead) — it exists for any future client-triggered session recheck. `(app)/+layout.svelte` mirrors the server-resolved `data.user` into the store client-side only (`if (browser) setAuthUser(...)`) — **never write `authUser` from `.server.ts` load code**, since it's a module-scope `writable` and Node SSR shares that scope across concurrent requests. Logout calls `goto('/login', { invalidateAll: true })`, not a plain `goto` — cookies aren't a tracked `load` dependency, so without `invalidateAll` nothing tells SvelteKit that `(app)/+layout.server.ts`'s previously-resolved `{ user }` is stale, which is what "blocks back-navigation" in the exit gate actually depends on.

`lib/utils/redirect.ts`'s `resolveRedirectTarget` is the client-side open-redirect guard for the post-login destination (rejects non-relative and protocol-relative `//` targets, and anything pointing back into `(auth)`); its server-only counterpart, `buildRedirectTarget` in `lib/server/session.ts`, builds the `redirectTo` query param in the first place. The two are split across the `$lib/server/*` boundary because SvelteKit fails the build if a server-only module is imported from client code — this is deliberate protection for `BACKEND_ORIGIN`, a private env var the browser must never see.

The Phase 3 component gallery (`routes/__gallery/`) that once sat outside both route groups — and therefore rendered unauthenticated — has been deleted now that Phase 4 is done; the `ui/` primitives it exercised are unaffected.

### SMTP configuration (implemented - Phase 5)

`/configs` is the completed configuration-management route. Its `+page.ts` loads `GET /config/smtp` through `lib/api/config.ts` and registers the `app:configs` dependency; mutation handlers invalidate that dependency instead of maintaining a second, divergent local fetch path. `ConfigList`, `ConfigCard`, `ConfigForm`, `ConfigDetails`, `TestConnectionButton`, and `ProviderHelp` keep feature code under `lib/components/config/` while continuing to reuse generic `ui/` controls.

Important invariants:

- Render the backend's `userConfigs[]` order unchanged; it is already default-first and newest-first.
- Never place a password in the DOM. `GET /config/smtp` has a known plaintext-password response hazard in its active `data` object, while `userConfigs[]` intentionally omits it. `ConfigDetails` masks it.
- For an edit, omit the `pass` key unless a user actually entered a new password. Sending `pass: ""` overwrites the stored credential and breaks later sending.
- The actual backend endpoints are `POST /config/smtp/test` (full config body) and `POST /config/smtp/:configId/default`; do not copy the stale assignment examples that include `:id/test` or `:id/set-default`.
- `GET /config/smtp/active` is already exposed by `lib/api/config.ts` for Phase 6's future selector; it may omit `configId` and `configName` when no user default exists, so both remain optional frontend fields.

### Campaign composition (implemented - Phase 6)

`/send` provides the complete campaign preparation workspace. `lib/api/email.ts` interfaces with `POST /parse-excel` (single multipart field `excelFile`) and `POST /provider-info` (multipart fields `smtpHost`, `hasNotification`). Components `ConfigSelector`, `ContactUploader`, `ContactPreviewTable`, `EmailRangeSelector`, `SubjectField`, `PlaceholderHelp`, `TemplateUploader`, `ProviderLimitPanel`, and `EmailPreviewModal` organize composition into focused stages:
- **Contact parsing:** Parses the uploaded `.xlsx` file via the backend, rendering the first five contacts and the authoritative total count.
- **Recipient Range math:** Pure utility `computeRecipientRange()` converts 1-based user input (all, first N, or custom row range) into a 0-based `start` and a positive `count`.
- **Content precedence:** Uploaded HTML template (`htmlTemplate`) takes precedence over rich-text editor HTML (`htmlContent`); editor is made optional when a template is attached.
- **Live Preview:** Uses `replacePlaceholders()` with actual parsed contact data (falling back to generic placeholder definitions only when no contacts are loaded).
- **Provider Limit Guard:** Displays provider caps and blocks composition if selected contacts exceed the provider's max allowances.

### Sending modes & delivery execution (implemented - Phase 7)

`/send` enables full campaign dispatch across Immediate Sequential, Batch Processing, and Scheduled Delivery modes:
- **Centralized 16-field payload builder:** `lib/utils/sendForm.ts` (`buildSendFormData`) produces the exact multipart form payload required by `POST /send` (`configId`, `subject`, `htmlContent`, `delay`, `useBatch`, `batchSize`, `batchDelay`, `emailDelay`, `scheduleEmail`, `scheduledTime`, `notifyEmail`, `notifyBrowser`, `emailRangeStart`, `emailRangeCount`, `excelFile`, `htmlTemplate`).
- **Boolean string serialization:** Checkbox/boolean fields (`useBatch`, `scheduleEmail`, `notifyBrowser`) are explicitly serialized as literal `"on"` or `"off"` strings, matching the server's strict `=== "on"` checks.
- **Timezone conversion:** Local datetime strings from `<input type="datetime-local">` are converted to UTC ISO format (`new Date(local).toISOString()`) before transmission, preventing timezone skew between client and server.
- **Dynamic Provider Limit Reactivity:** Whenever `notifyEmail` is toggled or updated, `getProviderInfo(host, !!notifyEmail)` re-executes to enforce the 1-email deduction reserved for completion notifications on restricted providers (Gmail/Yahoo/Outlook).
- **Notification alerts & live test:** `POST /test-notification` is wired via `testNotification()` with real-time UI feedback; browser desktop notification permissions are requested on demand.
- **Activity Store:** `lib/stores/activity.ts` records dispatch events (`started`, `scheduled`) with automatic dual-storage synchronization (`localStorage` and `sessionStorage`).
- **Discriminated Success Modal:** `SendSuccessModal.svelte` presents dedicated completion views for Scheduled (Job ID, local/UTC timestamps, delivery mode), Batch (batch size, pauses, delays, Job ID), and Immediate modes, with fast routes to `/reports` and `/dashboard`.

### Dashboard and Adaptive Monitoring (implemented - Phase 8)

`/dashboard` is the operational landing workspace that observes active campaigns and background workers:
- **Adaptive Polling Engine (`lib/stores/polling.ts`):** Polling cadence is strictly dictated by the backend's `GET /dashboard/poll-status` response:
  - `3000ms` when an active batch job is running (`hasActiveBatch`).
  - `10000ms` when a scheduled job is executing (`hasRunningScheduledJobs`).
  - `30000ms` when pending scheduled jobs exist (`hasScheduledJobs`).
  - **Zero requests / idle** when `pollNeeded === false` (no ongoing background timers).
  - Handles the error-path 200 response (`pollNeeded: false` with `error` string) by recording `serviceDegraded` without declaring false healthy idleness.
  - Guarantees **complete timer teardown** in Svelte `onDestroy()` and on route navigation. Exactly one timer handle is active at any time.
- **Active Batch Monitor (`BatchMonitor.svelte`):**
  - Consumes authoritative batch data from `GET /dashboard/data` and `GET /batch-status`.
  - Truthful progress bar derived from `(emailsSent + emailsFailed) / totalContacts` with ARIA `role="progressbar"`.
  - Metrics breakdown: Sent, Failed, Current Batch / Total Batches, Batch size and interval delays.
  - Isolated display countdown derived from `nextBatchTime` (runs on 1s interval only while job is `Running`, terminated on pause, completion, or teardown).
  - Batch Controls: **Pause** (`POST /batch-pause`), **Resume** (`POST /batch-resume`), and **Cancel** (`DELETE /batch-cancel`, protected by confirmation dialog). Immediately triggers `triggerStateCheck()` on mutation.
- **Scheduled Jobs Preview (`ScheduledJobsPreview.svelte`):**
  - Renders up to 5 upcoming scheduled campaigns from `GET /dashboard/data`.
  - Converts UTC ISO schedule times to the user's local timezone.
  - Displays recipient count, batch vs sequential execution tags, status badges with accessible non-color-only text, and alert email indicators.
- **Recent Activity Timeline (`ActivityTimeline.svelte`):**
  - Connects to the persisted `activities` store (`lib/stores/activity.ts`), displaying chronological dispatch events across user sessions with clear event badge icons and timestamps.

### Backend structure (`src/`)

- `app.ts` — Hono app setup. A single hand-rolled middleware gates every path except an explicit `publicPaths` allowlist (`/auth/`, `/login`, `/register`, `/public/`, `/css/`, `/js/`, `/favicon.ico`); everything else runs `middleware/auth.ts`'s `authMiddleware`, which accepts either a `session_token` cookie or an `Authorization: Bearer` header. Root `/` has special-cased redirect-to-login/dashboard logic. It also still serves the legacy `public/` static frontend — the assignment calls for that folder's removal, but as of this file it's still wired in `app.ts`, so don't assume it's gone.
- `routes/` — one file per feature area (`auth`, `config`, `send`, `report`, `dashboard`, `index`). `docs/api-contract.md` maps every route to its file/line and documents exact request/response shapes — check it instead of re-reading route source for shape questions.
- `services/` — business logic, notably:
  - `batchService.ts` holds **one in-memory batch job at a time**; state is lost on restart and a second batch cannot start while one is running.
  - `schedulerService.ts` polls once a minute, so scheduled sends can fire up to 60s late.
  - `logService.ts` writes to `logs/email-logs.json`, not SQLite — logs are global across all users (routes never scope them by `userId`).
  - `userDatabase.ts` owns `data/users.db` (users, sessions, smtp_configs); `data/scheduler.db` holds scheduled jobs.
- `types.ts` — the shared type definitions (`Contact`, `EmailJob`, `BatchJob`, `ScheduledJob`, etc.); the frontend's `lib/types/api.ts` mirrors these independently since the two are separate npm packages.

### Frontend structure (`frontend/src`)

- `routes/(auth)/` — login/register, public, guarded by `(auth)/+layout.server.ts` (see Authentication above).
- `routes/(app)/` — the protected app shell (dashboard, send, configs, reports, scheduled), guarded server-side by `(app)/+layout.server.ts`.
- `routes/api/[...path]/+server.ts` — the backend proxy described above.
- `lib/api/client.ts` — the only place API calls should be issued from; implemented feature modules are `auth.ts` and `config.ts`. Phase 6 must add `email.ts` on top of this wrapper rather than calling `fetch` directly.
- `lib/server/session.ts` — server-only (`$lib/server/*`) session resolution shared by both route guards; not importable from client code.
- `lib/stores/` — `auth.ts` (current user), `polling.ts` (dashboard polling cadence — the poll interval is driven by the backend's `pollInterval` value from `/dashboard/poll-status`, not hardcoded), `toast.ts`, `activity.ts`.
- `lib/components/ui/` — generic components (Button, Modal, Table, Toast, `RichTextEditor`, …). `RichTextEditor` is currently a textarea-compatible shell and must be replaced by a lazy browser-only rich editor in Phase 6. `lib/components/shared/` contains app chrome (Navbar, Sidebar, UserMenu, Footer). Feature status: `config/` is implemented; `dashboard/`, `email/`, and `reports/` still contain placeholder barrels.
- Adapter is `@sveltejs/adapter-node` (required — `adapter-static` cannot run the proxy route; locked in by ADR 0001).

### Backend response-shape gotchas worth knowing before writing frontend code against them

These are documented in full in `docs/api-contract.md` §2–§9; the highlights that most easily cause silent bugs:

- Every numeric field on `POST /send` is parsed server-side as `parseInt(...) || <default>`, so a literal `0` silently falls back to the default — most dangerously, `emailRangeCount=0` becomes "send to everyone," not "send to no one."
- `useBatch`, `scheduleEmail`, `notifyBrowser` are compared against the literal string `"on"`, not `"true"`/boolean.
- Omitting `pass` on `PUT /config/smtp/:id` leaves the stored password untouched; sending an empty string overwrites it with `""`.
- `GET /health` requires an authenticated session (401 without one) — it's not a public liveness endpoint despite looking like one.
- `GET /report`, `GET /scheduled-jobs`, and the batch-control endpoints are not scoped per user — every authenticated user sees the same global data.
