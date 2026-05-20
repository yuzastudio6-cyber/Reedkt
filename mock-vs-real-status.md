# Mock Vs Real Status

## Real / Implemented

- Frontend-safe Supabase public env detection.
- Lazy browser anon client creation.
- Supabase Auth session/user helpers.
- Auth/profile/workspace bootstrap services that use RLS-limited frontend operations.
- React hook for auth bootstrap state.
- Storage bucket constants using active bucket names.
- Upload validation, path planning, and upload plan helpers.
- Frontend-safe Supabase Storage helper functions that run only when explicitly called.
- Backend API route contracts, route registry, mock router, and frontend API client defaulting to mock mode.
- Credit runtime types, approval gate checks, mock reservations, and mock ledger spend/release/refund skeletons.
- Job runtime types, mock queue items, job gates, dependency chains, dispatch placeholders, events, retry/recovery, and chat summaries.
- Backend runtime and worker lease types, mock runtime envelopes, mock transport, mock lease lifecycle, stale recovery, idempotency helpers, and worker runtime registry metadata.
- Mock-only Node HTTP backend scaffold for future Cloud Run deployment with health, readiness, runtime status, route registry, and mock API transport endpoints.

## Mock / Placeholder

- Mock auth bootstrap flow for local/demo contexts.
- Backend-required warnings for RLS-blocked profile/workspace/member creation.
- Optional auth status card is standalone and not wired into app routes.
- Mock upload scenarios and upload orchestrator.
- Mock media/reference/generated/audio/thumbnail storage metadata records.
- Source upload order flow preserving uploaded order as planning context.
- Backend-required API route placeholders for service-role writes, providers, payment, workers, rendering, admin, and signed storage.
- Mock credit runtime scenarios and orchestrator for allowed/blocked/spend/refund/demo flows.
- Mock job runtime scenarios and orchestrator for queue, gate, dependency, dispatch, retry, recovery, and status-summary flows.
- Mock backend runtime and worker lease scenarios/orchestrators for envelope transport, lease claim, heartbeat, renew, release, complete, fail, stale recovery, idempotency conflict, and blocked real transport.
- Cloud Run API service plan, local runtime docs, deployment checklist, and backend Dockerfile scaffold.

## Not Implemented

- Deployed backend runtime or live API transport.
- Deployed Cloud Run service, Secret Manager bindings, service account IAM, request auth, monitoring, and rate limits.
- Service-role backend handlers.
- Full auth screens.
- Real storage uploads and deployed bucket policy validation.
- Production transactional credit ledger runtime.
- Production worker queue, leases, heartbeat enforcement, and cloud dispatch.
- Deployed backend runtime transport, transactional worker leases, durable idempotency, and cloud lease recovery.
- Provider integrations.
- Rendering/export workers.
- Remote Supabase migration or validation.
