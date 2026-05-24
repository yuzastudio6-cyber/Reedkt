# Mock Vs Real Status

## Real / Implemented

- Browser-local E2E MVP loop: local project setup, local file metadata capture, upload-plan creation, source order review, mock plan/credit approval, mock runtime events, and preview-ready placeholder.
- Focused AI editor shell as the canonical `/editor` UI, with sidebar visible by default, compact project header, source sequence chat card, compact composer, and a persistent hide/show toolbar toggle.
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
- Staging-only Cloud Run / Remotion render infrastructure canary passed through the guarded GitHub Actions workflow. It rendered only the fixed tiny smoke fixture and cleaned up all smoke records/artifacts.
- Staging-only real-video upload-to-preview canary passed through the guarded GitHub Actions workflow. It created one tiny generated source video in GCS, downloaded it in Cloud Run, rendered a preview through Remotion, recorded render/job/QA metadata, and cleaned up all smoke records/artifacts.
- Project-level SoundSync SFX workflow wiring in mock mode, including SFX Director planning, provider routes, prompt plans, credit gates, mock generation requests, mock jobs, mock worker runs, mock provider adapter output, trim/hit alignment, mix, QA, project asset decisions, and editor chat status.
- SFX provider execution readiness reporting for future Mirelo SFX V1.5 and MMAudio V2 backend transport, including structured block reasons, Secret Manager reference checks, approval/credit/job checks, and safe next steps.

## Mock / Placeholder

- Local preview/export readiness is a placeholder status, not a rendered video file.
- Local MVP project state is stored in browser `localStorage`; it is not durable backend persistence.
- The focused editor still runs mock-only planning/runtime underneath; visible plan/credit/job/preview cards are local placeholders until production backend and render workers exist.
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

- Production/customer end-to-end video rendering/export from uploaded media. A staging-only smoke upload-to-preview gate passed with a generated tiny test video, but customer media and production export remain unimplemented.
- Durable approved plan snapshot persistence for the local MVP flow.
- Deployed backend runtime or live API transport.
- Production/general deployed Cloud Run service, Secret Manager bindings, service account IAM, request auth, monitoring, and rate limits. The only passed deployed Cloud Run path is the staging render canary.
- Service-role backend handlers.
- Full auth screens.
- Real storage uploads and deployed bucket policy validation.
- Production transactional credit ledger runtime.
- Production worker queue, leases, heartbeat enforcement, and cloud dispatch.
- Deployed backend runtime transport, transactional worker leases, durable idempotency, and cloud lease recovery.
- Real provider integrations. Mirelo/MMAudio are wired into the project flow in mock mode and have readiness reporting only; live provider transport remains future backend work. The next safe gate is a disabled-by-default staging provider sandbox limited to one provider and one smoke-tagged job.
- Production rendering/export workers for customer media. The staging render infrastructure and real-video upload-to-preview canary paths are passed, but production preview/export remains unimplemented.
- Remote Supabase migration or validation.
