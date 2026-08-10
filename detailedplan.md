# Detailed Implementation Plan — Bulk Email Sender Frontend Migration

> **Scope of this document.** This is the single authoritative implementation plan for the assignment contained in the `assignment` folder. It was produced by a full recursive inspection of every file in that folder. Only this file (`detailedplan.md`) has been created or modified. No application code, configuration, markdown, or asset has been changed.

---

## 0. How To Read This Document

### 0.1 Authority Order Of Source Documents

| Rank | Document | Role |
| --- | --- | --- |
| 1 | `task1.md` | The hiring-side assignment brief. Defines the contract, the hard constraints, the evaluation criteria, and the submission requirement. |
| 1 | `PROJECT_ASSIGNMENT.md` | The project-specific brief. Defines the concrete migration target, feature list, schema, UI/UX expectations, checklists, and deliverables. |
| 2 | `README.md` | Contextual support. A condensed restatement of `PROJECT_ASSIGNMENT.md`, emphasising SvelteKit frontend, old-frontend removal, documentation, and UI/UX. |
| 3 | Source code under `src/`, `public/` | Ground truth for actual behaviour. Where a document's example contradicts the code, the code wins for implementation, and the contradiction is recorded in §2. |

`task1.md` and `PROJECT_ASSIGNMENT.md` are treated as co-equal highest priority. Where they conflict, the conflict is recorded explicitly in §2 rather than silently resolved.

### 0.2 Labelling Convention

Every requirement in this plan carries one of the following tags:

- **[EXPLICIT]** — stated in words in a source document.
- **[INFERRED]** — not stated, but follows necessarily from something that is. The reasoning is always given.
- **[OPTIONAL]** — marked optional / recommended / suggested in a source document.
- **[NOT SUPPORTED]** — requested by the planning brief that commissioned this document, but absent from the assignment sources. Recorded so nothing is lost, and explicitly excluded from scope so nothing is invented.

### 0.3 What This Plan Deliberately Does Not Do

- It does not invent features. Anything not traceable to a source document is either tagged `[INFERRED]` with justification or `[NOT SUPPORTED]` and excluded.
- It does not silently resolve contradictions. Every one is listed in §2.
- It does not contain application code. It contains file paths, module boundaries, route names, field names, sequencing, and acceptance criteria.

---

## 1. Source Discovery — Complete Recursive File Inventory

The `assignment` folder was enumerated recursively. Thirty-eight files exist outside `.git`. Every one is listed below with its current role and its required migration action. Nothing is skipped.

### 1.1 Repository State

- Git repository present. Two commits: `8fed56f Initial commit of assigment1 project`, `37d361c Add GitHub Actions workflow pr-checks.yml`.
- Remote `origin` → `https://github.com/AradhyaMalaviya/assigment1.git`.
- Working tree clean at time of inspection; all 38 files are tracked, including `detailedplan.md`.
- **Note:** `data/`, `uploads/`, and `logs/` directories described in `PROJECT_ASSIGNMENT.md` §"Current Project Structure" **do not exist** in the repository. They are created at runtime by `src/app.ts` → `initializeDirectories()`, `FileService.saveUploadedFile()`, `LogService.initializeLogsDirectory()`, `UserDatabase` constructor, and `SchedulerService` constructor. `.gitignore` excludes their contents. This is consistent, not an error, but it means a fresh clone has no database and no logs until first run.

### 1.2 Root Files

| # | File | Current Role | Required Action |
| --- | --- | --- | --- |
| 1 | `.env.example` | Template for `PORT`, `SESSION_SECRET`, primary SMTP (`SMTP_HOST/PORT/SECURE/USER/PASS`, `FROM_EMAIL`, `FROM_NAME`), and optional notification SMTP (`NOTIFICATION_SMTP_*`, `NOTIFICATION_FROM_NAME`). | Extend with the frontend/backend origin variables introduced by the split (`FRONTEND_ORIGIN`, and the frontend's own API base URL variable). Do **not** remove or rename existing keys — `src/routes/config.ts` and `src/routes/send.ts` read them by exact name. |
| 2 | `.gitignore` | Ignores `node_modules`, `out`, `dist`, coverage, `logs`, dotenv files, caches, `uploads/*`, `data/*`. Contains a duplicated `uploads/*` line and non-standard log patterns (`_.log`, `report.[0-9]_...`). | Add frontend artefacts: `.svelte-kit/`, `frontend/build/`, `frontend/.env*`, `frontend/node_modules/`. Remove the duplicate `uploads/*`. Ensure `package-lock.json` is **not** ignored (it must be committed for `npm ci` in CI). |
| 3 | `bun.lock` | Bun dependency lockfile (20 KB). | Delete after the Node/npm migration and replace with `package-lock.json`. Keeping it contradicts the target runtime and will confuse reviewers. |
| 4 | `CONTRIBUTING.md` | Contributor guide. Instructs `bun install`. Describes `src/routes`, `src/services`, `src/middleware` (labels them "Express", which is inaccurate — the project uses Hono). | Update install/dev commands to npm. Add a frontend section. Correct the "Express" wording to Hono. Add the frontend folder to the File Organization block. |
| 5 | `detailedplan.md` | This document. | Preserve as the implementation roadmap. It is the only file this planning pass writes. |
| 6 | `index.ts` | Dead file: `console.log("Hello via Bun!")`. Not imported anywhere. | Delete. The real entrypoint is `src/app.ts`. Note that `.github/labeler.yml` references `index.ts` — update that reference too. |
| 7 | `package.json` | Backend manifest, `version 2.0.0`. Scripts are Bun-based (`bun run --watch`, `bun build`). Dependencies: `hono ^3.12.0`, `nodemailer`, `xlsx`, `multer`, `csv-stringify`, `dotenv`, `argon2`. `engines` lists both node ≥18 and bun ≥1. **`multer` is declared but never imported anywhere in `src/`** — uploads are handled by `c.req.formData()`. | Convert scripts to Node/npm. Add `@hono/node-server`, `better-sqlite3`, `tsx`, `@types/better-sqlite3`. Drop `bun-types`. Remove the unused `multer` and `@types/multer` (**[INFERRED]** — `PROJECT_ASSIGNMENT.md` lists multer in its example backend `package.json` and says "Update `multer` middleware for file uploads (already using it)", but the code does not use it; removing dead dependencies is a code-quality point under `task1.md`'s "Code quality, clarity, and maintainability"). If uncertainty about the brief's wording is a concern, keeping multer is harmless — but then say so in the README rather than leaving it unexplained. |
| 8 | `PROJECT_ASSIGNMENT.md` | The detailed project brief: objectives, current structure, six feature areas with example endpoints, database schema, UI/UX requirements, suggested SvelteKit folder structure, backend migration guide, frontend setup guide, 9-phase checklist, testing requirements, deployment considerations, evaluation criteria (30/40/20/10), deliverables, pro tips, common issues, success indicators. | Treat as the primary feature and acceptance contract. Every checklist item in it is mapped in §3. |
| 9 | `README.md` | Condensed brief. Three objectives (SvelteKit frontend, remove old frontend, update documentation), UI/UX design principles, pro tips. | Replace, after implementation, with the migrated project's real README per the blueprint in §13. |
| 10 | `task1.md` | Hiring assignment. Free framework choice, backend logic and DB structure unchanged, clean/maintainable/production-ready, proper folder structure and scalability patterns, evaluation criteria, GitHub repository link as submission. | Treat as the outer contract. Its constraints bound everything below. |
| 11 | `tsconfig.json` | `target ES2022`, `module ESNext`, `moduleResolution bundler`, `allowImportingTsExtensions`, `noEmit: true`, `strict: true`, `types: ["bun-types"]`, includes `src/**/*`. | Retarget for Node: `moduleResolution` to `NodeNext` or `Bundler` consistent with the chosen build tool, drop `bun-types`, add `@types/node`. Because `noEmit: true`, `tsc` currently cannot produce a `dist/` — if `npm run build` is to emit JavaScript, `noEmit` must be turned off in the build config. See §6.4 for the pre-existing type errors that `strict: true` will surface the first time `tsc --noEmit` actually runs. |

### 1.3 GitHub And Editor Files

| # | File | Current Role | Required Action |
| --- | --- | --- | --- |
| 12 | `.github/CODE_OF_CONDUCT.md` | Standard Contributor Covenant. | No change. Not affected by migration. |
| 13 | `.github/labeler.yml` | Path-to-label mapping. `frontend` → `public/**/*`, `**/*.html`, `**/*.css`, `public/js/**/*`. `backend` → `src/**/*.ts`, `index.ts`. Also `documentation`, `dependencies`, `services`, `routes`, `middleware`, `config`, `tests`, `ci-cd`. | Rewrite `frontend` to point at `frontend/**/*` (`.svelte`, `.ts`, `.css` inside it). Remove the `public/**/*` and `index.ts` globs once those are deleted. Add `frontend/svelte.config.js`, `frontend/vite.config.ts` to `config`. |
| 14 | `.github/PULL_REQUEST_TEMPLATE.md` | Standard PR template with description, type, changes, issues, testing, checklist, screenshots. | **[OPTIONAL]** Add backend/frontend verification checkboxes. Not required by any source document. |
| 15 | `.github/workflows/pr-checks.yml` | Four jobs: `validate` (Node 18, `npm ci`, `npm run build \|\| npx tsc --noEmit`, lint, test), `pr-title-check`, `size-check`, `label-pr`. | **This workflow is currently broken**: it runs `npm ci`, but the repository has `bun.lock` and no `package-lock.json`, so `npm ci` fails. Fix by committing `package-lock.json` during the Node migration, then extend the job to install and check both `./` (backend) and `./frontend`. Bump `node-version` to 20 (**[INFERRED]** — `better-sqlite3` prebuilds and current SvelteKit both target Node 20+; Node 18 is end-of-life). |
| 16 | `.vscode/settings.json` | Empty object `{}`. | **[OPTIONAL]** Add Svelte/Prettier editor settings. Not required by any source document. |

### 1.4 Old Frontend (`public/`) — To Be Removed After Parity

| # | File | Current Role | Required Action |
| --- | --- | --- | --- |
| 17 | `public/index.html` (46.9 KB, ~1338 lines) | The authenticated dashboard shell. Loads Bootstrap 5.3.0, Bootstrap Icons 1.10.0, Quill 1.3.6, and quill-image-resize from CDNs. Contains: navbar with brand, Compose / Reports / My Configs links, user dropdown (`#userName`, `#userEmail`, SMTP Configurations link, Logout); Active Jobs Dashboard (`#activeBatchJobs`, `#scheduledJobsPreview`, `#jobTimeline`); `#compose-tab`; `#configs-tab`; `#report-tab`; and four modals (`#previewModal`, `#viewConfigModal`, `#editConfigModal`, success modal). ~290 lines of inline `<style>` duplicating `public/css/style.css`. | Use as the authoritative feature checklist (§8), then delete. |
| 18 | `public/login.html` (12.8 KB) | Login/register page with inline CSS. `#loginTab`/`#registerTab` toggle, `#loginForm` (email, password), `#registerForm` (name, email, password), `#alertContainer`, spinners. Calls `POST /auth/login`, `POST /auth/register`, `GET /auth/me`; redirects to `/` on success. | Reimplement as two framework routes, then delete. |
| 19 | `public/css/style.css` (1.2 KB) | Bootstrap override sheet: body background, `.tab-content` min-height, card shadow, `.status-sent`/`.status-failed`/`.status-error` colours, `.stat-card` left-border variants, `#editor` background, Quill toolbar radii. **Fully duplicated inside `public/index.html`'s inline `<style>`** — it is effectively dead code today. | Extract the status/stat colour semantics into the new design system, then delete. |
| 20 | `public/js/app.js` (84 KB, ~2545 lines) | The entire old frontend behaviour in 60+ global functions. See §8 for the complete extracted inventory. | Convert to typed modules, stores, and components, then delete. |
| 21 | `public/samples/sample-contacts.xlsx` (10 KB) | Downloadable sample spreadsheet, linked from `public/index.html` at `/public/samples/sample-contacts.xlsx`. Verified header row: `Email`, `FirstName`, `LastName`, `Company`, `Subject`. | **Must survive the migration.** Copy to the new frontend's static asset directory before `public/` is deleted, and update the download link. Losing this breaks a visible user-facing feature. |

### 1.5 Backend Entrypoint, Types, Middleware

| # | File | Current Role | Required Action |
| --- | --- | --- | --- |
| 22 | `src/app.ts` (6.4 KB) | Hono app. `cors()` with **default options** and `logger()` on `*`. A custom auth gate on `*` with `publicPaths = ["/auth/", "/login", "/register", "/public/", "/css/", "/js/", "/favicon.ico"]` plus special root-path handling that redirects unauthenticated `/` to `/login`. `initializeDirectories()` creates `./uploads`, `./logs`, `./public`, `./data`. Static serving via `hono/bun` `serveStatic` for `/public/*`, `/css/*`, `/js/*`, and `GET /login`. Mounts all six route modules at `/`. `GET /health`. `GET /user/info`. `notFound` returns JSON only for `/api/`, `/config/`, `/send`, `/report` prefixes and otherwise redirects. `onError` redirects on auth-ish errors. Startup logging. Session cleanup after 1 s. `export default { port, fetch: app.fetch }` (Bun server contract). | Keep every API route mount and the auth gate semantics. Remove static serving and the `/login` page route (explicitly authorised by `PROJECT_ASSIGNMENT.md` §4). Replace the Bun default export with `@hono/node-server`. Fix `notFound` to return JSON for all unmatched paths. Configure CORS explicitly if a cross-origin topology is chosen (see §6.2). |
| 23 | `src/types.ts` (2.7 KB) | Shared interfaces: `Contact` (index-signature open), `EmailLog` (status `"Sent" \| "Failed" \| "Error"`), `EmailConfig`, `EmailJob`, `SMTPDefaults`, `BatchConfig`, `BatchJob` (with `notificationSettings`, `userId`, `configName`), `BatchStatus`, `ScheduledJob`, `NotificationSettings`, `NotificationConfig`, `ProviderLimits`. | Do not change. Mirror into the frontend as the single source of response typing (see §5.6). |
| 24 | `src/middleware/auth.ts` (1.3 KB) | Module-augments Hono's `Context` with `user?: User`. `authMiddleware` skips `["/login","/register","/auth","/public","/css","/js"]` and `/`; reads the token from `Authorization: Bearer …` **or** the `session_token` cookie; validates via `userDatabase.validateSession`; returns `401 {success:false,message}` JSON on failure. `requireAuth(c)` throws if `c.user` is unset. | Preserve exactly. Note the Bearer-token path: it is the escape hatch if cookie delivery proves impossible in a cross-site deployment (see §14.3). |

### 1.6 Backend Routes

| # | File | Current Role | Required Action |
| --- | --- | --- | --- |
| 25 | `src/routes/auth.ts` (5.1 KB) | `POST /auth/register` (validates presence, password ≥ 6, email regex; 409 on duplicate), `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`. Sets `session_token` cookie: `httpOnly`, `secure` auto-detected from `x-forwarded-proto`/URL, `sameSite: "lax"`, `maxAge: 86400`, `path: "/"`. | Preserve. Frontend auth pages call these four. Mirror the exact validation rules client-side so errors surface before the round trip. |
| 26 | `src/routes/config.ts` (8.5 KB) | `GET /config/smtp`, `POST /config/smtp`, `PUT /config/smtp/:configId`, `DELETE /config/smtp/:configId`, `POST /config/smtp/:configId/default`, `GET /config/smtp/active`, `POST /config/smtp/test`. Falls back to env-derived `envConfig` when the user has no default. | Preserve. **Two route names differ from `PROJECT_ASSIGNMENT.md`'s examples — see §2.2.** Note the response asymmetry documented in §7.2: `data` includes the SMTP password, `userConfigs[]` does not. |
| 27 | `src/routes/dashboard.ts` (5.5 KB) | `GET /dashboard/poll-status` and `GET /dashboard/data`, backed by a 5-second in-memory `dashboardState` cache. Returns `pollNeeded` and an adaptive `pollInterval` (3 000 ms active batch, 10 000 ms running scheduled job, 30 000 ms pending scheduled job). `/dashboard/data` only queries services whose cached flags are true. | Preserve, and build the frontend polling loop around exactly this contract. Uses CommonJS `require()` four times — see §6.4. |
| 28 | `src/routes/index.ts` (0.4 KB) | Serves `public/index.html` at `/` plus `/public/*`, `/css/*`, `/js/*` static mounts. Duplicates the static mounts already in `app.ts`. | Delete entirely, and remove its `app.route("/", indexRoutes)` mount from `src/app.ts`. |
| 29 | `src/routes/report.ts` (1.1 KB) | `GET /report` (logs + stats), `GET /report/export/csv`, `GET /report/export/json`, `DELETE /report/clear`. Export routes set `Content-Disposition: attachment`. | Preserve. Note: these routes are **not user-scoped** — see §16 risk R7. |
| 30 | `src/routes/send.ts` (19.2 KB) | `POST /send` (the core endpoint — resolves the user's SMTP config from `configId`, validates, tests the SMTP connection with provider-specific error text, saves and parses the Excel upload, applies the email range slice, enforces provider contact limits, optionally reads the HTML template, then branches to scheduled / batch / immediate), `POST /test-notification`, `POST /provider-info`, `GET /scheduled-jobs`, `DELETE /scheduled-jobs/:id`, `POST /parse-excel`, `GET /batch-status`, `POST /batch-pause`, `POST /batch-resume`, `DELETE /batch-cancel`. Configures the global notification sender at import time if `NOTIFICATION_SMTP_USER` is set. | Preserve. **The exact multipart field names in §7.3 are a hard contract** — the endpoint reads them positionally by name from `FormData`, and checkbox-style fields are compared against the literal string `"on"`. |

### 1.7 Backend Services

| # | File | Current Role | Required Action |
| --- | --- | --- | --- |
| 31 | `src/services/batchService.ts` (10.3 KB) | Single-slot in-memory batch engine. `startBatchJob` throws if one is already running. Tracks `currentBatch`/`totalBatches`/`emailsSent`/`emailsFailed`/`status`/`startTime`/`nextBatchTime`. `pauseCurrentJob`, `resumeCurrentJob`, `cancelCurrentJob` (sets status `Failed`, clears job). `processBatch` personalises via `FileService.replacePlaceholders`, sends, and logs each result. Between batches waits `batchDelay` minutes; between emails waits `emailDelay` seconds. On completion sends a notification and clears `currentJob` after 30 s. | Preserve. The UI must reflect the single-slot constraint: a second batch cannot start while one runs, and job details vanish 30 s after completion. |
| 32 | `src/services/emailService.ts` (7.8 KB) | Nodemailer transport factory, `sendSingleEmail`, `sendBulkEmails` (sequential with `job.delay` seconds between sends, logs each outcome, optional completion notification), `testConnection` (builds a throwaway transporter and calls `verify()`). Contains a large commented-out earlier version of `sendBulkEmails`. | Preserve behaviour. **[INFERRED]** Delete the ~73 lines of commented-out dead code — `task1.md` evaluates "Code quality, clarity, and maintainability" and `CONTRIBUTING.md` asks for clean readable code. This is a comment-only deletion and changes no logic. |
| 33 | `src/services/fileService.ts` (6.8 KB) | Static class. `parseExcelFile` (reads sheet 1, requires a header row containing a column whose name contains "email" case-insensitively, maps FirstName/LastName/Company/Subject variants, preserves all other columns verbatim, drops rows with invalid emails, throws if zero valid contacts). `saveUploadedFile`, `readHTMLTemplate`, `isValidEmail`, `replacePlaceholders` (five well-known placeholders plus every other Excel column name). | Preserve. The placeholder contract in §9 Phase 6 depends on `replacePlaceholders`; the frontend preview must reproduce it exactly or previews will lie. |
| 34 | `src/services/logService.ts` (2.0 KB) | In-memory `EmailLog[]` mirrored to `./logs/email-logs.json` on every write. `getLogs`, `getLogsAsCSV` (fixed nine-column order), `getLogsAsJSON`, `clearLogs`, `getStats` → `{total, sent, failed, errors}`. | Preserve. Logs live in a JSON file, not SQLite — relevant to the deployment persistence note in §14.2. |
| 35 | `src/services/middleware` | **Zero-byte file** (not a directory). Not imported by anything. Almost certainly an accidental `touch`. | Delete. Real middleware lives at `src/middleware/auth.ts`. |
| 36 | `src/services/notificationService.ts` (30.4 KB) | `setupGlobalNotificationSender`, `sendJobCompletionNotification` (looks up the user, computes `successRate` and `duration`, prefers the user's default SMTP config and falls back to the global notification transport), `sendTestNotification`, `getCampaignStats(jobId)`, plus ~540 lines of inline notification HTML template and helpers (`createNotificationSubject`, `getStatusIcon`, `createNotificationHTML`, `getPerformanceInsights`, `calculateDuration`). Self-configures at import time from `NOTIFICATION_SMTP_*`. | Preserve untouched. The frontend only ever calls `POST /test-notification` and passes `notifyEmail`/`notifyBrowser` through `POST /send`. |
| 37 | `src/services/providerLimits.ts` (1.7 KB) | `ProviderDetection.detectProvider(host)` → Gmail (100/day, batch 20, delay 45), Outlook/Hotmail/Live (300/day, batch 50, delay 30), Yahoo (100/day, batch 20, delay 45), Custom SMTP (10 000/day, batch 100, delay 15). `calculateMaxContacts(host, hasNotification)` reserves one email for the notification on Gmail/Yahoo/Outlook. | Preserve. Surface these numbers in the UI via `POST /provider-info` so users learn the limit *before* `POST /send` rejects them. |
| 38 | `src/services/schedulerService.ts` (11.5 KB) | SQLite-backed scheduler on `./data/scheduler.db`. Creates `scheduled_jobs`, then attempts idempotent `ALTER TABLE ADD COLUMN` migrations for `user_id` and `config_name`. `scheduleJob` serialises the whole `EmailJob` (including contacts and the SMTP config with its password) to JSON. `setInterval` every 60 000 ms polls for due jobs. Batch scheduled jobs delegate notification to `batchService`; non-batch jobs notify at scheduler level. `getScheduledJobs()` returns only `status IN ('scheduled','running')` for **all users**. `cancelScheduledJob` only cancels jobs still in `scheduled` status. `getJobHistory`, `getUserScheduledJobs` exist but are unrouted. | Preserve schema and behaviour. Two consequences for the UI: cancellation must be disabled for `running` jobs, and the one-minute tick means a job can fire up to 60 s after its scheduled time. |

---

## 2. Document Reconciliation And Conflict Register

Every discrepancy found between sources is recorded here. None is silently resolved.

### 2.1 Framework Choice — `task1.md` vs `PROJECT_ASSIGNMENT.md` / `README.md`

- `task1.md`: "Migrate the existing frontend using **any modern frontend framework of your choice**"; lists Next.js, Nuxt, Remix, Astro, SvelteKit as examples; "The framework choice itself is **not being judged**."
- `PROJECT_ASSIGNMENT.md` and `README.md`: title and body mandate **SvelteKit** specifically, and supply a SvelteKit folder structure and setup guide.

**Resolution:** SvelteKit satisfies both documents simultaneously — it is the mandate of the project-specific brief and one of the explicitly permitted options in the hiring brief. **This plan therefore specifies SvelteKit + TypeScript as the implementation target.** Because `task1.md` requires a justifiable, defensible choice, the README must state the justification in words (see §13.3). A Next.js equivalent architecture is provided in §5.9 for completeness, but it is *not* the recommended path here: choosing Next.js would satisfy `task1.md` while contradicting the explicit instruction in `PROJECT_ASSIGNMENT.md` and `README.md`.

### 2.2 Documented Endpoints vs Actual Code

`PROJECT_ASSIGNMENT.md` §"Key Features to Implement" lists example endpoints. Several do not exist. **The code is authoritative for implementation.**

| `PROJECT_ASSIGNMENT.md` says | Actual route in code | Location |
| --- | --- | --- |
| `POST /config/smtp/:id/test` | `POST /config/smtp/test` (no `:id`; full config in JSON body) | `src/routes/config.ts:289` |
| `POST /config/smtp/:id/set-default` | `POST /config/smtp/:configId/default` | `src/routes/config.ts:225` |
| `POST /send/preview` | **Does not exist.** Preview is client-side only in `public/js/app.js:2300 previewEmail()` | — |
| `GET /send/status` | `GET /batch-status` | `src/routes/send.ts:569` |
| `POST /send/pause` | `POST /batch-pause` | `src/routes/send.ts:574` |
| `POST /send/resume` | `POST /batch-resume` | `src/routes/send.ts:579` |
| `POST /send/cancel` | `DELETE /batch-cancel` (method is DELETE, not POST) | `src/routes/send.ts:584` |
| `GET /dashboard/stats` | **Does not exist.** Stats come from `GET /report` | `src/routes/report.ts:7` |
| `GET /dashboard/scheduled-jobs` | `GET /scheduled-jobs` | `src/routes/send.ts:519` |
| `GET /schedule/jobs` | `GET /scheduled-jobs` | `src/routes/send.ts:519` |
| `GET /schedule/jobs/:id` | **Does not exist.** No single-job detail endpoint. | — |
| `DELETE /schedule/jobs/:id` | `DELETE /scheduled-jobs/:id` | `src/routes/send.ts:524` |
| `GET /schedule/status` | **Does not exist.** | — |
| (not listed) | `GET /user/info`, `POST /parse-excel`, `POST /provider-info`, `POST /test-notification`, `GET /config/smtp/active`, `GET /health` all exist but are undocumented in the brief. | — |

**Implementation rule:** build against §7, never against the brief's example list. Record this reconciliation in the README's API documentation so the reviewer sees the discrepancy was found deliberately, not missed.

### 2.3 Database Schema — Documented vs Actual

`PROJECT_ASSIGNMENT.md` §"Database Schema" documents a table named **`smtp_configs`**. The actual table created by `src/services/userDatabase.ts:105` is **`user_smtp_configs`**. Column definitions otherwise match. `users`, `user_sessions`, and `scheduled_jobs` match the documentation exactly.

**Resolution:** `task1.md` forbids changing database structure. The actual name `user_smtp_configs` therefore stands. Do not "fix" the code to match the document.

### 2.4 Backend Modification — `task1.md` vs `PROJECT_ASSIGNMENT.md`

- `task1.md`: "Do **not** modify backend logic or database structure."
- `PROJECT_ASSIGNMENT.md` §2: "**Remove Bun dependency**", "Replace `bun:sqlite` with a Node-compatible SQLite library", "Update file serving and middleware for Node.js compatibility". §4: "Remove static file serving routes from backend (except API endpoints)."

**Resolution:** these are reconcilable. `task1.md` protects *business logic and schema*; `PROJECT_ASSIGNMENT.md` authorises *runtime and static-serving* changes. The operating rule for this migration is therefore:

> **Permitted:** runtime/host swap (`hono/bun` → `@hono/node-server`), driver swap (`bun:sqlite` → `better-sqlite3`) with identical SQL, deletion of static-file serving and the old-frontend route module, `notFound` handler adjustment, CORS configuration, build tooling, dependency hygiene.
> **Forbidden:** any change to route paths, request/response shapes, validation rules, SQL statements, table or column names, cookie name or semantics, password hashing, token signing, batch/scheduler algorithms, or provider-limit values.

Note also that `PROJECT_ASSIGNMENT.md` §2 labels removing Bun "optional but recommended" while §"Success Indicators" states "✅ **Backend runs on Node.js** (not Bun)" as a success condition, and `.github/workflows/pr-checks.yml` already assumes npm. **[INFERRED]** The migration should be performed: three of four signals point that way, and the CI is currently broken without it.

### 2.5 Planning-Brief Vocabulary With No Basis In The Assignment — `[NOT SUPPORTED]`

The brief that commissioned this document asked for coverage of a set of categories drawn from a *different* kind of assignment (a marketing landing page). Those categories are recorded here for traceability and are **explicitly excluded from scope** because no source document supports them. Where a genuine analogue exists in this assignment, it is named.

| Requested category | Status against sources | Nearest supported analogue in this assignment |
| --- | --- | --- |
| Landing page scope | **[NOT SUPPORTED]** — no source mentions a landing page. This is an authenticated operational dashboard. | The `/login` and `/register` routes are the only unauthenticated surface. `PROJECT_ASSIGNMENT.md` §"UI/UX Requirements" governs everything else. |
| Footer requirements | **[NOT SUPPORTED]** — no source requires a footer. | `PROJECT_ASSIGNMENT.md`'s suggested component tree does list `shared/Footer.svelte`, so a minimal footer is permitted as `[OPTIONAL]`, not required. |
| Smooth in-page anchor navigation | **[NOT SUPPORTED]** — no source mentions anchors or scroll behaviour. | `PROJECT_ASSIGNMENT.md` requires "**Intuitive navigation** (clear tabs/sections)" and "Navigation — Sidebar or top nav with active state". Client-side route transitions replace the old `showTab()` tab switching. See §5.4. |
| Next.js as the implementation framework | **[NOT SUPPORTED] as a mandate** — `task1.md` permits it; `PROJECT_ASSIGNMENT.md` and `README.md` mandate SvelteKit. | §5.9 provides the Next.js mapping for reference only. |
| Vercel as the deployment target | **Partially supported.** `PROJECT_ASSIGNMENT.md` §"Deployment Considerations" lists "Vercel, Netlify, Cloudflare Pages" for the frontend as a *consideration*, not a requirement. No source requires a live deployment or a live URL. | §14 gives a full Vercel plan, correctly scoped as optional and with its cookie/CORS consequences spelled out. |
| AI usage disclosure section | **[NOT SUPPORTED]** — no source document requests any AI disclosure. | §13.9 provides an `[OPTIONAL]` honest-disclosure section for the README. Recommended as good practice, explicitly not a requirement. |
| Bonus lead-capture form / bonus API route | **[NOT SUPPORTED]** — no source defines any bonus scope. | The project already contains substantial form and API work (SMTP config forms, the compose form, `POST /send`). No new bonus feature should be invented; doing so risks diluting the core migration, which is what `task1.md` actually grades. |
| "Clarity over pixel-perfect cloning" design guidance | **Partially supported by analogy.** No source uses this phrasing. | `PROJECT_ASSIGNMENT.md` requires "Clean and modern design (avoid cluttered UI)" and "**enhanced UX**", and `README.md` repeats it. The equivalent operative rule here: **do not clone the old Bootstrap UI screen-for-screen — reproduce its capability with better structure and clarity.** See §5.2. |
| Deadline pressure | **[NOT SUPPORTED] as a stated deadline.** No date appears in any source. | `task1.md` warns "Rushed, incomplete, or poorly structured submissions may not be considered", and `PROJECT_ASSIGNMENT.md` gives a 4-week phase schedule. §9 is sequenced so that each phase leaves the app in a demonstrable state, which is the correct hedge against time pressure. |

### 2.6 Other Ambiguities And Limitations Recorded Rather Than Guessed

1. **`PROJECT_ASSIGNMENT.md` "Real-time Features"** lists "Email sending rate" on the dashboard. No backend endpoint exposes a rate. It could be derived client-side from `emailsSent` deltas between polls. Marked `[INFERRED, OPTIONAL]` — implement only if time allows, and label it as derived in the UI.
2. **"Optimistic updates"** appear in both `PROJECT_ASSIGNMENT.md` UI/UX principles and Pro Tips. No source specifies which mutations should be optimistic. Recommendation: apply only to the SMTP config list (delete / set-default), where the server response is a simple success flag. Never to `POST /send`.
3. **TanStack Query** is `[OPTIONAL]` in `PROJECT_ASSIGNMENT.md` ("optional but recommended"). §5.7 states the recommendation and the condition under which to skip it.
4. **E2E testing** is `[OPTIONAL]` ("E2E testing (optional)", Phase 8). The Testing Requirements section lists backend and frontend test areas without mandating a framework or coverage level. §11 gives a manual verification protocol as the floor and automated tests as the ceiling.
5. **Screenshots/demos** are required by `PROJECT_ASSIGNMENT.md` §5 and §"Deliverables" ("Screenshots/Demo — Visual proof of work") but no format or count is specified. §13.8 sets a concrete minimum.
6. **`GET /report` is not user-scoped.** `logService` is a global singleton and `src/routes/report.ts` never calls `requireAuth`. Every authenticated user therefore sees every user's email logs. This is a genuine defect, but fixing it would change backend logic, which `task1.md` forbids. **Do not fix it. Document it** in the README's "Known Limitations" and "Future Improvements" (§13.10). The same applies to `GET /scheduled-jobs` and all four batch-control endpoints, which are likewise global.
7. **`README.md` is simultaneously an assignment brief and the file the assignment tells you to rewrite.** After migration it must become the project README. The original brief content should not be preserved inside it; `PROJECT_ASSIGNMENT.md` remains as the record of the brief.

---

## 3. Requirement Traceability Matrix

Every requirement carries: source, exact instruction, implementation implication, acceptance criterion, risk if missed, and classification.

### 3.1 Project Goal

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `task1.md` §Objective | "Migrate the existing frontend using any modern frontend framework of your choice, while keeping the backend logic and database structure completely unchanged." | Build a new frontend app; touch backend only for runtime/static-serving per §2.4. | New frontend serves all user-facing functionality; `git diff` on `src/services/*.ts` shows only the driver swap; no SQL changed. | Assignment failed at the premise. | EXPLICIT |
| `task1.md` §Objective | "Choose a framework and architecture you can confidently justify." | The README must contain a written justification, not just a name. | README §"Why SvelteKit" exists and argues from the project's actual needs. | Loses "Architectural and decision-making clarity" (an explicit criterion). | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Overview | "migrate the frontend to SvelteKit while maintaining the existing Hono backend functionality." | SvelteKit is the target. | `frontend/` is a SvelteKit app; backend still Hono. | Contradicts the project brief. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §1 | "Understand the Existing System — Analyze and document" (7 sub-bullets: endpoints, schema, auth flow, sending logic, SMTP config, uploads, reporting). | The documentation deliverable must cover all seven areas. | README covers all seven; §7 and §8 of this plan are the working notes. | Loses Documentation marks (10%). | EXPLICIT |

### 3.2 Tech Stack Constraints

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §Target Tech Stack | "Backend: Hono (keep as-is, migrate to Node.js/Deno with npm/pnpm/yarn)" | Replace Bun server export with `@hono/node-server`; convert scripts to npm. | `npm run dev` and `npm start` boot the backend on Node; no `bun` command required anywhere. | Success Indicator "Backend runs on Node.js (not Bun)" unmet; CI stays broken. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §2 | "Replace `bun:sqlite` with a Node-compatible SQLite library (e.g. `better-sqlite3`)" | Two files: `userDatabase.ts:2`, `schedulerService.ts:3`. API surface used (`new Database(path)`, `.exec`, `.prepare().run/.get/.all`, `result.changes`) is compatible with `better-sqlite3` — the swap is import-only. | Both databases open; login works; scheduling works; no SQL text changed. | Backend will not start on Node at all. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §2 | "Update file serving and middleware for Node.js compatibility" | Remove `hono/bun` `serveStatic` from `app.ts` and delete `routes/index.ts`. | No import of `hono/bun` remains. | Runtime crash on import under Node. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Target Tech Stack | "State Management: TanStack Query (optional but recommended)" | Use `@tanstack/svelte-query` for server state, or document why not. | Either the dependency is present and used for the polled/read endpoints, or the README explains the deliberate alternative. | Minor; it is optional. | OPTIONAL |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 1 | "Use TypeScript strictly" | `strict: true` in the frontend `tsconfig`; no `any` in `src/lib`. | `npm run check` in `frontend/` passes with zero errors. | Loses Code Quality marks (30%). | EXPLICIT |
| `CONTRIBUTING.md` §Coding Standards | "Define proper types (avoid `any`)"; 2-space indent; small functions; max 3 levels nesting; async/await over callbacks. | Apply to all new frontend code. | Code review against these five rules passes. | Inconsistent with the repo's own stated standards. | EXPLICIT |

### 3.3 Project Structure And Reusable Component Expectations

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `task1.md` §Instructions | "Use proper folder structure, naming conventions, and scalability patterns" | Adopt §5.1 verbatim; one concern per directory. | A reviewer can locate any feature within two directory hops. | Explicit evaluation criterion "Project structure and scalability". | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §3 | "Use **proper folder structure** (routes, components, stores, utils)" | Four required directories, all present in §5.1, plus `api/` and `types/`. | All six directories exist and are non-trivial. | Same as above. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Suggested Folder Structure | Full `lib/components/{ui,email,dashboard,config,shared}` tree with named components. | Use the brief's grouping. Deviations must be deliberate and better, not accidental. | Component tree in §5.3 maps 1:1 or better onto the brief's tree. | Reviewer sees the brief was skimmed. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 2 | "**Component first** — Build reusable components" | `lib/components/ui/*` must be generic (no feature imports, no API calls). | Every `ui/` component compiles with zero imports from `lib/api` or `lib/stores`. | Loses "Component reusability" (named in Code Quality 30%). | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 3 | "**API client abstraction** — Centralize API calls" | Exactly one `fetch` wrapper; feature modules call it, components call feature modules. | `grep -r "fetch(" frontend/src` returns hits only in `lib/api/client.ts`. | Loses Code Quality marks; makes the auth/credentials fix a 30-file change instead of a 1-file change. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 9 | "Lazy load routes — Faster initial load" | SvelteKit code-splits per route by default; additionally lazy-load the rich text editor. | The editor bundle is not in the initial chunk for `/dashboard`. | Minor performance. | OPTIONAL |

### 3.4 Navigation

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §UI/UX, `README.md` §UI/UX | "**Intuitive navigation** (clear tabs/sections)" | Replace `showTab()` DOM toggling with real routes. | Each major section has its own URL; browser back/forward works; deep links work. | Loses UI/UX marks (20%). | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §UI Components 1 | "**Navigation** — Sidebar or top nav with **active state**" | The current route must be visually and programmatically marked. | Active nav item is styled *and* carries `aria-current="page"`. | Explicitly listed component requirement. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Suggested Structure | `shared/Navbar.svelte`, `shared/Sidebar.svelte`, `shared/Footer.svelte` | Provide an app shell. Footer is permitted but not required (§2.5). | App shell renders on every protected route and not on auth routes. | Layout duplication across pages. | EXPLICIT (Navbar/Sidebar), OPTIONAL (Footer) |
| `public/index.html:321-373` | Existing nav: brand, Compose, Reports, My Configs, user dropdown with email, SMTP Configurations, Logout. | All five destinations must remain reachable. | Every old nav destination has a route equivalent. | Feature regression. | INFERRED (parity requirement follows from "Implement all existing features") |

### 3.5 Responsive Behaviour

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §3, §UI/UX; `README.md` §1, §Design Principles | "Implement responsive design (mobile-friendly)"; "**Responsive layout** (mobile, tablet, desktop)" | Mobile-first CSS; three verified breakpoints. | Every route verified at 375 px, 768 px, 1440 px with no horizontal scroll and no clipped text. | Named in UI/UX (20%) and in Success Indicators. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 10 | "**Test on mobile** — Responsive design matters" | Manual device-width verification is part of the definition of done. | §12 checklist rows signed off. | Same. | EXPLICIT |
| `public/index.html` (Bootstrap grid) | Old UI uses `col-md-6`, `col-md-4`, `table-responsive`. | Tables are the hardest case: eight columns in the report table. Plan a card/stacked layout below `md`. | Report table usable on a 375 px viewport. | The most likely place responsiveness visibly breaks. | INFERRED (follows from the explicit responsive requirement applied to the widest existing component) |

### 3.6 UI Quality And Component Inventory

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md`, `README.md` §Design Principles | "**Clean and modern** design (avoid cluttered UI)" | Do not port the old dense Bootstrap layout verbatim. Split compose into logical groups. | A first-time viewer can name each screen's purpose without explanation. | UI/UX 20%. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §3 | "Implement all existing features with **enhanced UX**" | Parity is the floor, not the target. Each enhancement must be listed in the README. | §8 fully checked, plus a documented list of deliberate improvements. | "Thoughtful improvements" go unrecognised. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §UI Components | Ten required component types: Navigation, Cards, Tables, Forms, Modals, Toasts/Alerts, Progress Bars, Badges, Buttons, Rich Text Editor. | All ten must exist as reusable components. | Each of the ten maps to a file in §5.3. | Explicit component checklist unmet. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Color Scheme | Suggested: primary `#667eea`, success `#28a745`, danger `#dc3545`, warning `#ffc107`, info `#17a2b8`. | Adopt as design tokens. Marked "Suggested", so variation is allowed if coherent. | A single tokens file defines the palette; no hard-coded hex values in components. | Inconsistent visual language. | OPTIONAL |
| `PROJECT_ASSIGNMENT.md` §3, §Pro Tips 5 | "Add client-side validation and error handling"; "**Loading states everywhere**" | Every async action has idle / loading / success / error states. | No button is clickable twice during an in-flight request; every failure renders a message. | Named in UI/UX criteria ("Loading states", "Error messages"). | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 6 | "**Error boundaries** — Graceful error handling" | SvelteKit `+error.svelte` at root and in the protected group. | Forcing a load failure renders a friendly page, not a stack trace. | Poor error experience. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 8 | "**Debounce searches** — Reduce API calls" | Report search/filter is client-side over already-fetched logs; debounce input to avoid re-render thrash. | Typing in report search does not re-filter on every keystroke. | Minor. | OPTIONAL |

### 3.7 Functional Components And Framework Idioms

> The commissioning brief asked for "functional component and hooks usage". That is React vocabulary and appears in **no** source document — `[NOT SUPPORTED]` as literal phrasing. The SvelteKit equivalent obligations, which *are* supported, are stated here.

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `task1.md` §Evaluation | "Correct and effective usage of the chosen framework" | Use SvelteKit idioms: `load` functions for route data, layout groups for auth boundaries, stores for cross-component state, `$:`/runes for derived values, actions/enhance for forms. Do not write React patterns in Svelte. | No `onMount`-only data loading where a `load` function is correct; no manual DOM manipulation. | Explicit evaluation criterion. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Suggested Structure | `lib/stores/{auth,toast,theme}.ts` | Stores hold cross-cutting state only; component-local state stays local. | `auth` and `toast` stores exist; no store is used as a dumping ground. | Structure marks. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Suggested Structure | `(auth)` and `(app)` route groups with `+layout.server.ts` auth check | Two layout groups; the protected group gates on the session. | Unauthenticated access to any `(app)` route redirects to `/login`. | Auth bypass; explicit requirement "Protected routes". | EXPLICIT |

### 3.8 Styling Approach

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §Frontend Setup 2 | "Configure TailwindCSS (or use Bootstrap)" | Free choice between Tailwind and Bootstrap. Recommendation in §5.5: Tailwind, because the old UI's problem was Bootstrap-shaped clutter and reusing it invites a visual clone. | A single styling system; no mixing of Tailwind utilities and Bootstrap classes. | Inconsistent UI; wasted bundle. | OPTIONAL (choice), EXPLICIT (that one is configured) |
| `PROJECT_ASSIGNMENT.md` §UI Libraries | Optional: Skeleton UI, Flowbite Svelte, Carbon Components Svelte. | Permitted. If used, still wrap them in own `ui/` components so the app is not coupled to the library. | No third-party component is imported directly by a route file. | Coupling; harder to justify architecture. | OPTIONAL |
| `public/css/style.css` | Status colours: sent `#198754`, failed `#dc3545`, error `#fd7e14`; stat-card left borders. | Preserve the *semantics* (three distinct log statuses, four stat categories) in the new token set. | `Sent`/`Failed`/`Error` remain visually distinguishable and are not distinguished by colour alone (§10). | Report becomes unreadable at a glance. | INFERRED (follows from feature parity plus the accessibility requirement) |

### 3.9 API Integration

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §Evaluation, Functionality 40% | "Backend API integration" is 40% of the grade alongside features. | Every endpoint in §7 that the old UI used must be wired. | §8 parity checklist complete. | The single largest scoring category. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Frontend Setup 4 | Example client uses `credentials: 'include'` and `VITE_API_URL`. | The API client must send credentials on every request and read the base URL from an env variable. | Auth works; base URL is not hard-coded. | Every authenticated request 401s. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Common Issues | "CORS errors → Configure Hono CORS middleware to allow SvelteKit dev server origin"; "Session cookies not working → ensure `credentials: 'include'` and `sameSite: 'lax'`" | The brief anticipates exactly the failure analysed in §6.2. Solve it deliberately. | Login persists across a page reload in both dev and the deployed topology. | The classic total-blocker of this migration. | EXPLICIT |
| `src/routes/send.ts:40-120` | `POST /send` reads 16 named multipart fields; boolean fields compare to the literal `"on"`. | Build the FormData in one dedicated function with the field names in §7.3. | A network-tab capture of `POST /send` shows every expected field with correct casing. | Silent misbehaviour: the server falls back to defaults instead of erroring. | EXPLICIT (from code) |
| `public/js/app.js:583` | `formData.set("scheduledTime", userLocalDate.toISOString())` — UTC ISO, not the raw `datetime-local` value. | Convert before sending. `src/routes/send.ts:353` parses it directly with `new Date()`. | A job scheduled for 15:00 local fires at 15:00 local, not 15:00 UTC. | Campaigns fire at the wrong hour — a severe, quiet bug. | EXPLICIT (from code) |

### 3.10 Optional Form Handling / Bonus Scope

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| — | No source document defines a bonus feature, a lead-capture form, or an extra API route. | **Do not build one.** Adding unrequested features while core parity is incomplete is the failure mode `task1.md` warns about ("Rushed, incomplete… submissions may not be considered"). | Scope contains only §4.1 items. | Diluted effort; incomplete core. | NOT SUPPORTED |
| `PROJECT_ASSIGNMENT.md` §Pro Tips 4 | "**Form validation** — Use Zod or similar library" | If schema validation is added, apply it to the existing forms (register, login, SMTP config, compose) — not to a new form. | Validation schemas exist for the four real forms. | Missed easy Code Quality points. | OPTIONAL |

### 3.11 Deployment

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §Deployment Considerations | Backend: "Node.js hosting: Heroku, Railway, Render, DigitalOcean"; env vars; "SQLite files in persistent storage"; "Ensure `uploads/` directory persists". | If deploying, the host must offer a persistent disk. Serverless will lose `data/*.db`, `uploads/`, and `logs/`. | Restarting the deployed backend does not lose users or scheduled jobs. | Data loss; broken demo. | OPTIONAL (deployment itself is a "consideration", not a deliverable) |
| `PROJECT_ASSIGNMENT.md` §Deployment Considerations | Frontend: "Static hosting: Vercel, Netlify, Cloudflare Pages"; "SvelteKit adapter: Install appropriate adapter"; "API proxy: Configure backend API URL"; "Environment variables: `VITE_API_URL`". | Choose the adapter to match the topology decided in §14. | `npm run build` succeeds with the chosen adapter; the deployed frontend reaches the backend. | Build failure at the last minute. | OPTIONAL |
| `PROJECT_ASSIGNMENT.md` §9 | "Deployment guide" is a documentation checklist item. | The README must contain deployment instructions **even if nothing is deployed**. | README §Deployment exists and is accurate. | Documentation marks (10%). | EXPLICIT |

### 3.12 Old Frontend Removal

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §4, `README.md` §2 | "Delete `public/` folder (HTML, CSS, JS files)" | Delete files 17–20. Rescue file 21 first. | `public/` no longer exists; sample spreadsheet still downloadable from the new frontend. | Explicit Success Indicator "No old frontend code remains". | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §4, `README.md` §2 | "Remove static file serving routes from backend (except API endpoints)" | Delete `src/routes/index.ts`, its mount in `app.ts`, the three `serveStatic` mounts, and `GET /login`. | No `serveStatic` import remains; `GET /` returns JSON or 404, not HTML. | Same. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §4, `README.md` §2 | "Ensure no dependencies on old frontend code" | Also remove `"./public"` from `initializeDirectories()` and the `/public/`, `/css/`, `/js/` entries from both public-path lists. | `grep -ri "public/" src/` returns nothing. | Dead configuration; reviewer notices. | EXPLICIT |

### 3.13 Documentation

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §5, `README.md` §3 | "Update `README.md` with new architecture" | Full rewrite per §13. | README describes the two-app architecture, not the old one. | Documentation 10%. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §5 | "Document setup instructions for both backend and frontend" | Two setup sections, each independently runnable from a clean clone. | A reader with only the README can run the app. | Same. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §5 | "Add API documentation" | Endpoint reference matching §7, including the §2.2 corrections. | Every endpoint in §7 documented with method, path, payload, response. | Same; also a named Deliverable. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §5, §Deliverables 5 | "Include screenshots/demos of new UI" / "Visual proof of work" | Capture and commit images. | ≥ 5 screenshots per §13.8. | Named Deliverable. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §9 | "Environment variables guide" | Document every key in `.env.example` plus the new frontend key. | All keys documented with purpose and example. | Setup fails for the reviewer. | EXPLICIT |
| `task1.md` §Instructions | "Read the README file carefully before starting" | Confirms `README.md` is a source document, not just an artefact. | Acknowledged in §0.1. | — | EXPLICIT |

### 3.14 Testing

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` §Testing, Backend | Six areas: registration/login, SMTP config CRUD, sending (immediate/batch/scheduled), file upload, report generation, session validation. | Verify each, at minimum manually with a recorded protocol. | §11.1 protocol executed and recorded. | Functionality 40% is unverified. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Testing, Frontend | Six areas: component rendering, form validation, API integration, navigation, state management, responsive design. | Same. | §11.2 protocol executed and recorded. | Same. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Phase 8 | "E2E testing (optional)" | Playwright if time allows; cover login → configure SMTP → upload → preview. | Optional. | None. | OPTIONAL |
| `package.json:12` | `"test": "echo \"Error: no test specified\" && exit 1"` | This currently **fails** the build. CI tolerates it via `continue-on-error`. | Replace with a real test command or a passing no-op, and say which in the README. | A red CI check on the submitted repo. | INFERRED (follows from the explicit testing requirements plus a visibly failing script) |

### 3.15 Evaluation Criteria As Design Constraints

Both source documents grade the work. These are constraints, not commentary.

| Source | Criterion | Weight | How This Plan Satisfies It |
| --- | --- | --- | --- |
| `PROJECT_ASSIGNMENT.md` | Code Quality — clean readable code, proper TypeScript, component reusability, error handling, comments/documentation | 30% | §5.3 reusable `ui/` layer; §3.2 strict TS; §5.8 error handling; §3.3 centralised API client. |
| `PROJECT_ASSIGNMENT.md` | Functionality — all features working, backend API integration, state management, real-time updates, file uploads | 40% | §7 API contract; §8 parity inventory; §9 Phase 8 adaptive polling; §9 Phase 6 uploads. |
| `PROJECT_ASSIGNMENT.md` | UI/UX — modern clean design, responsive layout, intuitive navigation, loading states, error messages | 20% | §5.2 design direction; §3.5 breakpoints; §5.4 navigation; §3.6 states. |
| `PROJECT_ASSIGNMENT.md` | Documentation — README, code comments, setup instructions, API documentation | 10% | §13 blueprint. |
| `task1.md` | Code quality, clarity, maintainability | — | As above. |
| `task1.md` | Correct and effective usage of the chosen framework | — | §3.7 SvelteKit idioms. |
| `task1.md` | Project structure and scalability | — | §5.1 folder structure. |
| `task1.md` | Architectural and decision-making clarity | — | §13.3 written justification; §2 conflict register demonstrates decision-making. |
| `task1.md` | Attention to detail | — | §2.2 endpoint corrections and §7.3 exact field names are the highest-visibility proof of this. |
| `task1.md` | Overall production readiness | — | §10 accessibility, §11 testing, §12 go/no-go, §14 deployment. |

### 3.16 Submission

| Source | Requirement | Implementation Implication | Acceptance Criterion | Risk If Missed | Class |
| --- | --- | --- | --- | --- | --- |
| `task1.md` §Submission | "Upload your migrated frontend project to GitHub" | The repository must contain the migrated frontend. | Repo pushed; frontend present. | Not submitted. | EXPLICIT |
| `task1.md` §Submission | "Share the repository link as your final submission" | A single repository URL is the deliverable. | URL sent. | Not submitted. | EXPLICIT |
| `PROJECT_ASSIGNMENT.md` §Deliverables | Five items: SvelteKit Frontend, Migrated Backend, Updated README, API Documentation, Screenshots/Demo. | All five in the repository. | §15 checklist complete. | Incomplete deliverable set. | EXPLICIT |
| `task1.md` §Evaluation | "Rushed, incomplete, or poorly structured submissions may not be considered." | Sequence work so an early stop still yields a coherent app (§9 ordering). | Every phase ends in a demonstrable state. | Outright rejection. | EXPLICIT |

---

## 4. Normalized Scope Statement

### 4.1 In Scope

1. A new SvelteKit + TypeScript frontend at `frontend/`, replacing `public/` entirely.
2. Full feature parity with the old frontend (§8), with the UX improvements required by "enhanced UX".
3. Backend runtime migration: Bun → Node.js/npm, `bun:sqlite` → `better-sqlite3`, `hono/bun` static serving removed, `@hono/node-server` added.
4. Removal of `public/`, `src/routes/index.ts`, `index.ts`, `src/services/middleware`, `bun.lock`.
5. Rescue of `sample-contacts.xlsx` into the frontend's static assets.
6. Documentation: rewritten `README.md`, API reference, setup guides, environment-variable guide, screenshots, deployment guide, known limitations.
7. Repository hygiene: `.gitignore`, `.github/labeler.yml`, `CONTRIBUTING.md`, `pr-checks.yml`, `.env.example`.
8. Verification: the protocols in §11 and the gate in §12.

### 4.2 Out Of Scope

1. Any change to backend business logic, SQL, table/column names, validation rules, or response shapes.
2. Any new backend endpoint.
3. Fixing the known backend defects catalogued in §16 (user-scoping of reports/jobs, password exposure in `GET /config/smtp`, single-slot batch service). These are **documented**, not fixed.
4. Any feature not present in the old frontend and not required by a source document — including any "bonus" form or API route (§2.5, §3.10).
5. A live public deployment as a hard requirement (documented as optional in §14).

---

## 5. Architecture And Component Breakdown

### 5.1 Repository Layout After Migration

```text
assignment/
├── frontend/                          # NEW — SvelteKit app
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +layout.svelte         # root: global styles, ToastHost
│   │   │   ├── +error.svelte          # root error boundary
│   │   │   ├── +page.ts               # "/" → redirect to /dashboard
│   │   │   ├── (auth)/
│   │   │   │   ├── +layout.svelte     # centred card shell, no app chrome
│   │   │   │   ├── login/+page.svelte
│   │   │   │   └── register/+page.svelte
│   │   │   └── (app)/
│   │   │       ├── +layout.svelte     # Navbar + Sidebar + <slot/>
│   │   │       ├── +layout.ts         # session guard (see §5.4)
│   │   │       ├── +error.svelte
│   │   │       ├── dashboard/+page.svelte
│   │   │       ├── send/+page.svelte
│   │   │       ├── configs/+page.svelte
│   │   │       ├── scheduled/+page.svelte
│   │   │       └── reports/+page.svelte
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts          # THE only fetch wrapper
│   │   │   │   ├── auth.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   └── reports.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/                # generic, zero feature knowledge
│   │   │   │   ├── shared/            # app chrome
│   │   │   │   ├── config/
│   │   │   │   ├── email/
│   │   │   │   ├── dashboard/
│   │   │   │   └── reports/
│   │   │   ├── stores/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── toast.ts
│   │   │   │   ├── activity.ts
│   │   │   │   └── polling.ts
│   │   │   ├── types/
│   │   │   │   ├── api.ts             # mirrors src/types.ts
│   │   │   │   └── forms.ts
│   │   │   └── utils/
│   │   │       ├── validation.ts
│   │   │       ├── formatters.ts
│   │   │       ├── placeholders.ts    # mirrors FileService.replacePlaceholders
│   │   │       └── download.ts
│   │   ├── app.html
│   │   ├── app.css
│   │   └── app.d.ts
│   ├── static/
│   │   ├── favicon.png
│   │   └── samples/sample-contacts.xlsx     # rescued from public/samples/
│   ├── .env.example
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── src/                               # backend — logic unchanged
│   ├── app.ts                         # static serving removed, Node server added
│   ├── types.ts
│   ├── middleware/auth.ts
│   ├── routes/{auth,config,dashboard,report,send}.ts   # index.ts deleted
│   └── services/*.ts                  # bun:sqlite → better-sqlite3 only
├── data/  uploads/  logs/             # runtime-created, gitignored
├── .env.example
├── package.json                       # npm scripts
├── package-lock.json                  # NEW — required by CI
├── tsconfig.json
├── README.md                          # rewritten
├── CONTRIBUTING.md                    # npm commands
├── PROJECT_ASSIGNMENT.md              # kept as the record of the brief
├── task1.md                           # kept
├── detailedplan.md                    # this document
└── .github/                           # labeler + workflow updated
```

**Deleted:** `public/**`, `src/routes/index.ts`, `src/services/middleware`, `index.ts`, `bun.lock`.

**Mapping to `PROJECT_ASSIGNMENT.md`'s suggested structure:** identical in shape — `(auth)`/`(app)` groups, `lib/{components,stores,api,utils,types}`, `static/`. Deliberate additions: `lib/stores/{activity,polling}.ts` (the old UI kept this state in module-level globals — `public/js/app.js` `lastKnownState`, `smartPollingTimer`, `getRecentActivity()` — and it must live somewhere), `lib/utils/placeholders.ts` (preview correctness, §9 Phase 6), and a `reports/` component folder (the brief's tree omitted one despite requiring the reports feature).

### 5.2 Design Direction

The old UI is a single 1338-line page with three DOM-toggled tabs, an always-present dashboard card, four modals, and ~290 lines of inline CSS duplicating an external stylesheet. It works, but it is exactly the "cluttered UI" `PROJECT_ASSIGNMENT.md` tells you to avoid.

The rule for this migration, equivalent to "clarity over pixel-perfect cloning" (§2.5):

> **Reproduce every capability. Do not reproduce the layout.**

Concretely:
- Split the single page into five routes so each screen has one job.
- Move the Active Jobs Dashboard from "always visible above everything" to its own `/dashboard` route, which is also the post-login landing route.
- Move SMTP configuration out of the compose screen (where it currently sits as a large card) into `/configs`, leaving compose with a simple config **selector**.
- Give scheduled jobs their own `/scheduled` route rather than burying the list inside a collapsed scheduling panel.
- Replace four Bootstrap modals with one reusable `Modal` component driven by props.
- Replace inline `onclick="fn()"` handlers with typed component events.

### 5.3 Component Tree

Reusable (`lib/components/ui/`) — **no imports from `lib/api` or `lib/stores`; props in, events out.** These satisfy the ten required component types in `PROJECT_ASSIGNMENT.md` §"UI Components Needed".

| Component | Purpose | Required by brief as |
| --- | --- | --- |
| `Button.svelte` | variants primary/secondary/danger/ghost; `loading` renders a spinner and sets `disabled` + `aria-busy` | Buttons |
| `Card.svelte` | header/body/footer slots | Cards |
| `Input.svelte` | label, hint, error, `aria-describedby` wiring | Forms |
| `Select.svelte` | same contract as `Input` | Forms |
| `Checkbox.svelte` | label association | Forms |
| `FileInput.svelte` | accept filter, selected-file name, clear action | Forms |
| `Modal.svelte` | focus trap, `Esc` to close, restores focus, `role="dialog"` `aria-modal` | Modals |
| `ConfirmDialog.svelte` | wraps `Modal`; destructive-action confirmation | Modals |
| `Table.svelte` | generic; sortable column headers; responsive stacking below `md` | Tables |
| `Badge.svelte` | status variants; **icon + text, never colour alone** | Badges |
| `ProgressBar.svelte` | `value`/`max`, `role="progressbar"`, aria value attributes | Progress Bars |
| `Toast.svelte` + `ToastHost.svelte` | `aria-live="polite"`, auto-dismiss, manual close | Toasts/Alerts |
| `Alert.svelte` | inline info/warning/danger/success | Toasts/Alerts |
| `Spinner.svelte` | inline and block sizes | — |
| `EmptyState.svelte` | icon, message, optional action | — |
| `RichTextEditor.svelte` | wraps the chosen editor; `value` in, `change` out; **lazy-loaded** | Rich Text Editor |

Shared chrome (`lib/components/shared/`): `Navbar.svelte` (brand, mobile menu toggle, `UserMenu`), `Sidebar.svelte` (five nav items with `aria-current`), `UserMenu.svelte` (name, email, configs link, logout), `PageHeader.svelte`, `Footer.svelte` `[OPTIONAL]`.

Feature components — page-specific, may call `lib/api` and `lib/stores`:

- `config/`: `ConfigList.svelte`, `ConfigCard.svelte`, `ConfigForm.svelte` (create + edit, one component), `ConfigDetails.svelte` (masked password), `TestConnectionButton.svelte`, `ProviderHelp.svelte` (Gmail app-password guidance from `public/js/app.js:763-926`).
- `email/`: `ConfigSelector.svelte`, `ContactUploader.svelte` (upload → `POST /parse-excel` → count + preview), `ContactPreviewTable.svelte`, `EmailRangeSelector.svelte` (all / first N / specific range), `TemplateUploader.svelte`, `SubjectField.svelte` (placeholder hint), `BatchSettings.svelte` (+ batch preview calculation), `ScheduleSettings.svelte` (+ timezone display + notification fields), `EmailPreviewModal.svelte`, `SendSummary.svelte`, `PlaceholderHelp.svelte`.
- `dashboard/`: `StatsCard.svelte`, `BatchMonitor.svelte` (progress, counts, current/total batch, next-batch countdown, pause/resume/cancel), `ScheduledJobsPreview.svelte`, `ActivityTimeline.svelte`.
- `reports/`: `ReportStats.svelte`, `LogsTable.svelte`, `LogFilters.svelte` (search, status, date range), `ExportButtons.svelte`.

**Reusability rule to enforce in review:** a component in `ui/` that imports anything from `lib/api`, `lib/stores`, or a feature folder is misplaced. This is the mechanical test for the "Component reusability" criterion.

### 5.4 Routing, Navigation, And The Auth Boundary

Routes: `/login`, `/register` (group `(auth)`); `/dashboard`, `/send`, `/configs`, `/scheduled`, `/reports` (group `(app)`); `/` redirects to `/dashboard`.

**Navigation replaces `showTab()`.** The old `public/js/app.js:709 showTab(tabName)` toggled `.d-none` on three divs — no URL change, no history, no deep linking. Each destination now gets a real route, so back/forward and bookmarks work. Active state is set from `$page.url.pathname`, applied both as a style and as `aria-current="page"` (§3.4).

**Auth boundary.** `(app)/+layout.ts` resolves the session before rendering: if `authStore` has no user, call `GET /auth/me`; on 401 `redirect(302, '/login?redirectTo=…')`. `(auth)` routes do the inverse — an already-authenticated visitor is sent to `/dashboard`, matching `public/login.html:378-384`.

**Decision — `+layout.ts` (universal) vs `+layout.server.ts`.** `PROJECT_ASSIGNMENT.md`'s suggested tree shows `+layout.server.ts`. That requires the SvelteKit server to forward the browser's `session_token` cookie to the Hono backend on every navigation, which only works if the SvelteKit server runs (i.e. not with `adapter-static`) and adds a hop. Use `+layout.server.ts` **only if** the proxy topology of §6.2 Option A is chosen — in which case it is the right answer and also solves CORS. Otherwise use `+layout.ts`, which runs in the browser where the cookie already lives. **Decide this in Phase 3, before any route is written** — retrofitting is expensive.

**Cross-cutting behaviours:** in-flight navigation indicator; `redirectTo` honoured after login; a global 401 handler in `lib/api/client.ts` that clears `authStore` and redirects once (guard against redirect loops when `/auth/me` itself 401s).

### 5.5 Styling System

Recommendation: **TailwindCSS**, per `PROJECT_ASSIGNMENT.md` §"Frontend Setup 2" (Tailwind or Bootstrap, free choice). Rationale to record in the README: the old UI's specific weakness was Bootstrap-shaped visual clutter, and reusing Bootstrap invites reproducing it; utility classes plus a small token layer make the "clean and modern, avoid cluttered" requirement mechanical rather than aspirational.

Tokens in `app.css` as CSS custom properties, seeded from `PROJECT_ASSIGNMENT.md` §"Color Scheme": primary `#667eea`, success `#28a745`, danger `#dc3545`, warning `#ffc107`, info `#17a2b8`, plus neutrals, spacing, radii, shadows. Status semantics carried over from `public/css/style.css`: `Sent` → success, `Failed` → danger, `Error` → warning.

Rules: no hard-coded hex outside the token file; breakpoints `sm 640 / md 768 / lg 1024 / xl 1280`; mobile-first (unprefixed = mobile). Dark mode is `[OPTIONAL]` (`PROJECT_ASSIGNMENT.md` lists `stores/theme.ts` as "Dark mode (optional)") — if skipped, do not ship a dead theme store.

### 5.6 Type Strategy

`lib/types/api.ts` mirrors `src/types.ts` (`Contact`, `EmailLog`, `EmailConfig`, `BatchConfig`, `BatchJob`, `BatchStatus`, `ScheduledJob`, `ProviderLimits`) plus the response envelopes the backend actually returns, which are **not** in `src/types.ts` and must be derived from the route handlers:

```
ApiResponse<T>   = { success: boolean; message?: string; data?: T }
SmtpConfigListResponse                    // GET /config/smtp — see §7.2
ParseExcelResponse = { success, contacts: Contact[], totalCount: number }
SendResponse        // discriminated on scheduledMode / batchMode — see §7.3
PollStatusResponse  // see §7.5
```

Duplicate the shapes; do **not** import across the app boundary. The frontend is a separate npm package with its own `tsconfig`, and reaching into `../src` would couple the two builds. Add a README note that `lib/types/api.ts` must be updated in lockstep if backend types ever change.

### 5.7 Server-State Strategy

`PROJECT_ASSIGNMENT.md` marks TanStack Query "optional but recommended". Recommendation: **use `@tanstack/svelte-query`** for the read endpoints (`/config/smtp`, `/report`, `/scheduled-jobs`, `/dashboard/*`, `/batch-status`) because it gives caching, invalidation-after-mutation, and loading/error state without hand-rolling it in five places — which directly serves the "Loading states everywhere" and "State management" criteria.

Skip it only if the adaptive-polling contract (§9 Phase 8) proves awkward to express, in which case use plain stores plus explicit interval management and **document the decision** in the README — an unexplained omission of a recommended library reads as an oversight; an explained one reads as a decision.

Client state stays in Svelte stores: `auth` (current user, derived `isAuthenticated`), `toast` (queue), `activity` (recent-activity timeline persisted to `localStorage`, replacing `public/js/app.js:2052-2076`), `polling` (current interval and timer handle).

### 5.8 API Client Contract

`lib/api/client.ts` is the single place any `fetch` is written. It must:

1. Prefix every path with the configured base URL (`PUBLIC_API_BASE_URL`, or a relative path under the proxy topology).
2. Set `credentials: 'include'` on **every** request (`PROJECT_ASSIGNMENT.md` §"Frontend Setup 4").
3. Set `Content-Type: application/json` for JSON bodies and **never** for `FormData` — setting it manually destroys the multipart boundary and `POST /send` will silently receive no fields. This is the single most common way this migration breaks.
4. Parse JSON, and on `success === false` or a non-OK status throw a typed `ApiError` carrying `status` and the server's `message` (the backend's messages are user-facing and detailed — for example the Gmail app-password guidance at `src/routes/send.ts:187-191` — so surface them verbatim rather than replacing them).
5. Handle 401 centrally: clear `authStore`, redirect to `/login`, suppress the toast for `GET /auth/me` (a 401 there is the expected "not logged in" answer, not an error).
6. Provide `getBlob()` for the CSV/JSON export downloads, which return files rather than JSON.

### 5.9 Next.js Equivalent Mapping — Reference Only

Provided because the commissioning brief asked for a Next.js architecture. **This is not the recommended path** (§2.1): `PROJECT_ASSIGNMENT.md` and `README.md` explicitly mandate SvelteKit. Included so the mapping exists if the framework decision is ever revisited under `task1.md`'s free choice.

| SvelteKit | Next.js (App Router) |
| --- | --- |
| `src/routes/(app)/+layout.svelte` | `app/(app)/layout.tsx` |
| `+layout.ts` / `+layout.server.ts` guard | `middleware.ts` matching `/(dashboard\|send\|configs\|scheduled\|reports)` + a server component session check |
| `+page.svelte` | `page.tsx` |
| `+error.svelte` | `error.tsx` |
| Svelte stores | React Context + `useState`/`useReducer`, or Zustand |
| `@tanstack/svelte-query` | `@tanstack/react-query` |
| `$page.url.pathname` | `usePathname()` |
| `static/samples/sample-contacts.xlsx` | `public/samples/sample-contacts.xlsx` |
| `PUBLIC_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` |
| SvelteKit server proxy (§6.2 A) | Route Handlers under `app/api/[...path]/route.ts` |

Everything else in this plan — the API contract (§7), parity inventory (§8), phase sequencing (§9), accessibility (§10), QA (§12), README (§13) — is framework-independent and applies unchanged.

---

## 6. Backend Compatibility Plan

Constraint from §2.4: runtime and static serving may change; logic and schema may not.

### 6.1 Runtime Migration Steps

1. **`package.json`** — scripts become `"dev": "tsx watch src/app.ts"`, `"start": "tsx src/app.ts"` (or `node dist/app.js` if a real build is added), `"typecheck": "tsc --noEmit"`. Add `@hono/node-server`, `better-sqlite3`; devDeps `tsx`, `@types/node`, `@types/better-sqlite3`; remove `bun-types`, and remove the unused `multer`/`@types/multer` per §1.2 item 7. Keep `"type": "module"` semantics consistent with the ESM imports already in `src/`. Update `engines` to Node only.
2. **`src/services/userDatabase.ts:2`** and **`src/services/schedulerService.ts:3`** — change `import Database from "bun:sqlite"` to `import Database from "better-sqlite3"`. Every call site (`new Database(path)`, `.exec()`, `.prepare().run()/.get()/.all()`, `result.changes`) is API-compatible. **Do not touch a single line of SQL.**
3. **`src/services/schedulerService.ts:13`** — `private schedulerInterval: Timer | null` uses Bun's global `Timer`. Change to `NodeJS.Timeout`. Type-only change.
4. **`src/app.ts`** — remove `import { serveStatic } from "hono/bun"`, the three `app.use(...serveStatic...)` mounts (lines 84–86), the `GET /login` static route (line 89), the `import indexRoutes` and its `app.route("/", indexRoutes)` mount, and `"./public"` from `initializeDirectories()`. Replace the Bun default export with `serve({ fetch: app.fetch, port })` from `@hono/node-server`.
5. **`src/routes/index.ts`** — delete.
6. **`src/app.ts` `notFound`** — currently returns JSON only for `/api/`, `/config/`, `/send`, `/report` prefixes and otherwise redirects to `/login` or `/`. With no HTML served, redirects point nowhere. Return JSON 404 for everything. Authorised by `PROJECT_ASSIGNMENT.md` §4; note it in the README as a deliberate consequence of removing the old frontend.
7. **`src/app.ts` public-path lists** — remove `/public/`, `/css/`, `/js/`, `/login`, `/favicon.ico` from the `publicPaths` array (line 35) and the matching list in `src/middleware/auth.ts:15`. Keep `/auth/`. **Re-verify the root-path branch (lines 46–62):** with no HTML at `/`, its redirect to `/login` is dead. Simplest safe change consistent with §2.4: let `/` fall through to the 404 JSON handler.
8. **`tsconfig.json`** — drop `"types": ["bun-types"]`, add `"types": ["node"]`. If `npm run build` must emit, set `noEmit: false` and an `outDir` in a build-specific config; otherwise keep `noEmit` and make `build` an alias for `typecheck` — and say which in the README so the CI step `npm run build || npx tsc --noEmit` is honest.
9. **`bun.lock`** — delete. Run `npm install` and commit `package-lock.json` (required by `npm ci` in CI).
10. **`src/services/middleware`** (zero-byte file) — delete.
11. **`index.ts`** (root, "Hello via Bun!") — delete.

### 6.2 CORS And Cookie Topology — Decide Before Writing Any Route

This is the highest-risk decision in the migration. `PROJECT_ASSIGNMENT.md` §"Common Issues" flags both symptoms; here is the underlying mechanism.

Two facts about the current code:

- `src/app.ts:27` calls `cors()` with **no options**. Hono's default sends `Access-Control-Allow-Origin: *` and does **not** send `Access-Control-Allow-Credentials: true`. A browser **rejects** any response to a `credentials: 'include'` request when the allow-origin is `*`.
- `src/routes/auth.ts` sets the cookie with `sameSite: "lax"`. Lax cookies are sent on **same-site** requests of any method. `localhost:5173 → localhost:3000` is *same-site* (ports are not part of a site), so local development works. `myapp.vercel.app → myapi.onrender.com` is *cross-site*, so the cookie is **not sent at all** — authentication silently fails in production while working perfectly on the developer's machine.

**Option A — SvelteKit server proxy (recommended).** The browser talks only to the SvelteKit origin; a SvelteKit server route forwards `/api/*` to the Hono backend, passing the `Cookie` header through and relaying `Set-Cookie` back. CORS never applies (server-to-server), the cookie is always same-origin, and **zero backend changes are needed** — the strongest possible answer to `task1.md`'s "do not modify backend logic". Cost: requires a Node adapter for the frontend (`adapter-node`, or `@sveltejs/adapter-vercel` which runs server code as functions), so `adapter-static` is off the table. Pairs naturally with `+layout.server.ts` (§5.4).

**Option B — Direct cross-origin.** Frontend calls the backend host directly. Requires changing `src/app.ts:27` to `cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true })` **and**, for a cross-site production deployment, changing the cookie to `sameSite: "none", secure: true` in `src/routes/auth.ts`. The first is configuration; the second edits auth code and sits uncomfortably against `task1.md`. Viable in development, fragile in production.

**Recommendation: Option A.** If Option B is chosen, the README must state exactly which backend lines changed and why.

### 6.3 Verification That The Backend Is Unchanged Where It Must Be

After migration, this must hold:

```
git diff --stat src/
```
shows changes **only** in: `app.ts` (static serving, server bootstrap, notFound, public paths), `services/userDatabase.ts` (one import line), `services/schedulerService.ts` (one import line, one type annotation), `services/emailService.ts` (dead-comment removal only), and the deletion of `routes/index.ts` and `services/middleware`.

No diff may touch: any SQL string, any route path, any request field name, any response key, `middleware/auth.ts` logic, `types.ts`, `providerLimits.ts` values, `batchService.ts`, `fileService.ts`, `logService.ts`, `notificationService.ts`.

Include this diff summary in the README (§13.4). It is direct evidence for the reviewer that the hardest constraint in `task1.md` was honoured.

### 6.4 Pre-Existing Issues That Will Surface On Node

These exist today and are masked by Bun's tolerance and by `tsc` never being run. Expect them; none requires a logic change.

1. **`src/routes/dashboard.ts` lines 32, 52, 125, 135 use CommonJS `require()`** inside an ESM TypeScript module. Bun tolerates this; Node ESM does not (`require is not defined`). **This is a load-bearing break** — the dashboard is the polling backbone. Fix with the same lazy-import idiom already used elsewhere in the codebase (`src/app.ts:53`, `src/routes/config.ts:295`, `src/services/batchService.ts:305` all use `await import(...)`). Note that `/dashboard/poll-status` and `/dashboard/data` are currently **synchronous** handlers; converting to `await import` makes them async. That is a mechanical change and preserves every response field. Verify the response shape byte-for-byte afterwards.
2. **`strict: true` + `useUnknownInCatchVariables`** — `src/routes/dashboard.ts:38` and `:61` do `error.message` on an `unknown` catch binding. Type errors the moment `tsc --noEmit` runs for real.
3. **Implicit `any`** — `src/routes/dashboard.ts:57` `scheduledJobs.some((job) => …)` and `schedulerService.ts` `dueJobs` iteration are untyped.
4. **`c.req.cookie()`** is Hono v3 API (`hono@^3.12.0` is pinned). If Hono is upgraded, this becomes `getCookie(c, 'session_token')` from `hono/cookie` in ~6 places. **Do not upgrade Hono as part of this migration** — it converts a runtime swap into an API migration for no assignment benefit.
5. **`better-sqlite3` is a native module.** It needs prebuilt binaries or a toolchain, and the binary must match the deployment's Node version and architecture. Verify in the target environment early (Phase 2), not on submission day.

---

## 7. API Contract To Implement

Derived from the route handlers, not from the brief. See §2.2 for where these differ from `PROJECT_ASSIGNMENT.md`.

### 7.1 Authentication — `src/routes/auth.ts`, `src/app.ts`

| Method | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | JSON `{email, name, password}` | `{success, message, user:{id,email,name}}`; sets `session_token` | 400 if any field missing, password < 6, or email fails `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; 409 if email exists |
| POST | `/auth/login` | JSON `{email, password}` | `{success, message, user:{id,email,name}}`; sets `session_token` | 401 invalid credentials |
| POST | `/auth/logout` | — | `{success, message}`; deletes cookie | — |
| GET | `/auth/me` | — | `{success, user:{id,email,name}}` | 401 when unauthenticated — **expected, not an error** |
| GET | `/user/info` | — | identical shape to `/auth/me` | Legacy; used by `public/js/app.js:55`. **Standardise on `/auth/me`** and note the duplication in the README |
| GET | `/health` | — | `{status:"OK", timestamp, version}` | Useful as the deployment smoke test |

Cookie: name `session_token`, `httpOnly`, `secure` auto-detected, `sameSite: "lax"`, `maxAge: 86400`, `path: "/"`. Sessions expire after 24 h; expired rows are swept hourly and once at startup.

### 7.2 SMTP Configuration — `src/routes/config.ts`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| GET | `/config/smtp` | — | `{success, data, hasConfig, hasEnvConfig, currentMode:"user"\|"env", envConfig, userConfigs[], userId, userName}` |
| POST | `/config/smtp` | JSON `{name, host, port, secure, user, pass, fromEmail, fromName, isDefault}` | `{success, data, message, configId}`; 400 if `host`/`user`/`pass`/`fromEmail` missing |
| PUT | `/config/smtp/:configId` | Partial JSON, same keys | `{success, message}`; 404 if not found or no fields changed |
| DELETE | `/config/smtp/:configId` | — | `{success, message}`; 404 if not found |
| POST | `/config/smtp/:configId/default` | — | `{success, message}` |
| GET | `/config/smtp/active` | — | `{success, data, mode, configId, configName}` |
| POST | `/config/smtp/test` | JSON `{host, port, secure, user, pass}` | `{success, message}` |

**Three behaviours the UI must respect:**

1. **`data` contains the plaintext SMTP password; `userConfigs[]` does not.** `src/routes/config.ts:36-44` builds `activeConfig` including `pass`, while lines 56-67 map `userConfigs` **without** `pass`. Consequence: never bind `data.pass` into the DOM, and mask it in `ConfigDetails.svelte` (the old UI did the same — `public/index.html:313 .masked-password`). Record this in Known Limitations (§13.10); do not change the backend.
2. **Omitting `pass` from a PUT leaves the stored password intact** — `src/routes/config.ts:152-156` strips `undefined` keys. The edit form must send `pass` only when the user actually typed a new one. Sending an empty string would overwrite the password with `""`.
3. **Ordering is fixed by SQL**: `ORDER BY is_default DESC, created_at DESC` (`userDatabase.ts:397`). Render in the order received; do not re-sort.

### 7.3 Sending And Uploads — `src/routes/send.ts`

**`POST /parse-excel`** — multipart, single field `excelFile`. Returns `{success, contacts: Contact[] /* first 5 */, totalCount}`. Call this immediately on file selection so the user sees the contact count before composing.

**`POST /provider-info`** — multipart fields `smtpHost`, `hasNotification` (string `"true"`/`"false"`). Returns `{success, data:{provider, dailyLimit, maxContacts, recommendedBatchSize, recommendedDelay}}`. Use it to warn about limits proactively.

**`POST /send`** — multipart. **These sixteen field names are a hard contract.**

| Field | Type | Notes |
| --- | --- | --- |
| `configId` | string | Falls back to the user's default config if unknown |
| `subject` | string | Required; trimmed; supports placeholders |
| `htmlContent` | string | Required **unless** `htmlTemplate` is uploaded. Rejected if empty or exactly `"<p><br></p>"` (`send.ts:154`) — the Quill empty-document sentinel |
| `delay` | string→int | Seconds between emails in non-batch mode; defaults to 20 |
| `useBatch` | `"on"` \| anything else | **String comparison against `"on"`** (`send.ts:92`) |
| `batchSize` | string→int | Default 20 |
| `batchDelay` | string→int | **Minutes** between batches; default 60 |
| `emailDelay` | string→int | **Seconds** between emails in batch mode; default 45 |
| `scheduleEmail` | `"on"` \| else | String comparison (`send.ts:98`) |
| `scheduledTime` | string | **Must be UTC ISO** (`new Date().toISOString()`). See §9.7 |
| `notifyEmail` | string | Optional; presence reduces the provider contact allowance by one |
| `notifyBrowser` | `"on"` \| else | String comparison |
| `emailRangeStart` | string→int | **0-based** index (`send.ts:254`) |
| `emailRangeCount` | string→int | Count, not an end index (`send.ts:255`) |
| `excelFile` | File | Required; rejected if size 0 |
| `htmlTemplate` | File | Optional; when present it **overrides** `htmlContent` entirely |

Server-side sequence: resolve config → validate required fields → **test the SMTP connection** (this makes `POST /send` slow — show a determinate-feeling loading state) → save and parse the Excel → apply the range slice → enforce the provider cap → optionally read the HTML template → branch.

Three success shapes, discriminated by flags:
- Scheduled: `{success, message, jobId, scheduledTime, contactCount, scheduledMode: true, batchMode, configUsed}`
- Batch: `{success, message, contactCount, jobId, batchMode: true, batchConfig, configUsed}`
- Immediate: `{success, message, contactCount, configUsed}` — **no `jobId`**

`POST /test-notification` — JSON `{testEmail}` → `{success, message}`.

### 7.4 Batch And Scheduled Jobs — `src/routes/send.ts`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/batch-status` | `{success, data: BatchStatus}` — `{isRunning, currentJob, totalJobs, completedJobs}` |
| POST | `/batch-pause` | Always returns success, even with no running job |
| POST | `/batch-resume` | Only resumes a job in `Paused` status |
| DELETE | `/batch-cancel` | **Method is DELETE.** Sets status `Failed` and clears the job |
| GET | `/scheduled-jobs` | Only `status IN ('scheduled','running')`; **all users** (§16 R7) |
| DELETE | `/scheduled-jobs/:id` | 404 unless status is still `scheduled` → **disable Cancel for `running` jobs in the UI** |

`currentJob` (when present) supplies: `id`, `totalContacts`, `currentBatch`, `totalBatches`, `emailsSent`, `emailsFailed`, `status`, `startTime`, `nextBatchTime`, `config`. Everything the batch monitor needs is here.

### 7.5 Dashboard And Reports

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/dashboard/poll-status` | `{success, data:{pollNeeded, pollInterval, hasActiveBatch, hasScheduledJobs, hasRunningScheduledJobs, activeBatchCount, scheduledJobCount, lastUpdated, cached}}`. `pollInterval` is 3000 / 10000 / 30000 ms. **On internal error it still returns HTTP 200 with `success: true` and `pollNeeded: false`** plus an `error` key — do not treat a quiet dashboard as proof that nothing is running |
| GET | `/dashboard/data` | `{success, data:{batch, scheduledJobs (max 5), timestamp}}`. Returns `batch: null` unless the cached flag says a batch exists |
| GET | `/report` | `{success, data:{logs: EmailLog[], stats:{total,sent,failed,errors}}}` |
| GET | `/report/export/csv` | `text/csv` with `Content-Disposition: attachment; filename="email-logs.csv"`; fixed nine columns |
| GET | `/report/export/json` | `application/json` attachment |
| DELETE | `/report/clear` | `{success, message}`; irreversible → confirmation modal required |

---

## 8. Feature Parity Inventory

Extracted from `public/index.html`, `public/login.html`, and all ~2545 lines of `public/js/app.js`. This is the checklist that defines "Implement all existing features". Every line must be satisfied before `public/` is deleted.

### 8.1 Authentication (`public/login.html`)
1. Login form: email + password. 2. Register form: name + email + password. 3. Password minimum length 6 enforced client-side. 4. Email format validation. 5. Loading spinner on submit; button disabled while in flight. 6. Inline error/success alerts. 7. Authenticated visitors to auth pages redirect away. 8. Unauthenticated visitors to app pages redirect to login. 9. Current user name and email displayed in the header. 10. Logout (`app.js:1579`).

### 8.2 SMTP Configuration (`app.js:72, 944-1591`)
1. List all configs (`loadUserConfigs`). 2. Select the active config for sending (`selectConfig`). 3. Create (`showNewConfigForm`, `saveNewConfig`). 4. View details with password masked (`viewConfig`). 5. Edit (`editConfig`, `saveEditConfig`), including edit-from-view (`editConfigFromView`). 6. Delete with confirmation (`deleteConfig`). 7. Set default (`setDefaultConfig`). 8. Test connection before saving, on both create and edit forms (`testNewConfig`, `testEditConfig`). 9. Gmail app-password guidance and 16-character validation (`processPassword`, `validateGmailPassword`, `updatePasswordHelp`, `updateEditPasswordHelp`, `validatePasswordInput`, `validateEditPasswordInput`). 10. Password show/hide toggle (`togglePasswordVisibility`). 11. Configs management view (`displayConfigsManagement`) distinct from the compact selector (`displayConfigList`). 12. Default-config badge.

### 8.3 Compose And Upload (`app.js:1596-1732, 2272-2545`)
1. Excel upload, required (`handleExcelFileChange`). 2. Sample spreadsheet download link. 3. Parse on selection via `POST /parse-excel` (`parseExcelFile`). 4. Total contact count displayed. 5. Preview of the first parsed contacts. 6. Range selection: **all / first N / specific row range** (`handleRangeSelectionChange`, `updateRangePreview`, `getSelectedEmailRange`) with live "will send to N of M" preview and out-of-bounds warnings. 7. Optional HTML template upload (`handleHtmlTemplateChange`). 8. Editor content becomes optional when a template is selected, with a visible "(Optional — using HTML template)" hint. 9. Delay input, 15–30 s recommended. 10. Subject with placeholder support. 11. Rich HTML editor with image resize. 12. Preview modal using real parsed contact data where available (`previewEmail`). 13. Provider limit info panel. 14. Correct multipart assembly (`sendEmails`).

### 8.4 Sending Modes (`app.js:464-704`)
1. Immediate send. 2. Batch send. 3. Scheduled send. 4. Batch size / batch delay / email delay inputs. 5. Batch preview calculation (`updateBatchPreview`). 6. Schedule datetime input with a future-time check and the user's timezone displayed. 7. **Local → UTC ISO conversion before submit** (`app.js:583`). 8. Notification email input. 9. Browser notification permission + notification on schedule success. 10. Test notification button (`testNotification`). 11. Distinct success modals per mode (`showSuccessModal`) showing job ID, schedule time, batch parameters, and config name. 12. Client-side validation for missing config / subject / Excel / content before any request.

### 8.5 Dashboard And Monitoring (`app.js:248-463, 1733-2076`)
1. Active Jobs Dashboard. 2. Active batch section. 3. Upcoming scheduled jobs section. 4. Recent activity timeline (`updateJobTimeline`, `getRecentActivity`, `addActivity`, `localStorage`-backed). 5. Adaptive polling driven by `/dashboard/poll-status` (`checkSystemState`, `startAdaptivePolling`, `stopAllPolling`). 6. Dashboard data fetched only when jobs exist (`updateDashboardData`). 7. Fast 3 s polling while a batch is active (`startBatchMonitoring`). 8. Immediate state re-check after creating a job (`triggerStateCheck`). 9. Batch progress bar. 10. Sent/failed counts. 11. Current batch / total batches. 12. Next-batch countdown. 13. Pause / 14. Resume / 15. Cancel (`pauseBatch`, `resumeBatch`, `cancelBatch`). 16. Scheduled jobs list (`displayScheduledJobs`) and 17. cancel scheduled job (`cancelScheduledJob`). 18. Dashboard hidden when idle (`hideDashboard`). 19. Report auto-refresh only while jobs run **and** the report view is visible (`refreshReportIfVisible`).

### 8.6 Reports (`app.js:2077-2222`)
1. Four stat cards: total / sent / failed / errors (`displayStats`). 2. Logs table (`displayLogs`) with email, status, first name, company, subject, timestamp, message ID, error. 3. Colour-and-text status display. 4. Export CSV / 5. Export JSON (`exportReport`). 6. Manual refresh (`refreshReport`) and silent refresh. 7. Clear logs with confirmation (`clearLogs`). 8. Auto-refresh indicator badge.

**Required additions** (`PROJECT_ASSIGNMENT.md` §5 "searchable, filterable, sortable", "Date range filtering", "Status filtering"), absent from the old UI and therefore genuine "enhanced UX" to highlight in the README: 9. client-side search; 10. status filter; 11. date-range filter; 12. sortable columns.

### 8.7 Cross-Cutting (`app.js:2347-2412`)
1. Alert/toast system (`showAlert`) with auto-dismiss. 2. Success modal. 3. Consistent button loading states. 4. Confirmations before every destructive action.

---

## 9. Phase-By-Phase Implementation Roadmap

Each phase lists exact actions, dependencies, likely failure points, and an exit gate. **Do not start a phase until the previous exit gate passes.** The ordering front-loads the two things that silently sink this migration — the runtime swap and the auth/cookie topology — so that neither is discovered late.

### Phase 0 — Baseline And Safety
**Depends on:** nothing.
1. Confirm a clean working tree (`git status`).
2. Create branch `feat/sveltekit-migration`.
3. Tag or note the current commit so a full diff is possible at the end (§6.3).
4. Record the Node version in use; ensure ≥ 20.
5. Keep `public/` untouched — it is the parity reference until Phase 11.
6. Read §8 end to end before writing code.

**Failure point:** starting on `main` and losing the ability to show a clean diff.
**Exit gate:** branch created; baseline commit recorded.

### Phase 1 — Backend Runtime Migration
**Depends on:** Phase 0.
1. Apply §6.1 steps 1–3 and 8–11 (dependencies, SQLite driver, `Timer` type, tsconfig, lockfile, dead-file deletion). **Leave static serving in place for now** — the old frontend is still the reference.
2. Fix the four `require()` calls in `src/routes/dashboard.ts` per §6.4 item 1; make both handlers async.
3. Run `npx tsc --noEmit` and fix only the type errors introduced or surfaced (§6.4 items 2–3). Do not refactor logic.
4. `npm run dev`; confirm the startup banner, both SQLite files created under `data/`, and the scheduler's "checking every minute" log.
5. `curl /health` → 200.
6. Register a user via `curl`, confirm `Set-Cookie: session_token`, then call `/auth/me` with that cookie → 200.
7. Load `http://localhost:3000/login` in a browser and exercise the **old** UI end to end: login, create an SMTP config, test connection, upload the sample spreadsheet, view reports. This proves the runtime swap preserved behaviour, using the known-good frontend as the oracle.

**Failure points:** `better-sqlite3` native build failure (fix the toolchain now, not later); `require is not defined` from `dashboard.ts`; `tsc` surfacing pre-existing strict errors; forgetting that `npm ci` needs the committed lockfile.
**Exit gate:** the entire old frontend works against the Node backend, with no `bun` command anywhere in the workflow.

### Phase 2 — Topology Decision And Contract Freeze
**Depends on:** Phase 1.
1. Choose Option A (proxy) or Option B (direct CORS) from §6.2. **Write the decision and its rationale down now** — it determines the adapter, the auth-guard style (§5.4), and the deployment shape.
2. If Option A: decide the proxy path prefix and confirm cookie pass-through works with a throwaway script before building on it.
3. If Option B: configure `cors({ origin, credentials: true })` and verify a `credentials: 'include'` request from a different port succeeds.
4. Freeze §7 as the contract. Any later surprise gets recorded in §2.2 rather than worked around silently.

**Failure point:** deferring this decision — it is the one choice that is expensive to reverse after routes exist.
**Exit gate:** an authenticated cross-origin (or proxied) request succeeds from a browser page served on a different port from the backend.

### Phase 3 — Frontend Scaffold
**Depends on:** Phase 2.
1. Create the SvelteKit + TypeScript project at `frontend/`.
2. Configure `strict: true`; add scripts `dev`, `check`, `build`, `preview`, `lint`, `format`.
3. Install the adapter matching the Phase 2 decision.
4. Configure the styling system (§5.5) and write `app.css` with the full token set.
5. Create the complete directory skeleton from §5.1 — empty folders now beat ad-hoc placement later.
6. Copy `public/samples/sample-contacts.xlsx` → `frontend/static/samples/sample-contacts.xlsx`. **Do this now, not in Phase 11** — it is the single most-forgotten artefact.
7. Write `lib/api/client.ts` per §5.8 with all six obligations, especially the "never set Content-Type on FormData" rule.
8. Write `lib/types/api.ts` mirroring `src/types.ts` plus the response envelopes.
9. Write `frontend/.env.example` documenting the API base URL variable.
10. Build the `ui/` primitives from §5.3 against a throwaway component-gallery route — building them in isolation is what makes them genuinely reusable rather than accidentally coupled.

**Failure points:** `.env` variables not exposed to the client (SvelteKit requires the `PUBLIC_` prefix for browser-visible values); building `ui/` components inline inside feature pages and never extracting them.
**Exit gate:** `npm run check` clean; `npm run build` succeeds; the gallery route renders every primitive at all three breakpoints.

### Phase 4 — Authentication
**Depends on:** Phase 3. **Blocks everything else** — no other route is reachable without a session.
1. `lib/api/auth.ts`: `login`, `register`, `logout`, `me`.
2. `lib/stores/auth.ts` with a derived `isAuthenticated`.
3. `(auth)` layout and the `/login`, `/register` pages.
4. Client validation mirroring `src/routes/auth.ts` exactly: required fields, password ≥ 6, the same email regex. Mirroring prevents an avoidable round trip and a confusing server error.
5. Loading states, disabled submit while in flight, inline error rendering (surface the server's `message` verbatim — e.g. "An account with this email already exists").
6. `(app)/+layout.{ts|server.ts}` guard per the Phase 2 decision; `redirectTo` support.
7. `(app)/+layout.svelte` app shell: `Navbar`, `Sidebar`, `UserMenu` showing name and email, logout action.
8. Handle 401 centrally in the client, with the `/auth/me` exemption.

**Failure points:** cookie not persisted (revisit Phase 2 — do not paper over it); redirect loop when `/auth/me` 401s inside the guard; guard running in the wrong environment (`+layout.server.ts` has no browser cookie unless proxied).
**Exit gate:** register → auto-login → reload persists session → deep link to `/reports` while logged out redirects to login and returns there after login → logout clears the session and blocks back-navigation.

### Phase 5 — SMTP Configuration
**Depends on:** Phase 4. **Blocks Phases 6–7** — no config, no send.
1. `lib/api/config.ts` for all seven endpoints (§7.2), using the **actual** route names.
2. `/configs` page listing configs in backend order, with the default marked.
3. `ConfigForm` handling create and edit. **On edit, omit `pass` unless the user typed a new one** (§7.2 note 2).
4. `ConfigDetails` with a masked password.
5. Delete via `ConfirmDialog`.
6. Set default.
7. Test connection on both create and edit forms, with a clear pass/fail result.
8. `ProviderHelp` carrying over the Gmail app-password guidance and 16-character check from `app.js:763-926`.
9. Empty state for zero configs, linking to create.
10. Invalidate/refetch the config list after every mutation.

**Failure points:** sending `pass: ""` on edit and destroying the stored password (**test this explicitly**); re-sorting the list and losing the default-first ordering; rendering `data.pass` anywhere in the DOM.
**Exit gate:** create → test → set default → edit *without* touching the password → verify sending still works → delete. Password never appears in the DOM or in a network response body rendered to screen.

### Phase 6 — Compose And Upload
**Depends on:** Phase 5.
1. `/send` page.
2. `ConfigSelector`; block submission with a clear message when nothing is selected.
3. `ContactUploader` → `POST /parse-excel` on selection → total count + first-5 preview.
4. `EmailRangeSelector`: all / first N / specific range, with the live preview and out-of-bounds warnings from `app.js:2437-2513`.
5. Convert the selection to `emailRangeStart` (**0-based**) and `emailRangeCount` (**a count**) exactly as `app.js:2516-2545` does. Off-by-one here silently sends to the wrong people.
6. Subject field with placeholder hint.
7. `RichTextEditor`, lazy-loaded.
8. `TemplateUploader`; when a template is chosen, mark editor content optional and show the hint.
9. `EmailPreviewModal` using `lib/utils/placeholders.ts`, a faithful port of `FileService.replacePlaceholders` — five known placeholders plus every other Excel column name. Use the first real parsed contact when available.
10. `POST /provider-info` after config selection; surface the limit before the user builds a campaign that will be rejected.

**Failure points:** the 0-based/1-based conversion; setting `Content-Type` on the `FormData` request; a preview that diverges from server-side replacement and therefore lies.
**Exit gate:** upload the sample spreadsheet → correct count → each range mode yields the arithmetically correct `start`/`count` → preview substitutes real contact values → provider limits shown.

### Phase 7 — Sending Modes
**Depends on:** Phase 6. **The highest-risk phase.**
1. One `buildSendFormData()` function producing all sixteen fields from §7.3. Centralising this makes the contract auditable in one place.
2. Boolean fields must be the literal string `"on"` when enabled.
3. Batch toggle + size/delay/email-delay inputs + batch preview calculation.
4. Schedule toggle + `datetime-local` input; minimum five minutes in the future (matching the old UI's hint); display the user's IANA timezone.
5. **Convert to UTC ISO before submitting** (§9.7 below).
6. Notification email, browser-notification checkbox with permission request, test-notification button.
7. Submit with a loading state that explains the wait — `POST /send` performs a live SMTP `verify()` before responding.
8. Handle all three success shapes with distinct confirmations (job ID, schedule time, batch parameters, config name).
9. Push an entry to the `activity` store on success.
10. Trigger an immediate dashboard state re-check after any job is created (`app.js:645`, `:684`).
11. Surface server error messages verbatim — they contain actionable SMTP guidance.

**Failure points:** sending the raw `datetime-local` string (campaigns fire at the wrong hour); `"true"` instead of `"on"` (batch/schedule silently ignored, emails send immediately); a misspelled field name defaulting silently server-side.
**Exit gate:** capture `POST /send` in the network tab and verify all sixteen fields byte-for-byte. Schedule a job two minutes out and confirm it fires at the right wall-clock time. Confirm each of the three response modes renders correctly.

### Phase 8 — Dashboard And Monitoring
**Depends on:** Phase 7 (needs real jobs to observe).
1. `/dashboard` as the post-login landing route.
2. Call `/dashboard/poll-status` on mount.
3. Poll **only** when `pollNeeded` is true, at exactly the returned `pollInterval`. Do not invent an interval — the backend's adaptive values (3 s / 10 s / 30 s) are the design.
4. Call `/dashboard/data` only when jobs exist.
5. `BatchMonitor` from `/batch-status`: progress bar, sent/failed, current/total batch, next-batch countdown derived from `nextBatchTime`.
6. Pause / Resume / **Cancel via DELETE**.
7. `ScheduledJobsPreview` (max 5, matching the backend slice).
8. `ActivityTimeline` from the `localStorage`-backed store.
9. **Stop every timer on unmount and on navigation.** The old code leaked intervals; a store-owned handle with explicit teardown fixes it.
10. Refresh reports only while jobs run and the reports view is mounted.

**Failure points:** polling forever when idle (the explicit anti-goal of the backend's `pollNeeded` design); leaked intervals accumulating across navigations; treating the error-path 200 response (§7.5) as "nothing is running".
**Exit gate:** network tab shows **zero** dashboard requests while idle; starting a batch begins 3 s polling; completion returns polling to idle; navigating away leaves no live timers.

### Phase 9 — Scheduled Jobs
**Depends on:** Phase 7.
1. `/scheduled` page from `GET /scheduled-jobs`.
2. Show subject, contact count, scheduled time (in the user's local timezone — the API returns UTC ISO), status, notification email, batch mode, config name.
3. **Disable Cancel for `running` jobs** — the backend only cancels `scheduled` ones and returns 404 otherwise.
4. `DELETE /scheduled-jobs/:id` with confirmation; refetch after success.
5. Empty state.
6. Note in the UI or README that the scheduler ticks once a minute, so execution may lag the scheduled time by up to 60 s.

**Failure points:** rendering UTC as if it were local; offering Cancel on a running job and showing an unexplained 404.
**Exit gate:** create → appears in the list at the correct local time → cancel → disappears; a running job's Cancel control is disabled with an explanatory tooltip.

### Phase 10 — Reports
**Depends on:** Phase 4 (independent of 6–9, and safe to parallelise).
1. `/reports` from `GET /report`.
2. Four stat cards.
3. Logs table with all eight columns.
4. Client-side search (debounced), status filter, date-range filter, sortable columns — the required enhancements from §8.6.
5. CSV and JSON export via a blob download helper; both endpoints set `Content-Disposition`.
6. Clear logs behind `ConfirmDialog`; refetch after.
7. Responsive: the eight-column table must stack into cards below `md` (§3.5).
8. Empty state.
9. Status shown with icon **and** text, not colour alone (§10).

**Failure points:** the eight-column table breaking mobile layout; export downloads failing under the proxy topology if the blob path is not handled; forgetting that filters are client-side (the endpoint has no query parameters).
**Exit gate:** stats match the raw response; each filter and sort verified; both exports download real files; clear-logs empties the table; usable at 375 px.

### Phase 11 — Old Frontend Removal
**Depends on:** Phases 4–10 **all** complete. Do not run this early.
1. Verify `frontend/static/samples/sample-contacts.xlsx` exists and downloads from the new UI.
2. Walk §8 and confirm every numbered item.
3. Delete `public/index.html`, `public/login.html`, `public/css/style.css`, `public/js/app.js`, `public/samples/`, and the `public/` directory.
4. Delete `src/routes/index.ts` and its mount in `src/app.ts`.
5. Apply the remaining §6.1 steps 4, 6, 7 (static mounts, `GET /login`, `notFound`, public-path lists, `"./public"` in `initializeDirectories`).
6. `grep -ri "public/" src/` → no results. `grep -r "serveStatic" src/` → no results.
7. Restart the backend; confirm `GET /` returns JSON 404 and every API route still works.
8. Update `.github/labeler.yml` frontend globs and remove the `index.ts` reference.

**Failure points:** deleting `public/` before rescuing the sample file; leaving a dangling `indexRoutes` import that crashes startup; `notFound` still redirecting to a `/login` that no longer exists.
**Exit gate:** backend starts clean with no `public/` on disk; the full frontend still works; the Success Indicator "No old frontend code remains" is objectively true.

### Phase 12 — Accessibility, Responsive, And Polish
**Depends on:** Phase 11.
1. Execute §10 in full.
2. Verify every route at 375 / 768 / 1440 px.
3. Confirm loading, empty, and error states exist on every async surface.
4. Verify focus management in every modal.
5. Keyboard-only pass over every flow.
6. Confirm no status is conveyed by colour alone.
7. Check colour contrast against the token palette.
8. Remove all `console.log` debugging (the old `app.js` is full of it — do not inherit the habit).

**Exit gate:** §12.2 accessibility rows all pass.

### Phase 13 — Documentation
**Depends on:** Phase 12 (screenshots need the finished UI).
1. Rewrite `README.md` per §13.
2. Update `CONTRIBUTING.md` to npm; add the frontend section; correct "Express" → Hono.
3. Update root `.env.example` and add `frontend/.env.example`.
4. Update `.github/workflows/pr-checks.yml` for both packages; confirm `npm ci` now works with the committed lockfile.
5. Update `.github/labeler.yml`.
6. Capture screenshots per §13.8.
7. Record the `git diff --stat src/` summary for §13.4.

**Exit gate:** a reader with only the README can clone, install, configure, and run both apps.

### Phase 14 — Final Verification And Submission
**Depends on:** Phase 13.
1. Execute §11 in full.
2. Execute the §12 checklist.
3. Apply the §12.4 go/no-go gate.
4. Execute §15.
5. Push; verify CI; share the repository link.

---

### 9.7 Timezone Handling — Called Out Separately Because It Is The Quietest Bug

`<input type="datetime-local">` yields a string like `2026-08-10T15:30` with **no timezone**. `new Date("2026-08-10T15:30")` interprets it as **local** time. The old frontend then calls `.toISOString()` to convert to UTC before sending (`app.js:575-586`), and `src/routes/send.ts:353` parses the received string directly with `new Date()`.

**Required behaviour:** send `new Date(localInputValue).toISOString()` in `scheduledTime`.
**Failure mode if skipped:** the raw local string is parsed by the server in *its* timezone. In production the server is almost always UTC, so a campaign scheduled for 15:30 local fires at 15:30 UTC — hours off, with no error anywhere. Add an explicit test for this in §11.

---

## 10. Accessibility And Semantic HTML

`PROJECT_ASSIGNMENT.md` §"UI/UX Requirements" and `README.md` §"Design Principles" both require: "**Accessible** (ARIA labels, keyboard navigation)". This is an explicit requirement, not a nice-to-have.

**Semantic structure.** `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` — not `<div>` soup (the old UI is `container-fluid` divs throughout). One `<h1>` per route; heading levels never skip. Real `<table>` with `<thead>`/`<tbody>`/`<th scope="col">` for the logs table. `<form>` elements with real submit buttons so Enter works. `<button type="button">` for actions and `<a>` for navigation — never `<div onclick>` (the old UI uses inline `onclick` on `<a href="#">` throughout, e.g. `index.html:325`).

**Forms.** Every input has a `<label for>`. Errors are linked via `aria-describedby` and announced with `role="alert"`. Required fields carry `required` and a visible marker, not colour alone. Field-level errors sit adjacent to their field, not only in a page-level banner.

**Interactive components.** Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title, focus moved in on open, focus trapped, `Esc` closes, focus restored to the trigger on close. Icon-only buttons carry `aria-label` (the old UI has several: password toggle, refresh). Toasts live in an `aria-live="polite"` region. Progress bars use `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`. Disabled controls explain *why* via `title` or adjacent text — especially the Cancel button on running scheduled jobs (§9 Phase 9).

**Keyboard.** Every interactive element reachable by Tab in a logical order; visible focus indicators everywhere (never `outline: none` without a replacement); a skip-to-content link; sortable table headers operable with Enter/Space; the file input operable without a mouse.

**Colour and contrast.** Status is conveyed by icon + text + colour, never colour alone — this matters most in the logs table, where `Sent`/`Failed`/`Error` are currently distinguished only by the colour classes in `public/css/style.css`. Body text ≥ 4.5:1 contrast; large text and UI borders ≥ 3:1.

**Motion and content.** Respect `prefers-reduced-motion`. `<html lang="en">`. Descriptive `<title>` per route. `alt` on every meaningful image; `alt=""` on decorative ones.

---

## 11. Testing And Validation Protocol

`PROJECT_ASSIGNMENT.md` §"Testing Requirements" names twelve areas across backend and frontend. Automated tests are `[OPTIONAL]`; **verification is not**. This protocol is the floor.

### 11.1 Backend Areas (all six from the brief)
1. **Registration/login** — register new; duplicate email → 409; password < 6 → 400; malformed email → 400; login correct → 200 + cookie; login wrong password → 401.
2. **SMTP config CRUD** — create; list; update *without* `pass` and confirm sending still works; update *with* `pass`; set default and confirm exclusivity; delete; test connection with valid and invalid credentials.
3. **Sending** — immediate; batch; scheduled. Verify each response shape and that emails actually arrive.
4. **File upload** — valid `.xlsx`; a file with no Email column → clear error; a file with some invalid emails → those rows skipped; an empty file → error.
5. **Report generation** — logs accumulate after a send; stats arithmetic is correct; CSV and JSON exports parse.
6. **Session validation** — no cookie → 401; tampered cookie → 401 (the HMAC signature check at `userDatabase.ts:174` should reject it); valid cookie → 200.

### 11.2 Frontend Areas (all six from the brief)
1. **Component rendering** — every `ui/` primitive in every variant and state via the gallery route.
2. **Form validation** — each form rejects invalid input client-side with a clear message before any request.
3. **API integration** — every endpoint in §7 exercised from the UI at least once.
4. **Navigation** — every route reachable; back/forward correct; deep links work; active state correct.
5. **State management** — auth survives reload; toasts queue and dismiss; activity timeline persists; polling starts and stops correctly.
6. **Responsive design** — every route at 375 / 768 / 1440 px.

### 11.3 Contract Tests — The Ones That Catch Silent Failures
1. **`POST /send` field audit.** Capture the request; assert all sixteen names from §7.3, correct casing, `"on"` for enabled booleans.
2. **Timezone round-trip.** Schedule for `now + 2 min` local. Assert the payload is UTC ISO. Assert `GET /scheduled-jobs` shows the correct local time. Assert it fires within ~60 s of the target.
3. **Range arithmetic.** With 10 contacts: "all" → `start 0, count 10`; "first 3" → `start 0, count 3`; "rows 4–6" → `start 3, count 3`. Confirm server-side selection matches by checking the logs.
4. **Placeholder fidelity.** Compose using `{{FirstName}}`, `{{Company}}`, and a custom column. Assert the preview output is character-identical to the delivered email body.
5. **Password preservation.** Edit a config's name only; confirm sending still succeeds afterwards.
6. **Polling discipline.** Idle for two minutes with DevTools open; assert zero dashboard requests.
7. **Multipart headers.** Assert the `POST /send` request has a `multipart/form-data; boundary=…` Content-Type that the client did **not** set manually.

### 11.4 Optional Automation
Vitest for `lib/utils/*` (validation, formatters, placeholders, range arithmetic — all pure and cheap to cover). `@testing-library/svelte` for the `ui/` primitives. Playwright for one end-to-end path: register → create SMTP config → upload sample → preview → schedule → verify in `/scheduled`. All `[OPTIONAL]` per `PROJECT_ASSIGNMENT.md` Phase 8, but the pure-function unit tests are the highest value per minute spent.

---

## 12. Quality Assurance Checklist And Go/No-Go Gate

### 12.1 UI Quality, Layout, Hierarchy, Responsiveness
- [ ] Each route has one clear purpose and a single `<h1>`.
- [ ] Visual hierarchy guides the eye to the primary action on every screen.
- [ ] No screen reproduces the old UI's clutter (§5.2).
- [ ] Consistent spacing, typography, and colour from tokens only.
- [ ] All ten required component types (§3.6) exist as reusable components.
- [ ] Every route verified at 375 / 768 / 1440 px.
- [ ] No horizontal page scroll at any breakpoint.
- [ ] The eight-column logs table is usable on mobile.
- [ ] No text overflows buttons, cards, table cells, or the sidebar.
- [ ] Loading, empty, and error states exist for every async surface.
- [ ] Every destructive action is confirmed.

### 12.2 Accessibility
- [ ] Semantic landmarks used throughout.
- [ ] Every input has an associated label.
- [ ] Errors linked with `aria-describedby` and announced.
- [ ] Modals: focus trap, `Esc`, focus restoration, correct ARIA.
- [ ] Icon-only buttons have `aria-label`.
- [ ] Toasts in an `aria-live` region.
- [ ] Progress bars have full ARIA value attributes.
- [ ] Full keyboard operability; visible focus everywhere.
- [ ] Active nav item carries `aria-current="page"`.
- [ ] No status conveyed by colour alone.
- [ ] Contrast ratios met.
- [ ] `prefers-reduced-motion` respected.

### 12.3 Code Organisation, Reuse, Maintainability
- [ ] Folder structure matches §5.1.
- [ ] `grep -r "fetch(" frontend/src` returns hits only in `lib/api/client.ts`.
- [ ] No `ui/` component imports from `lib/api`, `lib/stores`, or a feature folder.
- [ ] `npm run check` passes with zero errors; no `any` in `lib/`.
- [ ] No commented-out code blocks; no leftover `console.log`.
- [ ] Naming is consistent (PascalCase components, camelCase functions, kebab-case routes).
- [ ] Non-obvious logic is commented — specifically the UTC conversion, the range arithmetic, and the `"on"` string convention.
- [ ] No secrets or credentials committed.

### 12.4 API Integration Correctness
- [ ] Every §7 endpoint used by the old UI is wired.
- [ ] The §2.2 corrected route names are used, not the brief's examples.
- [ ] All sixteen `POST /send` fields verified in a live capture.
- [ ] `credentials: 'include'` on every request.
- [ ] Content-Type never set manually on `FormData`.
- [ ] `scheduledTime` sent as UTC ISO.
- [ ] Booleans sent as `"on"`.
- [ ] `emailRangeStart` is 0-based; `emailRangeCount` is a count.
- [ ] `pass` omitted from config updates unless changed.
- [ ] 401 handled centrally without redirect loops.
- [ ] Server error messages surfaced verbatim.
- [ ] Polling honours `pollNeeded` and `pollInterval`; stops when idle; no leaked timers.

### 12.5 Backend Constraint Compliance
- [ ] `git diff src/` limited to the changes enumerated in §6.3.
- [ ] No SQL statement altered.
- [ ] No table or column renamed.
- [ ] No route path changed.
- [ ] No request field or response key changed.
- [ ] Cookie name, options, and hashing untouched.
- [ ] Provider-limit values untouched.
- [ ] No new backend endpoint added.

### 12.6 Old Frontend Removal
- [ ] `public/` does not exist.
- [ ] `src/routes/index.ts` deleted and unmounted.
- [ ] No `serveStatic` import remains.
- [ ] `grep -ri "public/" src/` returns nothing.
- [ ] `notFound` returns JSON for all unmatched paths.
- [ ] `sample-contacts.xlsx` downloads from the new frontend.
- [ ] `index.ts`, `src/services/middleware`, `bun.lock` deleted.

### 12.7 Documentation
- [ ] README covers all sections in §13.
- [ ] Backend and frontend setup each work from a clean clone.
- [ ] Every environment variable documented.
- [ ] API reference matches §7 and notes the §2.2 corrections.
- [ ] Framework choice justified in writing.
- [ ] Screenshots present (§13.8).
- [ ] Improvements over the original frontend listed and honest (§13.7).
- [ ] Tooling/AI-usage disclosure, **if included**, is accurate and specific, and separates AI-assisted from manually authored work (§13.9). If omitted, that is compliant — no source document requires it.
- [ ] No invented "bonus" feature is claimed anywhere (§13.14); the API reference states that no backend endpoint was added.
- [ ] Known limitations documented (§13.10).
- [ ] Deployment guide present.
- [ ] `CONTRIBUTING.md` uses npm and says Hono, not Express.
- [ ] No stale references to Bun or `public/` anywhere in the docs.

### 12.8 Repository And CI
- [ ] `package-lock.json` committed; `npm ci` succeeds.
- [ ] `.gitignore` covers frontend artefacts; duplicate line removed.
- [ ] `.github/labeler.yml` updated.
- [ ] `pr-checks.yml` validates both packages.
- [ ] `npm test` does not fail the build, or is replaced with real tests.
- [ ] No `.env` file committed; no database, upload, or log files committed.
- [ ] Commit messages follow the `CONTRIBUTING.md` convention.

### 12.9 Go / No-Go Gate

**Blocking — any single failure means NO-GO:**

| # | Condition |
| --- | --- |
| B1 | Backend starts on Node with no Bun dependency. |
| B2 | Register, login, session persistence, and logout all work. |
| B3 | SMTP config create / edit / delete / set-default / test all work. |
| B4 | Excel upload parses and the contact count is correct. |
| B5 | Immediate, batch, and scheduled sends all succeed with correct payloads. |
| B6 | `scheduledTime` is sent as UTC ISO and jobs fire at the correct wall-clock time. |
| B7 | All sixteen `POST /send` field names verified live. |
| B8 | Batch monitoring, pause, resume, and cancel work. |
| B9 | Reports display, filter, sort, and export correctly. |
| B10 | Every route is responsive at all three breakpoints. |
| B11 | `public/` and all old-frontend serving are gone; the sample file still downloads. |
| B12 | `git diff src/` shows only the §6.3-permitted changes. |
| B13 | `npm run check` passes in `frontend/`; `tsc --noEmit` passes in the backend. |
| B14 | README enables a clean-clone setup by a stranger. |
| B15 | Repository pushed; CI green; link ready to share. |

**Non-blocking — ship without them, but list each in "Future Improvements":** TanStack Query; E2E tests; dark mode; derived sending-rate metric; optimistic updates; live deployment; footer.

**Gate rule:** all fifteen blocking conditions pass → **GO**. Any failure → **NO-GO**; fix and re-run the full checklist. Do not submit with a known-failing blocker and a note apologising for it — `task1.md` states plainly that incomplete submissions may not be considered.

---

## 13. README Blueprint

`PROJECT_ASSIGNMENT.md` §5 and §9 and `README.md` §3 require the README to be rewritten. This blueprint specifies **what it must say**, not merely which headings to use.

### 13.1 Title And Overview
Name the project, state that this is a frontend migration of an existing Hono + vanilla-JS bulk email sender to SvelteKit, and state in one sentence what the application does: authenticated users configure SMTP accounts, upload Excel contact lists, compose personalised HTML emails, and send them immediately, in batches, or on a schedule, with live monitoring and exportable reports. Include a badge or line for the stack: SvelteKit · TypeScript · Hono · SQLite · Nodemailer.

### 13.2 Screenshots — Early, Not Buried
Place two or three screenshots directly under the overview. `PROJECT_ASSIGNMENT.md` lists "Screenshots/Demo — Visual proof of work" as a **deliverable**; a reviewer should see the work before scrolling.

### 13.3 Why This Framework — Required Argument
`task1.md` grades "Architectural and decision-making clarity" and asks for a choice you can "confidently justify". Write two or three paragraphs covering: that `PROJECT_ASSIGNMENT.md` specified SvelteKit and `task1.md` left the choice open, so the specified option was taken; why SvelteKit fits *this* application (file-based routing maps cleanly onto the five operational screens; layout groups express the auth boundary declaratively; stores fit the polling/toast/activity state that the old `app.js` kept in module globals; small runtime for a dashboard that polls frequently); and the trade-off acknowledged (a smaller ecosystem than React, accepted because the app needs few third-party components beyond a rich text editor).

### 13.4 Architecture Overview
Describe the two-app topology: a SvelteKit frontend in `frontend/` and the unchanged Hono API at the repository root. Include the directory tree from §5.1. State the request topology chosen in Phase 2 (proxy or direct CORS) and why. **Include the "what changed in the backend" summary** from §6.3 as an explicit list — this is the clearest possible evidence that `task1.md`'s central constraint was honoured, and it should not be left for the reviewer to infer from a diff.

### 13.5 Setup Instructions — Two Independent Paths
**Prerequisites:** Node ≥ 20, npm, and (for real sending) SMTP credentials — noting that Gmail requires an App Password with 2FA enabled.

**Backend:** clone → `npm install` → `cp .env.example .env` → fill values → `npm run dev` → verify at `http://localhost:3000/health`. State that `data/`, `uploads/`, and `logs/` are created automatically on first run and are gitignored.

**Frontend:** `cd frontend` → `npm install` → `cp .env.example .env` → set the API base URL → `npm run dev` → open the printed URL.

**Environment variables:** a table with every key, its purpose, whether it is required, and an example. Cover `PORT`, `SESSION_SECRET` (and the warning that omitting it invalidates all sessions on restart — `userDatabase.ts:71-76`), the `SMTP_*` fallback set, the optional `NOTIFICATION_SMTP_*` set, and the frontend's API base URL variable.

**First-run walkthrough:** register → add an SMTP config → test the connection → download the sample spreadsheet → upload it → compose → preview → send. This turns the README into a demo script the reviewer can follow.

### 13.6 Features And API Reference
List features by area, mirroring §8's grouping. Then document every endpoint from §7 with method, path, request payload, and response shape. **Include a short subsection noting that several endpoint names in `PROJECT_ASSIGNMENT.md` differ from the implemented routes** (§2.2), listing the corrections and stating that the implementation follows the code. This converts a potential "they used the wrong endpoints" impression into visible evidence of care — it directly serves the "Attention to detail" criterion.

### 13.7 Improvements Over The Original Frontend — Make The Manual Work Visible
`PROJECT_ASSIGNMENT.md` §3 requires "all existing features **with enhanced UX**", and `task1.md` grades "Attention to detail". Parity alone does not demonstrate either. This section is where deliberate improvements are claimed, in a plain list, each phrased as *what changed and why it is better* — not as a feature list. Draw from the work itself; at minimum it should cover:

- **Routing replaces tab-toggling.** The old UI toggled `.d-none` on three divs (`public/js/app.js:709`), so there was one URL for the whole app — no deep links, no browser back, no bookmarks. Every section is now a real route.
- **Configuration moved out of the compose screen.** SMTP management was a large card sitting above the compose form; it now has its own `/configs` route, leaving compose with a simple selector.
- **Reports gained search, status filtering, date-range filtering, and sortable columns** — required by `PROJECT_ASSIGNMENT.md` §5 and entirely absent from the old table.
- **One reusable `Modal` replaces four bespoke Bootstrap modals**, with focus trapping and `Esc` handling the originals lacked.
- **Polling lifecycle is owned by a store with explicit teardown**, replacing module-level interval globals that leaked across navigations.
- **Accessibility work that did not exist before**: labelled inputs, `aria-current` on navigation, `aria-live` toasts, keyboard-operable tables, status conveyed by icon and text rather than colour alone.
- **Typed API layer**: a single client and typed response envelopes replace 24 scattered raw `fetch` calls.
- **Contract fixes carried forward deliberately**: the UTC scheduling conversion, the 0-based range arithmetic, and the `"on"` boolean convention were each identified in the old code and preserved intentionally — say so, because a reviewer cannot otherwise distinguish "preserved carefully" from "copied blindly".

Keep this list honest and specific. Do not pad it with things the old UI already did.

### 13.8 Screenshots Section — Concrete Minimum
At least five images in `docs/screenshots/`, referenced with descriptive alt text: (1) login, (2) dashboard with an active batch job showing progress, (3) compose with contacts parsed and range selection visible, (4) SMTP configuration list, (5) reports with filters applied. Plus at least one mobile-width capture demonstrating the responsive layout. A short GIF of a send flow is `[OPTIONAL]` and strong evidence if included.

### 13.9 Development Notes And Tooling Disclosure — `[OPTIONAL]`
No source document requires an AI-usage disclosure (§2.5). Including one is nonetheless recommended as honest practice. If included, it must be **accurate and specific**, not decorative: name which parts were AI-assisted (for example scaffolding, boilerplate component generation, documentation drafting), name which parts were authored or substantially reworked manually (for example the API contract reconciliation, the timezone handling, the polling lifecycle, the range arithmetic), and state that all generated code was reviewed and tested. Keep AI-assisted and manual work clearly separated rather than blended into a vague acknowledgement. **Do not overstate manual work, and do not overstate AI involvement** — an inaccurate disclosure is worse than none.

### 13.10 Known Limitations — Honest, Because They Are Deliberate
Explain up front that `task1.md` forbids modifying backend logic, so the following are **documented rather than fixed**:
- `GET /report`, `GET /scheduled-jobs`, and the batch-control endpoints are not user-scoped — all authenticated users see the same global data (`src/routes/report.ts` never calls `requireAuth`; `schedulerService.getScheduledJobs()` filters by status only).
- `GET /config/smtp` returns the active configuration's SMTP password in its `data` field. The UI never renders it, but it is present in the response.
- The batch service holds one job in memory: only one batch can run at a time, and state is lost on restart.
- Email logs live in `logs/email-logs.json`, not SQLite, and are global rather than per-user.
- The scheduler polls once a minute, so jobs can fire up to 60 s late.
- `getUserScheduledJobs()` and `getJobHistory()` exist in the service but have no routes.

### 13.11 Future Improvements
Everything non-blocking from §12.9, plus the natural fixes to §13.10's limitations if the backend constraint were lifted.

### 13.12 Deployment
Required by `PROJECT_ASSIGNMENT.md` §9 **even if nothing is deployed**. Summarise §14: the frontend adapter choice, the backend's need for a persistent disk, the environment variables each side requires, and — critically — the cookie/CORS consequence of splitting the two across different sites.

### 13.13 Scripts Reference
A table of every npm script in both packages with a one-line description, so a reviewer never has to open `package.json` to find out how to run something.

### 13.14 Bonus Scope — State Plainly That There Is None
No source document defines a bonus feature, a lead-capture form, or an extra API route (§2.5, §3.10). The README should therefore contain **no** "bonus" section. If a reviewer's rubric expects one, the honest answer belongs in "Future Improvements", not invented into the submission. The one place worth a sentence is the API reference: state that **no backend endpoint was added**, because that is the affirmative proof of `task1.md`'s central constraint and is easy for a reviewer to check.

---

## 14. Deployment Plan

`PROJECT_ASSIGNMENT.md` §"Deployment Considerations" treats deployment as a consideration and §9 requires a deployment guide. No source document requires a live URL. **Recommendation: write the guide (required), deploy only if time remains after the §12.9 gate passes.**

### 14.1 Frontend — Vercel
1. Adapter must match the Phase 2 topology: `@sveltejs/adapter-vercel` if server routes are needed (Option A proxy, or `+layout.server.ts`); `adapter-static` only if the app is purely client-rendered against a cross-origin API (Option B), which reintroduces the §14.3 cookie problem.
2. Set the project root to `frontend/` in the Vercel dashboard.
3. Build `npm run build`; install `npm install`.
4. Set the public API base-URL environment variable for Preview and Production separately.
5. Verify the deployed build locally first with `npm run build && npm run preview`. Adapter misconfiguration is the most common late failure.

### 14.2 Backend — A Host With A Persistent Disk
Render, Railway, or a VPS. **Not a serverless platform.** Three pieces of state are file-backed and would be lost on every cold start: `data/users.db` and `data/scheduler.db`, `logs/email-logs.json`, and `uploads/`. In-memory batch state is lost on restart regardless.
1. Mount a persistent volume covering `data/`, `logs/`, `uploads/`.
2. Set every environment variable — `SESSION_SECRET` above all: without it, `userDatabase.ts` generates a random secret at boot and **every existing session is invalidated on every restart**.
3. Ensure `better-sqlite3` builds for the host's Node version and architecture.
4. Health check → `GET /health`.
5. Long-running process required (the scheduler's `setInterval`).

### 14.3 The Cross-Site Cookie Problem — Read Before Deploying
If the frontend is on `*.vercel.app` and the backend on `*.onrender.com`, they are **different sites**. The `sameSite: "lax"` cookie set by `src/routes/auth.ts` **will not be sent** on those requests. Authentication will work perfectly in local development and fail completely in production.

Three ways out, in order of preference:
1. **Proxy through the SvelteKit server (Option A).** The browser only ever talks to the Vercel origin; the cookie is same-origin. **No backend change.** Recommended.
2. **Put both behind one domain** (e.g. `app.example.com` and `app.example.com/api` via a reverse proxy). No backend change.
3. **Change the cookie to `sameSite: "none", secure: true`** and configure `cors({ origin, credentials: true })`. Works, but edits auth code — declare it explicitly in the README if chosen.

Do not discover this on submission day. Verify the deployed topology end to end, in a real browser, with a real login.

---

## 15. Final Submission Verification

| # | Item | Source | Verified |
| --- | --- | --- | --- |
| 1 | SvelteKit frontend, fully functional | `PROJECT_ASSIGNMENT.md` Deliverable 1 | ☐ |
| 2 | Migrated backend running on Node.js with Hono | Deliverable 2 | ☐ |
| 3 | Updated `README.md` with setup and usage | Deliverable 3 | ☐ |
| 4 | API documentation / endpoint reference | Deliverable 4 | ☐ |
| 5 | Screenshots / demo | Deliverable 5 | ☐ |
| 6 | Backend logic and database structure unchanged | `task1.md` | ☐ |
| 7 | Old `public/` frontend removed | `PROJECT_ASSIGNMENT.md` §4 | ☐ |
| 8 | Clean, maintainable, production-ready code | `task1.md` | ☐ |
| 9 | Proper folder structure and naming | `task1.md` | ☐ |
| 10 | Framework choice justified in writing | `task1.md` | ☐ |
| 11 | Pushed to GitHub | `task1.md` Submission | ☐ |
| 12 | CI green on the pushed branch | `pr-checks.yml` | ☐ |
| 13 | Repository link shared | `task1.md` Submission | ☐ |

**Final sanity pass before sharing the link:** clone the repository into a fresh directory, follow only the README, and get both apps running. If that fails, the submission is not ready — regardless of how well it runs on the development machine.

---

## 16. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Cookie not sent cross-site in production; auth works locally, fails deployed | High | Critical | Decide topology in Phase 2; prefer the proxy (§6.2 A, §14.3) |
| R2 | Default `cors()` sends `*` and no credentials, breaking `credentials: 'include'` | High | Critical | Proxy topology, or explicit `cors({origin, credentials:true})` |
| R3 | `scheduledTime` sent as a local string; campaigns fire hours off with no error | High | Critical | §9.7; explicit test in §11.3 item 2 |
| R4 | Content-Type set manually on `FormData`; server receives no fields | Medium | Critical | Enforced in the single API client (§5.8 rule 3); verified in §11.3 item 7 |
| R5 | `require()` in `dashboard.ts` crashes under Node ESM | Certain | High | Fixed in Phase 1 using the `await import` idiom already present in the codebase |
| R6 | `better-sqlite3` native build fails on the dev machine or host | Medium | High | Verify in Phase 1 and again on the target host early |
| R7 | Reports and scheduled jobs are global, not user-scoped | Certain (existing) | Medium | **Document, do not fix** (§2.6 item 6, §13.10) — fixing violates `task1.md` |
| R8 | Boolean fields sent as `"true"` instead of `"on"`; batch/schedule silently ignored | Medium | High | Single `buildSendFormData()`; live capture audit (§11.3 item 1) |
| R9 | Empty `pass` on config edit wipes the stored password | Medium | High | Omit the key entirely unless changed; explicit test (§11.3 item 5) |
| R10 | 0-based/1-based range confusion sends to the wrong contacts | Medium | High | Port `getSelectedEmailRange` semantics exactly; arithmetic test (§11.3 item 3) |
| R11 | Polling never stops; leaked intervals accumulate | Medium | Medium | Store-owned timers with explicit teardown; idle-network verification |
| R12 | `sample-contacts.xlsx` lost when `public/` is deleted | Medium | Medium | Copy in Phase 3, verify in Phase 11 |
| R13 | `npm ci` fails in CI — no `package-lock.json` | Certain (existing) | Medium | Commit the lockfile in Phase 1 |
| R14 | Preview diverges from delivered email; users trust a lie | Medium | Medium | `lib/utils/placeholders.ts` is a faithful port; fidelity test (§11.3 item 4) |
| R15 | Batch service allows only one job; UI implies otherwise | Low | Medium | Reflect the constraint in the UI; document it |
| R16 | Old frontend deleted before parity is complete | Medium | High | Phase 11 gated on Phases 4–10 and a full §8 walkthrough |
| R17 | Scope creep into unrequested "bonus" features | Medium | Medium | §4.2 and §3.10 exclude them explicitly |
| R18 | Session invalidation on every restart when `SESSION_SECRET` is unset | Medium | Medium | Required variable documented prominently in §13.5 and §14.2 |
| R19 | `npm test` exits 1, showing a failing check on the submitted repo | Certain (existing) | Low | Replace with real tests or a passing no-op (§3.14) |
| R20 | Time runs out mid-migration | Medium | High | Phase ordering leaves a demonstrable app after every phase; §12.9 separates blocking from non-blocking |

---

## 17. Completeness Audit

Performed against the requirements of the planning brief that commissioned this document.

**1. Every source file reviewed.** ✅ All 38 non-`.git` files enumerated and inspected in §1. Large files were read in full or systematically extracted: `public/js/app.js` (all 60+ function definitions and all 24 `fetch` call sites, plus full reads of the send, polling, and range-selection logic), `public/index.html` (structure, navbar, all three tabs, all four modals, all form fields, CDN dependencies), `notificationService.ts` (full public API surface; the ~540-line inline HTML template was identified as such and not transcribed). Binary files were inspected structurally: `sample-contacts.xlsx` header row verified as `Email, FirstName, LastName, Company, Subject`; `bun.lock` identified by role. Git state also inspected.

**2. Every explicit requirement reflected.** ✅ §3 traces requirements from `task1.md`, `PROJECT_ASSIGNMENT.md`, `README.md`, `CONTRIBUTING.md`, `pr-checks.yml`, and the source code across sixteen categories, each with source, instruction, implication, acceptance criterion, risk, and classification.

**3. Inferred requirements labelled.** ✅ Every `[INFERRED]` item states its reasoning — for example, removing unused `multer` (code-quality criterion), performing the Bun removal despite its "optional" tag (three of four signals point that way and CI is broken without it), Node 20 over 18 (dependency and EOL reality), the mobile table strategy (responsive requirement applied to the widest component), and the `.gitignore`/lockfile fix (CI cannot run otherwise).

**4. No unsupported feature introduced.** ✅ §2.5 records all nine categories requested by the commissioning brief that have no basis in the assignment — landing page, footer, in-page anchors, Next.js mandate, Vercel mandate, AI disclosure, bonus form/API, pixel-perfect-cloning guidance, deadline — and marks each `[NOT SUPPORTED]` with its nearest genuine analogue. §4.2 and §3.10 explicitly exclude inventing a bonus feature. The Next.js architecture appears only in §5.9, clearly labelled reference-only.

**5. Plan is step-by-step and implementation-oriented.** ✅ §9 gives fifteen phases, each with numbered actions, dependencies, named failure points, and an exit gate. All fifteen phase types demanded by the commissioning brief are covered: discovery (§1, Phase 0), scope normalisation (§4, Phase 2), architecture and components (§5, Phase 3), routing and section strategy (§5.4), responsive layout (§3.5, §5.5, Phase 12), styling decisions (§5.5), reusable component design (§5.3), content and section composition (§5.2, §8), API integration (§5.8, §7, Phases 5–10), optional form strategy (§3.10 — excluded, with reasoning), accessibility and semantic HTML (§10, Phase 12), testing and validation (§11), README planning (§13, Phase 13), deployment (§14), and final submission verification (§15, Phase 14).

**6. Quality-assurance planning is complete.** ✅ §12 covers every verification area demanded by the commissioning brief: UI quality, layout clarity, and visual hierarchy (§12.1), responsiveness (§12.1), navigation behaviour (§12.1, §12.4), code organisation, component reuse, and maintainability (§12.3), accessibility basics (§12.2), API integration correctness (§12.4), README completeness (§12.7), AI-usage disclosure (§12.7 — verified as *accurate if present*, since no source document requires it), deployment readiness (§12.7, §14), and submission-package completeness (§12.8, §15). The go/no-go gate is §12.9, with fifteen blocking conditions and an explicit non-blocking list.

**7. Documentation planning is complete.** ✅ §13 specifies what the README must *say*, not merely its headings, across every area demanded: setup instructions (§13.5), approach taken (§13.3), architecture overview (§13.4), AI-usage explanation (§13.9), manual improvements separated from assisted work (§13.7 and §13.9), deployment and live-link notes (§13.12), future improvements (§13.11), and bonus form/API explanation (§13.14 — stated plainly as not applicable, with the reason, rather than invented).

**8. Only `detailedplan.md` changed.** ✅ No other file in the repository was created, edited, renamed, or deleted during this planning pass. No application code was written.

**9. Document is detailed, accurate, and directly usable.** ✅ Route names, request field names, response keys, cookie attributes, default values, polling intervals, provider limits, and line references were read from the source files rather than assumed. Where documentation and code disagree, §2.2 and §2.3 record both and name the authority.

**Stated limitations of this plan.**
- The commissioning brief described a different genre of assignment (a marketing landing page) from the one in the folder (a bulk email sender migration). This plan follows the assignment documents, as instructed, and records the mismatch in §2.5 rather than resolving it silently.
- The ~540-line inline HTML notification template in `notificationService.ts` was identified but not transcribed; nothing in the migration depends on its contents, since the frontend never touches it.
- No code was executed. The pre-existing type errors and the `require()` incompatibility in §6.4 are identified by reading, and should be confirmed by running `tsc --noEmit` and starting the server in Phase 1.
- `PROJECT_ASSIGNMENT.md`'s four-week schedule is preserved as context, but §9's ordering is by dependency and risk rather than by calendar, since no actual deadline appears in any source document.
