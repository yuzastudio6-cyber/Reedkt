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
- Project-level SoundSync SFX workflow wiring in mock mode, including SFX Director planning, provider routes, prompt plans, credit gates, mock generation requests, mock jobs, mock worker runs, mock provider adapter output, trim/hit alignment, mix, QA, project asset decisions, and editor chat status.
- SFX provider execution readiness reporting for future Mirelo SFX V1.5 and MMAudio V2 backend transport, including structured block reasons, Secret Manager reference checks, approval/credit/job checks, and safe next steps.

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
- Project SFX integration scenarios and chat panel showing Mirelo SFX V1.5, MMAudio V2, internal library, and no-SFX routes.
- SFX provider readiness scenarios covering mock mode, disabled mode, frontend real-mode blocking, missing Secret Manager references, no-SFX routes, missing approval artifacts, and future transport readiness.

## Not Implemented

- Deployed backend runtime or live API transport.
- Deployed Cloud Run service, Secret Manager bindings, service account IAM, request auth, monitoring, and rate limits.
- Service-role backend handlers.
- Full auth screens.
- Real storage uploads and deployed bucket policy validation.
- Production transactional credit ledger runtime.
- Production worker queue, leases, heartbeat enforcement, and cloud dispatch.
- Deployed backend runtime transport, transactional worker leases, durable idempotency, and cloud lease recovery.
- Real provider integrations. Mirelo/MMAudio are wired into the project flow in mock mode and have readiness reporting only; live provider transport remains future backend work.
- Rendering/export workers.
- Remote Supabase migration or validation.

## RP-RESERVATION-01 Mock Reservation Status

- Real: local in-memory mock wallet available credits can move to reserved credits after an approved estimate.
- Real: local in-memory mock credit reservation and reservation line-item records can be created idempotently.
- Mock-only: reservation holds `maximumEstimatedCredits` / `requiredHoldCredits`, not `totalEstimatedCredits`, and is validated by `smoke:credit-reservation`.
- Not implemented: live billing, Stripe/payment, Supabase writes, production wallet mutation, production ledger writes, provider calls, settlement, reservation spend/release/refund, render/export, export unlock, and checkout/top-up.

## RP-RUNTIME-GUARD-01 Mock Runtime Guard Status

- Real: mock paid worker/provider/render starts can be blocked by approved-plan, approved-estimate, active `reserved` reservation, idempotency, tool-readiness, and projected-overage checks.
- Real: projected overage creates one idempotent local/mock `CreditRevisionActionRecord` with `projected_overage`.
- Mock-only: no provider, render/export, settlement, spend/release/refund, ledger, production persistence, Stripe/payment, checkout/top-up, or live billing side effect is wired.

## RP-CREDITREVISION-01 Mock Revision Action Status

- Real: local/mock projected-overage actions can be resolved as approved, lower-cost selected, or cancelled.
- Real: Approve & Continue can add a local mock `revised_credit_additional_hold` to the existing reservation, and a later runtime guard call can pass when the revised hold covers the projection.
- Mock-only: no live billing, Stripe/payment, provider call, render/export, settlement, spend/release/refund, checkout/top-up, export unlock, Supabase write, production wallet mutation, or ledger write is wired.

## RP-SETTLEMENT-01 Mock Settlement Status

- Real: local/mock completed edits can settle against reserved credits, release unused hold, and mark the mock reservation `spent`.
- Real: final charge uses billable tool-cost events plus the separate ReEditPro service/edit fee; non-billable costs are shown as absorbed internal cost.
- Mock-only: absorbed overage and approved-but-unfunded top-up states are recorded without live billing, Stripe/payment, provider call, render/export, checkout/top-up, export unlock, Supabase write, production wallet mutation, or ledger write.

## RP-EXPORTLOCK-01 Mock Export Gate Status

- Real: local/mock export readiness can be evaluated from settlement state.
- Real: `requires_top_up_before_export` creates an idempotent mock export lock with "Action required: add credits to export".
- Mock-only: `settled_with_absorbed_overage` allows export readiness, and no live billing, Stripe/payment, checkout/top-up, provider call, render/export execution, export unlock, Supabase write, production wallet mutation, production persistence, or ledger write is wired.

## RP-CREDITPURCHASE-01 Mock Credit Top-Up Status

- Real: local/mock fixed credit packs, top-up intents, purchased grants, and top-up suggestions exist.
- Real: completing a mock top-up increases local in-memory wallet available credits only.
- Mock-only: no live billing, Stripe/payment, real checkout, provider call, render/export execution, export unlock, Supabase write, production wallet mutation, production persistence, ledger write, or automatic retry behavior is wired.
