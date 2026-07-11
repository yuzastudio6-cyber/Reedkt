# Backend Dependency Boundary

## Current Boundary

ReeditPro currently uses a single root package for the web app, server scaffolding, local/mock smoke scripts, and browser QA. That keeps development simple, but it means npm audit reports server-only dependencies alongside frontend dependencies.

Prompt 15 keeps the single-package layout and adds an explicit frontend boundary check.

## Server-Only Cloud Dependencies

These packages must not be imported by frontend-facing code:

- `@google-cloud/storage`
- `google-auth-library`
- `gaxios`
- `teeny-request`
- `retry-request`

Current source exposure:

- `@google-cloud/storage` is imported only by `server/storage/gcs-storage-adapter.ts`.
- No frontend-facing `src/components`, `src/pages`, `src/hooks`, `src/lib`, `src/types`, `src/App.tsx`, or `src/main.tsx` file imports the server-only packages.
- Current Vite frontend chunks do not include `@google-cloud/storage`, `gaxios`, `teeny-request`, or `retry-request`.

## Enforced Check

Prompt 15 adds:

```bash
npm run check:frontend-boundary
```

The script scans frontend-facing roots for static imports, dynamic imports, and CommonJS `require()` calls that reference server-only packages. It intentionally does not scan:

- `server/**`
- `src/backend/**`
- `docs/**`
- `scripts/**`
- `tests/**`
- `supabase/**`

Those areas are allowed to contain backend planning, server scaffolding, documentation, or test utilities.

## CI Behavior

`.github/workflows/ui-qa.yml` runs the boundary check after `npm ci` and before browser QA. This makes future frontend leaks fail fast without blocking known accepted server-only audit findings.

The workflow also runs npm audit as report-only while the GCS chain is tracked:

```bash
npm run audit:moderate
```

That audit step is intentionally non-blocking until a safe remediation is approved.

Prompt 15 local validation:

- `npm run check:frontend-boundary` passed and scanned 469 frontend-facing files.
- `npm run typecheck:server` passed.
- `npm run build:server` passed.
- `npm run smoke:api` passed in local/mock mode.
- `npm run smoke:upload` passed in local storage mode.

## Current Runtime Risk

- Frontend runtime: low risk; GCS packages are not bundled into frontend chunks.
- Server local/mock mode: low behavior risk; local/mock flows use `LocalStorageAdapter` and do not call GCS APIs.
- Server module graph: bounded risk; `server/storage/storage-adapter.ts` statically imports the GCS adapter, so server builds can include the GCS dependency graph.
- Future production GCS mode: medium risk until the dependency chain is remediated or isolated.

## Boundary Rules

- Frontend components, pages, hooks, and browser-route libraries must not import server/cloud SDKs.
- Frontend code should call frontend-safe API helpers or mocked services, not provider/storage SDKs.
- Server SDKs should stay in `server/**` or explicitly backend-only code.
- Any future real GCS, provider, payment, rendering, or worker execution must remain backend-only and approval-gated.
