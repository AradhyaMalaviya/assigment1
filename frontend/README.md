# Bulk Email Sender — SvelteKit Frontend

The Phase 3 frontend scaffold. It is a **separate npm package** from the backend at the
repository root: its own `package.json`, `tsconfig.json`, and dependency graph. Nothing here
imports backend source at runtime.

Phase 3 delivers the foundation only — the primitive layer, the API client, the type mirror,
the proxy route, and the route skeleton. Authentication (Phase 4) and the feature pages
(Phases 5–10) are deliberately left as minimal placeholders.

## Commands

Run from `frontend/`:

| Command           | Tool                              | Purpose                                           |
| ----------------- | --------------------------------- | ------------------------------------------------- |
| `npm run dev`     | `vite dev`                        | Development server (`http://localhost:5173`)      |
| `npm run check`   | `svelte-kit sync && svelte-check` | Type + Svelte diagnostics                         |
| `npm run build`   | `vite build`                      | Production build via `adapter-node` into `build/` |
| `npm run preview` | `vite preview`                    | Serve the production build locally                |
| `npm run lint`    | `eslint .`                        | Lint                                              |
| `npm run format`  | `prettier --write .`              | Format                                            |

The backend must be running separately (`npm start` at the repository root, port 3000) for
any request through the proxy to succeed. The component gallery at `/__gallery` deliberately
needs no backend.

## Environment

Copy `.env.example` to `.env`. Two variables, and the prefix distinction is load-bearing:

| Variable              | Visibility                                  | Value                   |
| --------------------- | ------------------------------------------- | ----------------------- |
| `PUBLIC_API_BASE_URL` | **Browser-visible** (`$env/dynamic/public`) | `/api`                  |
| `BACKEND_ORIGIN`      | **Server-only** (`$env/dynamic/private`)    | `http://localhost:3000` |

`BACKEND_ORIGIN` must never gain a `PUBLIC_` prefix. The browser talks only to the SvelteKit
origin; the hop that crosses origins is server-to-server. See
[ADR 0001](../docs/adr/0001-frontend-backend-topology.md).

## Architecture

### Request topology

Per ADR 0001 (Option A), all API traffic is proxied:

```
browser  ->  GET /api/auth/me  ->  SvelteKit strips "/api"  ->  Hono  GET /auth/me
```

The proxy lives at `src/routes/api/[...path]/+server.ts` and is a **transport layer only** —
it invents no routes and rewrites no payloads. It forwards method, path, query string, body
(including multipart, streamed with `duplex: 'half'`), and cookies; it relays status and
headers back, using `getSetCookie()` so multiple `Set-Cookie` headers survive.

It sets `x-forwarded-proto` from the **actual** browser-facing protocol. On plain-HTTP local
development that stays `http`, which is what keeps `src/routes/auth.ts` from marking the
session cookie `Secure` — a `Secure` cookie on an `http://` origin is silently discarded by
the browser, and authentication then fails with no error anywhere. See ADR 0001 §4.3.

The Phase 4 auth guard belongs in `src/routes/(app)/+layout.server.ts` and must call
`BACKEND_ORIGIN` **directly**, not through this proxy — a server calling its own proxy is a
pointless self-request.

### API client

`src/lib/api/client.ts` is the **only** place `fetch()` is written in `src/`. Feature modules
(`auth.ts`, `config.ts`, `email.ts`, `dashboard.ts`, `reports.ts` — Phases 4–10) call the
wrapper; components call the feature modules. Verify with:

```bash
grep -rn "fetch(" src        # must match only src/lib/api/client.ts
```

The wrapper's obligations (plan §5.8): prefix `PUBLIC_API_BASE_URL`; `credentials: 'include'`
on every request; `Content-Type: application/json` for JSON bodies and **never** for
`FormData`; a typed `ApiError` preserving the backend's HTTP status and `message` verbatim;
central 401 handling that suppresses the redirect for `GET /auth/me`, where 401 means "not
logged in" rather than an error; and `getBlob()` for CSV/JSON report downloads.

**On multipart:** the client explicitly _deletes_ any `Content-Type` when the body is
`FormData`, so the browser generates the boundary itself. Setting that header by hand is the
single most likely way this migration breaks silently — `POST /send` would parse no fields
and report success.

**On error messages:** backend messages are user-facing and actionable (for example the Gmail
app-password guidance in `src/routes/send.ts`). They are surfaced verbatim, never replaced
with a generic "Something went wrong".

### Types

`src/lib/types/api.ts` **mirrors** the backend's `src/types.ts` rather than importing it —
the two packages have separate builds and must not be coupled.

> **This file must be updated in lockstep if the backend types ever change.**

It also carries the response envelopes that `src/types.ts` does not model, taken from the
frozen contract in [`docs/api-contract.md`](../docs/api-contract.md). Some frozen realities
the types encode deliberately:

- `GET /config/smtp/active` **omits** `configId`/`configName` entirely when there is no user
  default — so they are optional properties, not `string | null`.
- `mode === "env"` is not by itself proof that an environment SMTP configuration exists.
- `activeBatchCount` / `scheduledJobCount` are `0 | 1` flags, not arbitrary counts.
- `emailRangeCount = 0` has a special, dangerous meaning on the backend; later UI code must
  never emit zero.

### Components

```
lib/components/ui/        generic primitives — no feature knowledge
lib/components/shared/    application chrome (Navbar, Sidebar, UserMenu, PageHeader, Footer)
lib/components/{config,email,dashboard,reports}/   feature-aware components (Phases 5–10)
```

`ui/` obeys one hard rule: **no imports from `lib/api`, `lib/stores`, or any feature
component directory.** Primitives take data through props and report through
events/callbacks. (`lib/utils` is permitted — it is framework-independent and dependency-free.)

Primitives default their element `id` to a per-instance value from `lib/utils/uid.ts`. A
shared constant default would emit duplicate ids whenever two instances appear on one page,
silently pointing every `label[for]` and `aria-describedby` at the first instance.

`RichTextEditor.svelte` is a deliberate shell around a `<textarea>` exposing a `value`/`change`
contract, so the heavy editor never enters the initial chunk and can be lazy-loaded behind the
same contract in a later phase.

### Stores

`auth`, `toast`, `activity`, `polling` — cross-cutting client state only. Server data belongs
in route `load` functions or component-local state, not in a global store per feature.

## Recorded decisions

### Styling: TailwindCSS v4, not Bootstrap

The legacy UI's main weakness was Bootstrap-shaped clutter, and the migration rule is
**"reproduce every capability, do not reproduce the layout"**. Retaining Bootstrap would have
carried the old information architecture across with it. Tailwind v4 is wired through
`@tailwindcss/vite`, so there is no `tailwind.config.js`; tokens and breakpoints are declared
in `src/app.css`.

`app.css` is the design-token layer: semantic colors (primary `#667eea`, success `#28a745`,
danger `#dc3545`, warning `#ffc107`, info `#17a2b8`), neutral/background/foreground/border,
spacing, radii, and shadows, all as CSS custom properties. Breakpoints are `sm 640`, `md 768`,
`lg 1024`, `xl 1280`, mobile-first. **Components consume the tokens; they do not hard-code
hex values.**

Dark mode is not implemented, and no theme store exists — dead theme infrastructure would be
worse than its absence.

### Adapter: `@sveltejs/adapter-node`

Required by ADR 0001. `adapter-static` is ruled out: it can run neither the `/api` proxy route
nor the Phase 4 `+layout.server.ts` guard.

### TanStack Query: deferred to Phase 8, not rejected

Plan §5.7 recommends `@tanstack/svelte-query` for read-heavy server state and permits skipping
it _if the adaptive-polling contract proves awkward to express_, provided the decision is
documented rather than silently dropped. This is that record.

It is **not** installed in Phase 3, for a scope reason rather than a technical one: Phase 3
adds no data-fetching feature code, so the dependency would sit unused and its configuration
would be guesswork about phases not yet written. The condition the plan attaches to the
decision — how cleanly adaptive polling expresses itself — cannot be evaluated until the
polling contract is actually implemented in Phase 8.

The architecture keeps both doors open: the `polling` store is the intended home for interval
management, and every read path goes through `lib/api/client.ts`, so a query layer can wrap
the feature modules without touching component code. **Phase 8 must resolve this explicitly**
and record the outcome here.

## Phase 3 boundary

Not implemented here, by design: login/register behavior, SMTP CRUD, email sending, Excel
parsing, campaign composition, dashboard polling, scheduled jobs, and report loading. The
route files for those exist as intentionally minimal placeholders.

The legacy frontend in `public/` is **untouched** and remains the parity oracle until
Phase 11. The one asset rescued in Phase 3 is `static/samples/sample-contacts.xlsx`, copied
byte-for-byte from `public/samples/` (header row: `Email, FirstName, LastName, Company,
Subject`).

## Component gallery

`/__gallery` is a development-only surface that renders every Phase 3 primitive in
representative states — button variants including loading and disabled, cards, valid/invalid/
disabled inputs, selects, checkboxes, file inputs with and without a selection, modal and
confirmation dialogs, a sortable responsive table, `Sent`/`Failed`/`Error` badges, progress
bars, alerts, the toast queue, spinners, the empty state, and the editor shell.

It depends on no backend service, no authentication, and no external API. It is the mechanical
proof that the primitives are real compiled components, and it is verified at 375 px, 768 px,
and 1440 px with no horizontal overflow and no console errors.
