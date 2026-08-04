# Backend Package Split Plan

## Purpose

Prompt 15 does not split packages. It documents the future path for isolating backend/server dependencies so frontend UI audit, bundle, and CI results are not coupled to server-only cloud SDK chains.

## Option A: Single Package With Import Boundaries

Current short-term approach.

Pros:

- Minimal churn.
- Existing scripts and lockfile stay intact.
- Browser QA and server smoke scripts keep working from one install.
- `npm run check:frontend-boundary` prevents cloud SDK leaks into frontend-facing code.

Cons:

- Root `npm audit` reports server-only dependencies.
- Frontend and backend dependencies share one lockfile.
- Server build can include GCS dependency graph even when local/mock storage mode is used.

Use this option until backend deployment packaging is ready for a larger change.

## Option B: npm Workspaces Split

Recommended future production structure:

- root package: frontend app, shared development tooling, Playwright UI QA
- `server/package.json`: backend/server/runtime dependencies
- optional shared package later for pure types/contracts that are safe for both frontend and backend

Expected CI jobs:

- `frontend-ui-qa`
  - install frontend/root deps
  - `npm run check:frontend-boundary`
  - lint, typecheck, build
  - Playwright E2E
  - frontend audit
- `server-api-qa`
  - install server deps
  - server typecheck/build
  - local/mock server smoke tests
  - server audit

Pros:

- Frontend audit no longer reports backend-only GCS findings.
- Backend audit can be managed with server-specific risk and deployment context.
- Server dependency upgrades can be validated independently.
- Clearer deployment boundary for future workers and Cloud Run.

Cons:

- Requires script, tsconfig, import path, and CI updates.
- Requires careful shared type boundary design.
- Existing smoke scripts need migration.

## Option C: Optional Backend Dependency Install

Alternative:

- Keep one package but make backend/cloud SDKs optional or installed only in backend deployment environments.

This is not the preferred path unless the deployment model specifically requires it. Optional installs can make local behavior harder to reason about and may hide missing backend dependencies until runtime.

## Migration Steps

1. Inventory backend-only dependencies, starting with `@google-cloud/storage`, Supabase service-role-only usage, provider SDKs, render/worker tools, and payment SDKs.
2. Create `server/package.json` with backend runtime dependencies and server-only scripts.
3. Move `@google-cloud/storage` and related server-only dependencies into the server package.
4. Add server tsconfig/build scripts scoped to server code.
5. Define a shared types/contracts boundary if frontend and server need common schemas.
6. Update Dockerfiles, worker scripts, and deployment commands.
7. Update GitHub Actions into separate frontend and server jobs.
8. Verify frontend build no longer installs or audits server-only dependencies.
9. Verify server build, local/mock smoke tests, and safe GCS-disabled startup behavior.
10. Re-run Playwright E2E and server smoke validation.
11. Update dependency audit docs and production-readiness docs.

## Acceptance Criteria For Future Split

- Frontend package has no direct cloud/provider/payment SDK dependencies.
- Frontend Vite build contains no server-only cloud packages.
- Server package owns GCS/provider/worker dependencies.
- Root/frontend audit and server audit can be reviewed separately.
- Mock/local UI QA remains fast and does not require cloud credentials.
- Real GCS mode remains disabled unless explicit backend env is configured.
