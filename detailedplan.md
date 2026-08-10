# Detailed Implementation Plan: Bulk Email Sender Frontend Migration

## 1. Purpose Of This Document

This document is the step-by-step implementation plan for the assignment in:

- `C:\Users\deepa\Downloads\NEW Assignment\task1.md`
- `C:\Users\deepa\Downloads\NEW Assignment\assignment\PROJECT_ASSIGNMENT.md`
- `C:\Users\deepa\Downloads\NEW Assignment\assignment\README.md`

Only this planning document has been edited. No implementation code is changed by this document.

The assignment is to migrate the existing frontend to a modern production-ready frontend framework while preserving backend logic and database structure. The project-specific documents recommend SvelteKit, so this plan chooses SvelteKit and uses it consistently.

## 2. Requirement Decisions

1. Framework decision: use SvelteKit with TypeScript.
2. Backend decision: keep Hono backend routes, service behavior, and SQLite schema unchanged.
3. Runtime decision: remove Bun-only runtime dependencies only as needed to satisfy the assignment's Node.js/npm target. This must be treated as a compatibility migration, not a backend rewrite.
4. Frontend decision: replace the old `public/` HTML/CSS/JavaScript UI with a SvelteKit app.
5. API decision: the new frontend must use the actual API routes currently present in the code, not only the example route names from the assignment brief.
6. Database decision: do not rename tables, change columns, or change persistence behavior.
7. Documentation decision: update setup, architecture, API, and verification instructions after migration.

## 3. Current File Audit

The `assignment` folder was inspected recursively. The implementation must account for these files.

### Root Files

1. `.env.example`
   - Current role: environment variable template for server port, session secret, SMTP, and notification SMTP.
   - Implementation action: update after migration to include frontend/backend origin values such as `FRONTEND_ORIGIN` and `VITE_API_BASE_URL`; keep existing SMTP variables.

2. `.gitignore`
   - Current role: ignores dependencies, build outputs, logs, data, uploads, and dotenv files.
   - Implementation action: update for npm/SvelteKit artifacts such as `.svelte-kit`, `frontend/build`, frontend coverage, and package lock files if generated.

3. `bun.lock`
   - Current role: Bun dependency lockfile.
   - Implementation action: remove or replace with npm lockfiles after Node/npm migration. Do not keep Bun as the required package manager.

4. `CONTRIBUTING.md`
   - Current role: contributor guide still references Bun setup.
   - Implementation action: update commands from Bun to npm and explain backend/frontend setup separately.

5. `detailedplan.md`
   - Current role: this planning artifact.
   - Implementation action: preserve as the assignment implementation roadmap.

6. `index.ts`
   - Current role: placeholder file printing `Hello via Bun!`.
   - Implementation action: remove or ignore during migration; the real backend entrypoint is `src/app.ts`.

7. `package.json`
   - Current role: backend package manifest with Bun scripts.
   - Implementation action: convert backend scripts to Node/npm, add Node-compatible dependencies, and add build/dev commands.

8. `PROJECT_ASSIGNMENT.md`
   - Current role: detailed assignment brief describing SvelteKit migration, backend runtime migration, old frontend removal, documentation, features, UI, database schema, testing, and deliverables.
   - Implementation action: treat as the detailed project-specific contract.

9. `README.md`
   - Current role: shorter assignment README that emphasizes SvelteKit frontend, old frontend removal, documentation, and UI/UX.
   - Implementation action: replace with final migrated project README after implementation.

10. `tsconfig.json`
    - Current role: TypeScript config with Bun types and bundler module resolution.
    - Implementation action: update for Node-compatible backend TypeScript and remove Bun-specific type dependency.

### GitHub And Editor Files

11. `.github/CODE_OF_CONDUCT.md`
    - Current role: community policy.
    - Implementation action: no migration changes needed.

12. `.github/labeler.yml`
    - Current role: labels changes by path; currently focuses on `public`, root config, backend, services, routes, middleware, and CI.
    - Implementation action: add labels for `frontend/**/*`, SvelteKit config files, and frontend tests.

13. `.github/PULL_REQUEST_TEMPLATE.md`
    - Current role: PR template.
    - Implementation action: optional update to include frontend/backend verification checkboxes.

14. `.github/workflows/pr-checks.yml`
    - Current role: CI workflow using Node and npm, but current project still has Bun scripts and no package lock.
    - Implementation action: update to install and validate backend and frontend with npm; include frontend check/build.

15. `.vscode/settings.json`
    - Current role: empty settings object.
    - Implementation action: no required change unless formatter or Svelte extension settings are added.

### Old Frontend Files

16. `public/index.html`
    - Current role: old authenticated dashboard shell with Compose, Reports, My Configs, modals, batch status, scheduled jobs, and Quill editor.
    - Implementation action: use as a feature checklist, then remove after SvelteKit parity is complete.

17. `public/login.html`
    - Current role: old login/register page with inline CSS and auth fetch calls.
    - Implementation action: reimplement in SvelteKit auth routes, then remove.

18. `public/css/style.css`
    - Current role: small Bootstrap override stylesheet for the old UI.
    - Implementation action: replace with SvelteKit global CSS/design system, then remove.

19. `public/js/app.js`
    - Current role: main old frontend logic, including auth bootstrapping, SMTP config CRUD, Excel parsing calls, send form submission, range selection, scheduling, adaptive polling, batch controls, reports, and UI helpers.
    - Implementation action: convert behavior into typed Svelte stores, components, and API modules; then remove.

20. `public/samples/sample-contacts.xlsx`
    - Current role: sample spreadsheet download for users.
    - Implementation action: move or copy into SvelteKit `static/samples/sample-contacts.xlsx` before removing `public/`.

### Backend Entrypoints And Types

21. `src/app.ts`
    - Current role: main Hono app setup, CORS/logger middleware, auth protection, static file serving, `/login`, route mounting, health endpoint, `/user/info`, 404/error handlers, directory creation, and Bun export.
    - Implementation action: keep API route mounting and auth behavior; remove old static page serving; migrate runtime startup to Node-compatible Hono server only if doing backend runtime migration.

22. `src/types.ts`
    - Current role: shared backend interfaces for contacts, email logs, email config, email jobs, batch config/status, scheduled jobs, notifications, and provider limits.
    - Implementation action: preserve backend types and mirror them in frontend TypeScript types.

23. `src/middleware/auth.ts`
    - Current role: session-token auth middleware and `requireAuth` helper.
    - Implementation action: preserve behavior; ensure CORS/cookies still work with SvelteKit.

### Backend Routes

24. `src/routes/auth.ts`
    - Current role: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
    - Implementation action: preserve all responses and cookie behavior; frontend auth pages call these endpoints.

25. `src/routes/config.ts`
    - Current role: SMTP config list/create/update/delete/default/active/test endpoints.
    - Implementation action: preserve actual route names: test is `POST /config/smtp/test`; default is `POST /config/smtp/:configId/default`.

26. `src/routes/dashboard.ts`
    - Current role: adaptive polling endpoints `GET /dashboard/poll-status` and `GET /dashboard/data`.
    - Implementation action: preserve and build frontend polling around these exact routes.

27. `src/routes/index.ts`
    - Current role: old static route module serving `public/index.html`, `/public`, `/css`, and `/js`.
    - Implementation action: remove after SvelteKit frontend replaces old static UI.

28. `src/routes/report.ts`
    - Current role: report logs/stats, CSV export, JSON export, and clear logs.
    - Implementation action: preserve routes and build reports UI around them.

29. `src/routes/send.ts`
    - Current role: main send endpoint and supporting endpoints for notifications, provider info, scheduled jobs, parse Excel, and batch controls.
    - Implementation action: preserve exact multipart `FormData` field names and all scheduling/batch behavior.

### Backend Services

30. `src/services/batchService.ts`
    - Current role: in-memory batch job processing, pause/resume/cancel, progress state, completion notifications.
    - Implementation action: preserve service behavior; frontend reads status and controls through route endpoints.

31. `src/services/emailService.ts`
    - Current role: Nodemailer transport, SMTP test, single email send, bulk email send, placeholder replacement through `FileService`, and completion notification support.
    - Implementation action: preserve sending logic and error logging.

32. `src/services/fileService.ts`
    - Current role: Excel parsing, upload saving, HTML template reading, email validation, placeholder replacement.
    - Implementation action: preserve parsing and placeholder behavior; frontend uses `/parse-excel` and sends files to `/send`.

33. `src/services/logService.ts`
    - Current role: in-memory and JSON-file email log storage, stats, CSV/JSON export, clear logs.
    - Implementation action: preserve report behavior.

34. `src/services/middleware`
    - Current role: zero-byte file, likely accidental.
    - Implementation action: remove during cleanup because real middleware lives in `src/middleware/auth.ts`.

35. `src/services/notificationService.ts`
    - Current role: notification email sender, notification HTML template, campaign stats, test notification.
    - Implementation action: preserve behavior; frontend calls `/test-notification`.

36. `src/services/providerLimits.ts`
    - Current role: provider detection for Gmail, Outlook/Hotmail, Yahoo, and custom SMTP.
    - Implementation action: preserve limit logic; optionally expose provider guidance in frontend using `/provider-info`.

37. `src/services/schedulerService.ts`
    - Current role: scheduled job SQLite database, scheduler interval, due job execution, cancellation, history, user scheduled jobs.
    - Implementation action: preserve schema and scheduling behavior; if migrating runtime, replace only `bun:sqlite` with Node-compatible SQLite.

38. `src/services/userDatabase.ts`
    - Current role: user database, sessions, signed tokens, SMTP config storage, indexes, expired-session cleanup.
    - Implementation action: preserve schema and authentication behavior; if migrating runtime, replace only `bun:sqlite` with Node-compatible SQLite.

## 4. Actual Backend API Contract To Use

The new frontend must use these actual endpoints found in the current code:

### Authentication

1. `POST /auth/register`
   - Body: JSON with `email`, `name`, `password`.
   - Expected behavior: creates user, creates session, sets `session_token` cookie.

2. `POST /auth/login`
   - Body: JSON with `email`, `password`.
   - Expected behavior: authenticates user, creates session, sets `session_token` cookie.

3. `POST /auth/logout`
   - Expected behavior: deletes current session and cookie.

4. `GET /auth/me`
   - Expected behavior: returns current authenticated user or 401.

5. `GET /user/info`
   - Expected behavior: returns current user profile for the old dashboard. The new frontend can use either this or `/auth/me`, but should standardize on `/auth/me` unless `/user/info` is needed for compatibility.

### SMTP Configuration

1. `GET /config/smtp`
   - Returns active config metadata, `userConfigs`, and user info.

2. `POST /config/smtp`
   - Body: JSON with `name`, `host`, `port`, `secure`, `user`, `pass`, `fromEmail`, `fromName`, `isDefault`.

3. `PUT /config/smtp/:configId`
   - Body: partial JSON update. Leave `pass` absent when the password should remain unchanged.

4. `DELETE /config/smtp/:configId`
   - Deletes a config belonging to the current user.

5. `POST /config/smtp/:configId/default`
   - Sets a config as default. This differs from the example endpoint in `PROJECT_ASSIGNMENT.md`; use the actual route.

6. `GET /config/smtp/active`
   - Returns the active/default sending config.

7. `POST /config/smtp/test`
   - Body: JSON SMTP connection test payload. This differs from the example endpoint in `PROJECT_ASSIGNMENT.md`; use the actual route.

### Sending And Uploads

1. `POST /parse-excel`
   - Multipart field: `excelFile`.
   - Returns first 5 contacts and total count.

2. `POST /provider-info`
   - Multipart fields: `smtpHost`, `hasNotification`.
   - Returns detected provider and recommended limits.

3. `POST /send`
   - Multipart fields:
     - `configId`
     - `subject`
     - `htmlContent`
     - `delay`
     - `useBatch`
     - `batchSize`
     - `batchDelay`
     - `emailDelay`
     - `scheduleEmail`
     - `scheduledTime`
     - `notifyEmail`
     - `notifyBrowser`
     - `emailRangeStart`
     - `emailRangeCount`
     - `excelFile`
     - `htmlTemplate`
   - Important rule: scheduled datetime must be sent as UTC ISO.

4. `POST /test-notification`
   - Body: JSON with `testEmail`.

### Batch And Scheduled Jobs

1. `GET /batch-status`
2. `POST /batch-pause`
3. `POST /batch-resume`
4. `DELETE /batch-cancel`
5. `GET /scheduled-jobs`
6. `DELETE /scheduled-jobs/:id`

### Dashboard And Reports

1. `GET /dashboard/poll-status`
2. `GET /dashboard/data`
3. `GET /report`
4. `GET /report/export/csv`
5. `GET /report/export/json`
6. `DELETE /report/clear`
7. `GET /health`

## 5. Feature Parity Checklist From Old Frontend

The SvelteKit frontend must preserve these behaviors from `public/index.html`, `public/login.html`, and `public/js/app.js`.

### Auth UI

1. Login form with email and password.
2. Register form with name, email, and password.
3. Password minimum length validation.
4. Redirect authenticated users away from auth pages.
5. Redirect unauthenticated users to login.
6. Display current user name and email.
7. Logout action.

### SMTP Config UI

1. List all user SMTP configs.
2. Select active config for sending.
3. Create new config.
4. View config details with password masked.
5. Edit config.
6. Delete config with confirmation.
7. Set config as default.
8. Test connection before saving.
9. Gmail app-password guidance.
10. Provider-specific password handling and validation.

### Compose UI

1. Required Excel contact upload.
2. Sample contact spreadsheet download.
3. Contact parsing preview using `/parse-excel`.
4. Contact count display.
5. Email range selection:
   - all contacts
   - first N contacts
   - specific row range
6. Optional HTML template upload.
7. Editor content becomes optional when an HTML template is selected.
8. Delay between individual emails.
9. Subject input with placeholders.
10. Rich HTML content editor.
11. Preview modal using uploaded contact data when available.
12. Submit exact multipart form expected by backend.

### Sending Modes

1. Immediate send.
2. Batch send.
3. Scheduled send.
4. Batch size setting.
5. Batch delay setting.
6. Email delay setting.
7. Batch preview.
8. Schedule date/time input.
9. Convert local schedule time to UTC ISO before submit.
10. Notification email.
11. Browser notification permission and optional notification.
12. Test notification button.

### Dashboard And Monitoring

1. Active jobs dashboard.
2. Active batch job section.
3. Upcoming scheduled jobs section.
4. Recent activity timeline.
5. Adaptive polling through `/dashboard/poll-status`.
6. Dashboard data through `/dashboard/data`.
7. Fast polling only while jobs are active.
8. Batch progress bar.
9. Batch sent/failed counts.
10. Current batch and total batch count.
11. Next-batch countdown.
12. Pause batch.
13. Resume batch.
14. Cancel batch.
15. Scheduled job list.
16. Cancel scheduled job.

### Reports

1. Total, sent, failed, and error stat cards.
2. Email logs table.
3. Status display.
4. Contact name/company display.
5. Subject display.
6. Timestamp display.
7. Message ID display.
8. Error message display.
9. Export CSV.
10. Export JSON.
11. Refresh reports.
12. Clear logs with confirmation.
13. Add sorting, filtering, search, and date-range filtering as required by `PROJECT_ASSIGNMENT.md`.

## 6. Recommended Target Architecture

### Backend

Keep backend at project root:

```text
assignment/
  src/
    app.ts
    types.ts
    middleware/
    routes/
    services/
  data/
  uploads/
  logs/
  package.json
  tsconfig.json
```

Backend responsibilities:

1. Authentication and sessions.
2. SMTP config persistence.
3. Excel parsing.
4. Email sending.
5. Batch processing.
6. Scheduled jobs.
7. Notifications.
8. Report logs and exports.

### Frontend

Create SvelteKit in:

```text
assignment/frontend/
  src/
    routes/
    lib/
      api/
      components/
      stores/
      types/
      utils/
  static/
    samples/sample-contacts.xlsx
```

Frontend route plan:

1. `/login`
   - Login page.

2. `/register`
   - Register page.

3. `/`
   - Redirect to `/dashboard` after auth.

4. `/dashboard`
   - Stats, active jobs, scheduled preview, timeline.

5. `/send`
   - Compose, upload, preview, batch settings, schedule settings, send action.

6. `/configs`
   - SMTP configuration management.

7. `/reports`
   - Logs, stats, exports, filters.

8. `/scheduled`
   - Dedicated scheduled jobs list and details.

Recommended frontend modules:

1. `src/lib/api/client.ts`
   - Base fetch wrapper with `credentials: "include"`.

2. `src/lib/api/auth.ts`
   - Login, register, logout, current user.

3. `src/lib/api/config.ts`
   - SMTP config CRUD and test.

4. `src/lib/api/email.ts`
   - Parse Excel, send, provider info, notifications, batch controls.

5. `src/lib/api/dashboard.ts`
   - Poll status and dashboard data.

6. `src/lib/api/reports.ts`
   - Logs, exports, clear logs.

7. `src/lib/types/index.ts`
   - Shared frontend types matching backend response shapes.

8. `src/lib/stores/auth.ts`
   - Current user/session state.

9. `src/lib/stores/toast.ts`
   - Toast notifications.

10. `src/lib/stores/activity.ts`
    - Recent activity timeline backed by local storage.

## 7. Step-By-Step Implementation Procedure

### Phase 1: Baseline And Safety

1. Confirm the working tree is clean.
2. Create a new migration branch.
3. Keep this `detailedplan.md` committed or preserved as the implementation guide.
4. Do not edit backend behavior until the old frontend behavior has been mapped to SvelteKit tasks.
5. Save the old frontend files as reference until parity is complete.

### Phase 2: Backend Compatibility Preparation

1. Update `package.json` scripts from Bun commands to npm/Node commands.
2. Add Node-compatible runtime packages:
   - `@hono/node-server`
   - `better-sqlite3`
   - `tsx`
   - `@types/better-sqlite3`
3. Replace `bun:sqlite` in `userDatabase.ts` and `schedulerService.ts` with `better-sqlite3`.
4. Replace `hono/bun` static serving in `src/app.ts`.
5. Keep all API routes mounted at the same paths.
6. Configure CORS for the SvelteKit dev server origin and credentials.
7. Verify `GET /health` works.
8. Verify auth endpoints still set and read `session_token`.

### Phase 3: SvelteKit Project Setup

1. Initialize `assignment/frontend` with SvelteKit and TypeScript.
2. Configure package scripts:
   - `dev`
   - `check`
   - `build`
   - `preview`
3. Add styling system and shared global CSS.
4. Add SvelteKit static asset location for `sample-contacts.xlsx`.
5. Add `.env.example` guidance for frontend API base URL.
6. Add strict TypeScript settings.
7. Add shared API client and typed API modules.

### Phase 4: Auth Implementation

1. Build login page.
2. Build register page.
3. Add client validation:
   - valid email
   - required name
   - password length at least 6
4. Add loading and error states.
5. Add protected layout that checks `/auth/me`.
6. Add user menu with name and email.
7. Add logout action.
8. Acceptance test:
   - unauthenticated user cannot access app routes
   - new user can register
   - existing user can login
   - logout clears session

### Phase 5: SMTP Configuration Implementation

1. Build `/configs`.
2. Fetch configs from `GET /config/smtp`.
3. Render config list ordered by backend response.
4. Mark default config.
5. Add create form.
6. Add edit form.
7. Add view details modal.
8. Mask password in UI.
9. Add delete confirmation.
10. Add set default action using `POST /config/smtp/:configId/default`.
11. Add test connection action using `POST /config/smtp/test`.
12. Preserve Gmail app-password warning.
13. Acceptance test:
    - create config
    - test config
    - edit config without changing password
    - set default
    - delete config

### Phase 6: Compose And Upload Implementation

1. Build `/send`.
2. Add selected SMTP config dropdown.
3. Require a selected config before sending.
4. Add Excel upload.
5. Send Excel to `/parse-excel` immediately after selection.
6. Display total contacts.
7. Display preview contacts.
8. Add range controls:
   - all
   - first N
   - specific row range
9. Clamp invalid range values to valid contact bounds.
10. Preserve backend field names `emailRangeStart` and `emailRangeCount`.
11. Add subject input.
12. Add rich HTML editor.
13. Add optional HTML template upload.
14. Make editor optional only when template is selected.
15. Add email preview modal with placeholder replacement.
16. Use real first parsed contact for preview when available.
17. Acceptance test:
    - upload sample spreadsheet
    - see contact count
    - choose first N
    - choose range
    - preview placeholder replacement

### Phase 7: Sending Modes Implementation

1. Build immediate send submission using `/send`.
2. Build batch mode toggle.
3. Add batch size, batch delay, and email delay inputs.
4. Add batch preview calculation.
5. Build scheduled mode toggle.
6. Add schedule date/time input.
7. Set minimum schedule time in the future.
8. Convert local datetime input to UTC ISO before appending `scheduledTime`.
9. Add notification email input.
10. Add browser notification checkbox and permission request.
11. Add test notification action.
12. Show success modal for each result mode:
    - immediate started
    - batch started
    - scheduled created
13. Acceptance test:
    - submit validation catches missing config, subject, Excel, and content
    - scheduled submit sends UTC ISO
    - backend receives exact expected multipart fields

### Phase 8: Dashboard And Monitoring Implementation

1. Build `/dashboard`.
2. Call `/dashboard/poll-status` on load.
3. Poll only when backend says polling is needed.
4. Use polling interval returned by backend.
5. Call `/dashboard/data` only when jobs exist.
6. Render active batch status.
7. Render scheduled jobs preview.
8. Render recent activity timeline.
9. Store recent activity in local storage.
10. Add batch status component using `/batch-status`.
11. Add pause/resume/cancel actions.
12. Add next-batch countdown.
13. Stop polling when no jobs are active.
14. Acceptance test:
    - no constant polling when idle
    - polling starts after batch/scheduled job creation
    - pause/resume/cancel buttons call correct routes

### Phase 9: Scheduled Jobs Page

1. Build `/scheduled`.
2. Fetch `GET /scheduled-jobs`.
3. Show job subject, contact count, schedule time, status, notification email, and batch mode.
4. Disable cancellation for running jobs.
5. Call `DELETE /scheduled-jobs/:id` for scheduled jobs.
6. Acceptance test:
    - scheduled jobs list loads
    - cancel scheduled job works
    - UI updates after cancellation

### Phase 10: Reports Implementation

1. Build `/reports`.
2. Fetch `GET /report`.
3. Render stat cards:
   - total
   - sent
   - failed
   - errors
4. Render logs table:
   - email
   - status
   - first name
   - company
   - subject
   - timestamp
   - message ID
   - error message
5. Add client-side search.
6. Add status filter.
7. Add date range filter.
8. Add sorting by timestamp, email, status, and subject.
9. Add CSV export using `/report/export/csv`.
10. Add JSON export using `/report/export/json`.
11. Add clear logs confirmation using `DELETE /report/clear`.
12. Acceptance test:
    - stats match backend
    - table filters work
    - CSV downloads
    - JSON downloads
    - clear logs refreshes table

### Phase 11: Old Frontend Removal

Only after feature parity is complete:

1. Move sample spreadsheet into `frontend/static/samples/`.
2. Remove old HTML files.
3. Remove old CSS file.
4. Remove old JS file.
5. Remove old static route module `src/routes/index.ts`.
6. Remove old static serving references from `src/app.ts`.
7. Ensure backend 404 returns JSON for API routes.
8. Ensure SvelteKit handles frontend routing.

### Phase 12: Documentation

1. Rewrite `README.md` with:
   - project overview
   - target architecture
   - backend setup
   - frontend setup
   - environment variables
   - API reference
   - feature list
   - screenshots/demo placeholders
   - test instructions
   - submission instructions
2. Update `CONTRIBUTING.md` npm commands.
3. Update `.env.example`.
4. Update CI workflow instructions.
5. Update `.github/labeler.yml`.

### Phase 13: Final Verification

1. Install backend dependencies.
2. Build backend.
3. Start backend.
4. Verify `/health`.
5. Install frontend dependencies.
6. Run frontend type/check command.
7. Build frontend.
8. Start frontend.
9. Test login/register/logout.
10. Test SMTP config CRUD.
11. Test sample Excel upload.
12. Test preview.
13. Test send validation.
14. Test batch controls.
15. Test scheduled job creation and cancellation.
16. Test reports and exports.
17. Test mobile/tablet/desktop responsive layouts.
18. Confirm old `public/` frontend is not used.
19. Confirm no backend schema changes were made.
20. Confirm repository is ready for GitHub submission.

## 8. UI And UX Requirements For Implementation

1. Use a clean operational dashboard layout, not a marketing landing page.
2. Provide navigation with active states.
3. Keep forms compact and scannable.
4. Add loading states for every API action.
5. Add success/error toasts.
6. Use confirmation modals for destructive actions.
7. Use progress bars for batch jobs.
8. Use status badges for jobs and logs.
9. Make all pages responsive on mobile, tablet, and desktop.
10. Use ARIA labels for icon-only buttons.
11. Ensure keyboard navigation works for forms, modals, and tables.
12. Avoid relying on color alone for status.
13. Do not let text overflow buttons, cards, tables, or sidebars.

## 9. Data And Schema Rules

1. Preserve `users`.
2. Preserve `user_sessions`.
3. Preserve `user_smtp_configs`.
4. Preserve `scheduled_jobs`.
5. Preserve JSON log file behavior.
6. Preserve upload directory behavior.
7. Preserve session cookie name `session_token`.
8. Preserve password hashing through Argon2.
9. Preserve signed session token behavior.
10. Preserve placeholder names:
    - `{{Email}}`
    - `{{FirstName}}`
    - `{{LastName}}`
    - `{{Company}}`
    - `{{Subject}}`
    - any custom Excel column name.

## 10. Known Risk Areas

1. The assignment examples mention some endpoint names that differ from the actual code. Use actual code endpoints.
2. Bun is referenced in current scripts and SQLite imports; Node migration must not alter business logic.
3. `dashboard.ts` uses dynamic `require`, which may need Node/ESM-safe handling during runtime migration.
4. The old frontend sends UTC schedule time; the new frontend must preserve this.
5. The old frontend sends exact multipart field names; changing those names will break `/send`.
6. Saved SMTP passwords are returned in backend config data; the frontend must avoid displaying them plainly.
7. Batch state is in memory, so it will not survive backend restarts.
8. Scheduled jobs are persisted in SQLite and checked every minute.
9. Logs are stored in `logs/email-logs.json`, not in SQLite.
10. Browser notifications require user permission and may be blocked by browser settings.

## 11. Completion Definition

The assignment is complete when all of these are true:

1. The migrated frontend is a SvelteKit app.
2. The app supports authentication, SMTP configs, compose/send, batch jobs, scheduled jobs, dashboard monitoring, reports, exports, and documentation.
3. The backend API behavior remains compatible.
4. The database structure remains unchanged.
5. The old `public/` frontend is removed.
6. The sample spreadsheet remains available for download.
7. README setup instructions are accurate.
8. The project can be pushed to GitHub and submitted as a repository link.

