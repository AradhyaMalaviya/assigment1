# Frozen API Contract

- **Status:** Frozen as of Phase 2 (2026-08-11), per `detailedplan.md` §9 Phase 2 step 4
- **Authority:** the backend route handlers under `src/routes/` and `src/app.ts`. Where `PROJECT_ASSIGNMENT.md` disagrees, **the code wins** (`detailedplan.md` §2.2).
- **Verification:** every route below was enumerated from source and every response shape in §2–§6 was captured from the running backend on 2026-08-11. Deltas against `detailedplan.md` §7 are listed in §8.

**What "frozen" means.** Phases 3–10 build against this document. No endpoint is
added, renamed, or reshaped — `task1.md` forbids it, and "no backend endpoint was
added" is affirmative evidence for the reviewer. If implementation uncovers a
discrepancy, record it in §8 here and in `detailedplan.md` §2.2 rather than
working around it silently.

**Base path.** Per [ADR 0001](adr/0001-frontend-backend-topology.md), the browser
calls everything under `/api`, which the SvelteKit server strips before
forwarding. `POST /api/send` in the frontend is `POST /send` in the table below.

---

## 1. Authentication And Session

`src/routes/auth.ts`, `src/app.ts`

| Method | Path | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | JSON `{email, name, password}` | `{success, message, user:{id,email,name}}` + `Set-Cookie` | 400 if any field missing, password < 6, or email fails `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; 409 if the email exists |
| POST | `/auth/login` | JSON `{email, password}` | `{success, message, user:{id,email,name}}` + `Set-Cookie` | 400 if either field missing; 401 on bad credentials |
| POST | `/auth/logout` | — | `{success, message}`; clears the cookie | Succeeds even with no session |
| GET | `/auth/me` | — | `{success, user:{id,email,name}}` | 401 when unauthenticated — **the expected answer, not an error** |
| GET | `/user/info` | — | identical shape to `/auth/me` | Legacy duplicate. **Standardise on `/auth/me`**; note the duplication in the README |
| GET | `/health` | — | `{status:"OK", timestamp, version}` | **Requires a session — see §8.1.** Not a public smoke-test endpoint |

**Cookie.** Name `session_token`; `httpOnly`; `sameSite=Lax`; `maxAge` 86400;
`path=/`. `secure` is auto-detected from `x-forwarded-proto: https` or an
`https://` request URL (`src/routes/auth.ts:52`) — see ADR 0001 §4.3 item 1 for
the proxy's obligation here. Sessions expire after 24 h; expired rows are swept
at startup and hourly.

**Auth gate.** `src/app.ts:41` treats `/auth/`, `/login`, `/register`,
`/public/`, `/css/`, `/js/`, `/favicon.ico` as public; everything else runs
`authMiddleware`, which accepts either `Authorization: Bearer <token>` or the
`session_token` cookie (`src/middleware/auth.ts:29-31`) and returns
`401 {success:false, message}` otherwise.

## 2. SMTP Configuration

`src/routes/config.ts`

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| GET | `/config/smtp` | — | `{success, data, hasConfig, hasEnvConfig, currentMode, envConfig, userConfigs[], userId, userName}` |
| POST | `/config/smtp` | JSON `{name, host, port, secure, user, pass, fromEmail, fromName, isDefault}` | `{success, data, message, configId}`; 400 if `host`/`user`/`pass`/`fromEmail` missing |
| PUT | `/config/smtp/:configId` | Partial JSON, same keys | `{success, message}`; 404 if not found or nothing changed |
| DELETE | `/config/smtp/:configId` | — | `{success, message}`; 404 if not found |
| POST | `/config/smtp/:configId/default` | — | `{success, message}` |
| GET | `/config/smtp/active` | — | `{success, data, mode}` **plus `configId` and `configName` only when a user default exists** — see §8.2 |
| POST | `/config/smtp/test` | JSON `{host, port, secure, user, pass}` | `{success, message}` |

**Five behaviours the UI must respect.**

1. **`data` carries the plaintext SMTP password; `userConfigs[]` does not.**
   `config.ts:36-44` builds the active config including `pass`; `config.ts:56-67`
   maps `userConfigs` without it. Never bind `data.pass` into the DOM; mask it in
   `ConfigDetails.svelte`. Record in Known Limitations; do not change the backend.
2. **Omitting `pass` from a PUT leaves the stored password intact.**
   `config.ts:152-156` strips `undefined` keys. Send `pass` **only** when the user
   typed a new one — an empty string would overwrite the password with `""`.
3. **Ordering is fixed by SQL** (`ORDER BY is_default DESC, created_at DESC`,
   `userDatabase.ts:397`). Render in the order received; do not re-sort.
4. **`currentMode` and `mode` are not a "has a config" signal.** Both are
   `defaultConfig ? "user" : "env"`, so they read `"env"` even when no env config
   exists. Verified live: with no user config and no `SMTP_HOST`, the response is
   `{"currentMode":"env","hasConfig":false,"hasEnvConfig":false,"data":null,"envConfig":null}`.
   **Branch on `hasConfig` / `hasEnvConfig`, never on the mode string.**
5. **`data` and `envConfig` are nullable.** Both are `null` when nothing is
   configured.

## 3. Sending And Uploads

`src/routes/send.ts`

### 3.1 `POST /parse-excel`
Multipart, single field **`excelFile`**. Returns
`{success, contacts: Contact[] /* first 5 */, totalCount}`. Call on file
selection so the contact count appears before composing.

### 3.2 `POST /provider-info`
Multipart fields **`smtpHost`**, **`hasNotification`** (the literal strings
`"true"` / `"false"`). Returns
`{success, data:{provider, dailyLimit, maxContacts, recommendedBatchSize, recommendedDelay}}`.
Use it to warn about limits *before* `POST /send` rejects the job.

### 3.3 `POST /send` — the sixteen field names are a hard contract

Multipart. Verified line by line against `send.ts:48-104` and `:254-255`.

| Field | Type | Notes |
| --- | --- | --- |
| `configId` | string | Falls back to the user's default config when unknown; 400 if there is no default either |
| `subject` | string | Required; rejected when empty or whitespace |
| `htmlContent` | string | Required **unless** `htmlTemplate` is uploaded. Rejected if empty or exactly `"<p><br></p>"` (`send.ts:154`) — the Quill empty-document sentinel |
| `delay` | string→int | Seconds between emails in non-batch mode; default 20 |
| `useBatch` | `"on"` \| anything else | **String comparison against `"on"`** (`send.ts:92`) |
| `batchSize` | string→int | Default 20 |
| `batchDelay` | string→int | **Minutes** between batches; default 60 |
| `emailDelay` | string→int | **Seconds** between emails in batch mode; default 45 |
| `scheduleEmail` | `"on"` \| else | String comparison (`send.ts:98`) |
| `scheduledTime` | string | **Must be UTC ISO** (`new Date().toISOString()`). Required when `scheduleEmail` is `"on"` |
| `notifyEmail` | string | Optional; its presence reduces the provider contact allowance by one |
| `notifyBrowser` | `"on"` \| else | String comparison (`send.ts:101`) |
| `emailRangeStart` | string→int | **0-based** index (`send.ts:254`) |
| `emailRangeCount` | string→int | A count, not an end index (`send.ts:255`) |
| `excelFile` | File | Required; rejected when size is 0 |
| `htmlTemplate` | File | Optional; when present it **overrides `htmlContent` entirely** |

**The `|| default` trap.** Every numeric field is parsed as
`parseInt(...) || <default>`, so a literal `0` falls through to the default. Most
dangerously, `emailRangeCount=0` becomes `allContacts.length` — **sending to
everyone instead of nobody**. The range selector must never emit `0`; suppress
the field or block the submit.

**Server-side sequence:** resolve config → validate required fields → **test the
SMTP connection** → save and parse the Excel → apply the range slice → enforce
the provider cap → optionally read the HTML template → branch. The connection
test makes this endpoint slow; show a loading state that survives several
seconds.

**Three success shapes, discriminated by flags:**

| Mode | Response |
| --- | --- |
| Scheduled | `{success, message, jobId, scheduledTime, contactCount, scheduledMode: true, batchMode, configUsed}` |
| Batch | `{success, message, contactCount, jobId, batchMode: true, batchConfig, configUsed}` |
| Immediate | `{success, message, contactCount, configUsed}` — **no `jobId`** |

`configUsed` is the config's **name**, not its id.

### 3.4 `POST /test-notification`
JSON `{testEmail}` → `{success, message}`; 400 when `testEmail` is missing.

## 4. Batch And Scheduled Jobs

`src/routes/send.ts`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/batch-status` | `{success, data:{isRunning, currentJob, totalJobs, completedJobs}}` |
| POST | `/batch-pause` | Returns success even with no running job |
| POST | `/batch-resume` | Only resumes a job in `Paused` status |
| DELETE | `/batch-cancel` | **Method is DELETE.** Sets status `Failed` and clears the job |
| GET | `/scheduled-jobs` | `{success, data: ScheduledJob[]}`; only `status IN ('scheduled','running')`, for **all users** |
| DELETE | `/scheduled-jobs/:id` | 404 unless the job is still `scheduled` → **disable Cancel for `running` jobs in the UI** |

`currentJob`, when present, supplies `id`, `totalContacts`, `currentBatch`,
`totalBatches`, `emailsSent`, `emailsFailed`, `status`, `startTime`,
`nextBatchTime`, `config` — everything the batch monitor needs.

**Single-slot constraint.** `batchService` holds one job in memory.
`startBatchJob` throws if one is already running, and `currentJob` is cleared
30 s after completion. The UI must reflect both: block a second batch, and
expect job details to disappear shortly after they finish.

## 5. Dashboard

`src/routes/dashboard.ts`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/dashboard/poll-status` | `{success, data:{pollNeeded, pollInterval, hasActiveBatch, hasScheduledJobs, hasRunningScheduledJobs, activeBatchCount, scheduledJobCount, lastUpdated, cached}}` |
| GET | `/dashboard/data` | `{success, data:{batch, scheduledJobs, timestamp}}` |

**`pollInterval` ladder** (`dashboard.ts:78-87`): active batch → 3000 ms;
running scheduled job → 10000 ms; pending scheduled job → 30000 ms; otherwise
`pollNeeded: false` at 30000 ms. Drive the polling loop from this value rather
than hard-coding intervals.

**A quiet dashboard is not proof that nothing is running.** On an internal
error the handler still returns **HTTP 200 with `success: true` and
`pollNeeded: false`**, adding an `error: "Service unavailable"` key
(`dashboard.ts:105-118`). Check for that key before trusting a negative answer.

**`activeBatchCount` and `scheduledJobCount` are 0/1 flags, not counts** —
`hasActiveBatch ? 1 : 0` and `hasScheduledJobs ? 1 : 0` (`dashboard.ts:97-98`,
where the source comment says "Simplified count"). Never render them as
quantities.

**`/dashboard/data` is gated on a 5-second cache.** It returns `batch: null`
unless `dashboardState.hasBatchJobs` was set by a prior `/dashboard/poll-status`
call, and `scheduledJobs: []` unless `hasScheduledJobs` was set. **Call
`poll-status` before `data`, never `data` alone** — otherwise the dashboard is
permanently empty. `scheduledJobs` is capped at 5.

## 6. Reports

`src/routes/report.ts`

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/report` | `{success, data:{logs: EmailLog[], stats:{total,sent,failed,errors}}}` |
| GET | `/report/export/csv` | `text/csv`, `Content-Disposition: attachment; filename="email-logs.csv"`; fixed nine columns |
| GET | `/report/export/json` | `application/json` attachment |
| DELETE | `/report/clear` | `{success, message}`; irreversible → confirmation modal required |

`EmailLog.status` is one of `"Sent" | "Failed" | "Error"`. These routes are
**not user-scoped** (`report.ts` never calls `requireAuth`), so every
authenticated user sees every user's logs — documented, not fixed (§9).

## 7. Endpoints In `PROJECT_ASSIGNMENT.md` That Do Not Exist

Carried forward from `detailedplan.md` §2.2 and re-verified against the route
enumeration. **Build against §1–§6 above, never against the brief's examples.**

| `PROJECT_ASSIGNMENT.md` says | Reality |
| --- | --- |
| `POST /config/smtp/:id/test` | `POST /config/smtp/test` — no `:id`; full config in the JSON body |
| `POST /config/smtp/:id/set-default` | `POST /config/smtp/:configId/default` |
| `POST /send/preview` | **Does not exist.** Preview is client-side only |
| `GET /send/status` | `GET /batch-status` |
| `POST /send/pause` / `POST /send/resume` | `POST /batch-pause` / `POST /batch-resume` |
| `POST /send/cancel` | `DELETE /batch-cancel` — **the method is DELETE** |
| `GET /dashboard/stats` | **Does not exist.** Stats come from `GET /report` |
| `GET /dashboard/scheduled-jobs`, `GET /schedule/jobs` | `GET /scheduled-jobs` |
| `DELETE /schedule/jobs/:id` | `DELETE /scheduled-jobs/:id` |
| `GET /schedule/jobs/:id`, `GET /schedule/status` | **Do not exist** |
| (undocumented in the brief) | `GET /user/info`, `POST /parse-excel`, `POST /provider-info`, `POST /test-notification`, `GET /config/smtp/active`, `GET /health` all exist |

## 8. Deltas Found During The Phase 2 Freeze

New findings from verifying `detailedplan.md` §7 against the running backend.

### 8.1 `GET /health` requires authentication
§7.1 lists `/health` without qualification and §14.2 recommends it as the
deployment health check. It is **not public**: `/health` is absent from the
`publicPaths` array in `src/app.ts:41-49` and from the skip list in
`src/middleware/auth.ts:15-22`, so `authMiddleware` runs and returns
`401 {"success":false,"message":"Authentication required"}`.

Measured: `GET /health` without a cookie → **401**; with a valid session →
**200** `{"status":"OK","timestamp":…,"version":"2.0.0-with-auth"}`.

**Consequences.** A platform health check pointed at `/health` will fail
permanently and the host will restart the service in a loop. Options, in order
of preference: point the health check at a TCP port check instead; or accept a
401 as "process is alive" where the platform allows a custom expected status.
**Do not add `/health` to `publicPaths`** — that is a backend logic change.
Document it in the README's Known Limitations and correct §14.2's advice.

### 8.2 `GET /config/smtp/active` omits `configId` and `configName`
§7.2 documents the response as `{success, data, mode, configId, configName}`.
The handler builds them as `defaultConfig?.id` and `defaultConfig?.name`
(`config.ts:283-284`), and `JSON.stringify` **drops undefined values**, so with
no user default the response is exactly `{"success":true,"data":null,"mode":"env"}`.

**Type them optional, not nullable:** `configId?: string; configName?: string`.
A frontend type of `configId: string | null` would compile and then fail at
runtime against `!== null` checks.

### 8.3 Everything else in §7 verified accurate
All 28 routes match the code exactly. The response shapes for `/auth/me`,
`/user/info`, `/config/smtp`, `/config/smtp/active`, `/report`, `/batch-status`,
`/scheduled-jobs`, `/dashboard/poll-status`, and `/dashboard/data` were captured
live and match §7 key-for-key. All sixteen `POST /send` field names match
`send.ts` exactly.

## 9. Known Backend Defects — Documented, Not Fixed

`task1.md` forbids changing backend logic, so these are carried into the README
rather than repaired:

- `GET /report`, `GET /scheduled-jobs`, and all four batch-control endpoints are
  **not user-scoped** — all authenticated users share the same global data.
- `GET /config/smtp` returns the active configuration's **plaintext SMTP
  password** in `data`.
- The batch service holds **one job in memory**; state is lost on restart.
- Email logs live in `logs/email-logs.json`, not SQLite, and are global.
- The scheduler polls once a minute, so jobs can fire **up to 60 s late**.
- `getUserScheduledJobs()` and `getJobHistory()` exist in the service but have
  no routes.
- `GET /health` requires authentication (§8.1).
