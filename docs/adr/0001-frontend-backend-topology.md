# ADR 0001 — Frontend/Backend Request Topology

- **Status:** Accepted
- **Date:** 2026-08-11
- **Phase:** 2 (Topology Decision And Contract Freeze), per `detailedplan.md` §9
- **Decides:** `detailedplan.md` §6.2 — the choice between Option A (SvelteKit server proxy) and Option B (direct cross-origin with CORS)
- **Supersedes:** nothing
- **Constrains:** the SvelteKit adapter choice, the auth-guard style (§5.4), the API client base URL (§5.8), and the deployment shape (§14)

---

## 1. Context

The migration splits one origin into two processes: the Hono API (`:3000`) and a
SvelteKit app (`:5173` in development, a separate host in production). The
browser must carry an authenticated session across that split. Two properties of
the existing backend — neither of which we are permitted to change freely —
determine what is possible.

**The CORS wildcard.** `src/app.ts:33` calls `cors()` with no options. Hono's
default emits `Access-Control-Allow-Origin: *` and no
`Access-Control-Allow-Credentials`. A browser rejects any response to a
`credentials: 'include'` request when the allow-origin is a wildcard.

**The cookie's SameSite policy.** `src/routes/auth.ts:56` and `:127` set
`session_token` with `sameSite: "Lax"`. Lax cookies travel on *same-site*
requests. `localhost:5173 → localhost:3000` is same-site (ports are not part of
a site), so development is forgiving. `myapp.vercel.app → myapi.onrender.com` is
*cross-site*, so the cookie is not sent at all. This is the failure mode that
works perfectly on a developer's machine and fails completely in production.

`task1.md` forbids modifying backend logic. `PROJECT_ASSIGNMENT.md`
§"Common Issues" anticipates both symptoms. The decision therefore has to be
made before any route exists, because it is expensive to reverse afterwards.

## 2. Decision

**Adopt Option A: proxy all API traffic through the SvelteKit server.**

The browser talks only to the SvelteKit origin. A catch-all SvelteKit server
route forwards `/api/*` to the Hono backend, passing the `Cookie` header up and
relaying `Set-Cookie` back down. CORS never applies, because the hop that
crosses origins is server-to-server. The session cookie is always same-origin
from the browser's point of view.

**The proxy prefix is `/api`, and the prefix is stripped before forwarding.**

```
browser                     SvelteKit server              Hono backend
GET /api/auth/me      ->    strip "/api"            ->    GET /auth/me
POST /api/send        ->                            ->    POST /send
GET /api/config/smtp  ->                            ->    GET /config/smtp
```

`/api` collides with no backend route (the backend serves `/auth/*`,
`/config/*`, `/send`, `/report*`, `/dashboard/*`, `/scheduled-jobs*`,
`/batch-*`, `/parse-excel`, `/provider-info`, `/test-notification`,
`/user/info`, `/health`) and with no planned frontend route (`/login`,
`/register`, `/dashboard`, `/send`, `/configs`, `/scheduled`, `/reports`). The
backend's own `notFound` handler already treats `/api/` as an API prefix
(`src/app.ts:147`), so the name is consistent with the code that exists.

## 3. Rationale

1. **It requires zero backend changes.** This is the decisive argument.
   `task1.md`'s central constraint is "do not modify backend logic". Option A
   satisfies the constraint by construction rather than by careful editing:
   `src/app.ts` and `src/routes/auth.ts` are untouched, and the root
   `.env.example` needs no `FRONTEND_ORIGIN` key.
2. **It removes the production cookie failure entirely**, rather than deferring
   it to deployment day. There is no cross-site request to have a SameSite
   policy about.
3. **It makes development and production identical.** Under Option B the two
   environments differ in the one respect most likely to break (same-site
   versus cross-site), so development cannot validate production.
4. **It pairs with the auth guard the brief suggested.**
   `PROJECT_ASSIGNMENT.md`'s folder tree shows `+layout.server.ts`. That is only
   correct when the SvelteKit server runs and can reach the backend — which is
   exactly the Option A topology (§5.4 made this conditional; the condition is
   now met).

The cost is accepted: the frontend needs a Node-capable adapter, so
`adapter-static` is off the table, and every API call takes one extra hop.

## 4. Evidence

Both options were measured against the running backend before the decision was
recorded, using throwaway servers on ports other than `:3000` and a real browser
(headless Chrome, full cookie semantics). The spike code was deliberately not
kept.

### 4.1 Option A — proxied, 8/8 passed

Page served on `http://localhost:5173`, backend on `http://localhost:3000`,
every request made with `credentials: 'include'`:

| Check | Result |
| --- | --- |
| Unauthenticated `/api/auth/me` | 401, as expected |
| `POST /api/auth/register` through the proxy | 200, account created |
| Session cookie stayed `httpOnly` (`document.cookie` empty) | pass |
| **Authenticated `/api/auth/me` on the cookie alone** | **200, correct user** |
| `GET /api/config/smtp` (a protected route behind `authMiddleware`) | 200 |
| `POST /api/parse-excel` multipart upload | 200, 7 contacts parsed |
| `POST /api/auth/logout` | 200 |
| `/api/auth/me` after logout | 401 |

The `Set-Cookie` header relayed to the browser on `:5173` was byte-for-byte the
backend's own:

```
set-cookie: session_token=…; Max-Age=86400; Path=/; HttpOnly; SameSite=Lax
```

`Path=/` needs no rewriting — the browser sends the cookie to every path on the
SvelteKit origin, `/api/*` included.

### 4.2 Option B — direct cross-origin, blocked by the browser

A page on `http://localhost:5174` calling `http://localhost:3000/auth/me`
directly with `credentials: 'include'`, against the backend exactly as shipped:

```
FAIL direct credentialed cross-origin request reached the app
     — blocked by the browser: Failed to fetch
```

The response headers show why:

```
HTTP/1.1 401 Unauthorized
access-control-allow-origin: *          <- wildcard, and no
                                           access-control-allow-credentials
```

Option B is therefore not merely riskier — it does not work at all without
editing `src/app.ts:33`, and would additionally require editing the cookie in
`src/routes/auth.ts` for any cross-site production deployment.

### 4.3 Findings the spike produced that the proxy implementation must honour

These are requirements on the Phase 3 proxy route, each learned from the spike
rather than assumed:

1. **Never set `x-forwarded-proto: https` on a plain-http dev origin.**
   `src/routes/auth.ts:52` derives the cookie's `Secure` flag from that header.
   Setting it while the browser is on `http://localhost` produces a `Secure`
   cookie that the browser silently discards — authentication would fail with no
   error anywhere. Conversely, in an HTTPS production deployment the header
   *must* be set, or the cookie will lack `Secure`.
2. **Strip `content-encoding`, `content-length`, and `transfer-encoding` from
   the upstream response.** `fetch` has already decoded the body; copying those
   headers hands the browser a response that contradicts its own payload.
3. **Use `getSetCookie()`, not `get('set-cookie')`.** Multiple `Set-Cookie`
   headers collapse into one comma-joined string otherwise, and the browser
   discards the result.
4. **Forward with `redirect: 'manual'`.** The backend's `notFound` handler still
   redirects non-API paths to `/login` (`src/app.ts:156-161`); silently
   following that would turn a 404 into a confusing 200.
5. **Never set `Content-Type` on a forwarded body.** The multipart boundary must
   survive untouched. The spike's `POST /api/parse-excel` covers this, and the
   same path carries the sixteen-field `POST /send` contract (§7.3) — the single
   most likely way this migration breaks silently.

## 5. Consequences

### 5.1 Locked in by this decision

| Area | Consequence |
| --- | --- |
| **Adapter** | `@sveltejs/adapter-node` for local and self-hosted runs; `@sveltejs/adapter-vercel` if deployed to Vercel. **`adapter-static` is ruled out** — it cannot run the proxy route. |
| **Auth guard** (§5.4) | Use `+layout.server.ts`, not `+layout.ts`. The condition §5.4 attached to that choice is satisfied. The guard calls the backend **directly** via `BACKEND_ORIGIN`, not through its own `/api` proxy, to avoid a pointless self-request. |
| **API base URL** (§5.8) | `PUBLIC_API_BASE_URL=/api` — a relative path, so the client never needs to know the backend's host. |
| **Backend origin** | `BACKEND_ORIGIN` is a **server-only** variable (`$env/dynamic/private`). It must **not** carry the `PUBLIC_` prefix; the browser has no business knowing it. |
| **Backend changes** | None. No CORS configuration, no cookie change, no `FRONTEND_ORIGIN` in the root `.env.example`. |
| **Proxy location** | `frontend/src/routes/api/[...path]/+server.ts`, exporting `GET`, `POST`, `PUT`, `DELETE` (Phase 3). |
| **Deployment** (§14) | The frontend must run as a server, not as static files. §14.3's cross-site cookie problem does not arise. The backend still needs a persistent disk (§14.2) — unchanged by this decision. |

### 5.2 Accepted costs

- One extra network hop per API call. Negligible against `POST /send`, which
  verifies an SMTP connection before responding.
- The frontend can no longer be deployed to a pure static host.
- File uploads pass through the SvelteKit server, so its request body limit must
  accommodate the Excel and HTML template uploads.

### 5.3 Revisit triggers

Reopen this ADR only if one of these becomes true:

- The frontend must be deployed to a static-only host.
- Both apps end up behind a single domain via an external reverse proxy, at
  which point the SvelteKit proxy becomes redundant (though harmless).
- The backend constraint from `task1.md` is lifted, making
  `cors({ origin, credentials: true })` plus `sameSite: "none"` permissible.

## 6. Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| **Option B — direct cross-origin CORS** | Measured as broken against the backend as shipped (§4.2). Fixing it requires editing `src/app.ts:33`, and a cross-site production deployment additionally requires changing the cookie to `sameSite: "none", secure: true` in `src/routes/auth.ts`. That is a change to authentication code, which sits directly against `task1.md`. |
| **Bearer tokens via the `Authorization` header** | `src/middleware/auth.ts:29-31` does accept `Authorization: Bearer …`, so this would work and would sidestep cookies entirely. Rejected because it means storing the session token in JavaScript-reachable storage, discarding the `httpOnly` protection the backend deliberately provides — a security regression traded for a problem Option A solves outright. Retained only as a documented escape hatch. |
| **Both apps behind one external reverse proxy** | Also requires no backend change and is a legitimate production shape, but it needs infrastructure that does not exist in development, so it cannot be validated locally. Option A achieves the same same-origin property with nothing but application code. |
| **Vite's `server.proxy` in development** | Solves development only. Production would fall back to Option B, reintroducing exactly the failure that works locally and breaks when deployed. |
