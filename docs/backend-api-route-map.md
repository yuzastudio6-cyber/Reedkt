# Backend API Route Map

RP-FIX-08 defines route metadata for the major ReeditPro backend domains. The registry is a contract and mock-router map, not a deployed HTTP server.

## Route Groups

| Domain | Purpose | Mock status | Future backend status | Security notes |
| --- | --- | --- | --- | --- |
| Auth | Bootstrap status, current user, profile/workspace ensure | Status/current-user ready through frontend-safe helpers | Backend fallback may be needed for RLS-blocked writes | Public or authenticated; no service-role in browser |
| Projects | List/get/create/update projects, create chat session | Demo project creation through chat-native mock flow | Real writes require workspace checks and backend persistence | Workspace member/editor |
| Media | Upload plans, upload validation, source sequence, mock asset records | Ready | Real database writes require backend/RLS validation | Workspace member |
| Planning | Intent, source sequence map, edit plan, quality, signatures, approval | Planning mock flow ready | Approval requires immutable snapshot and backend persistence | Workspace member/editor |
| Credits | Estimate, approve, gate check, reserve, release, refund | Estimate and mock gate checks ready | Ledger mutations are backend-only | Reserve/refund require backend service role |
| Jobs | Job batches, queue, gates, dependencies, dispatch, status, events, retry, cancel, runtime envelopes, worker leases | Mock queue/gate/dependency/dispatch/status/retry/lease ready | Worker queues and leases require backend runtime | Backend service role for writes |
| Generation | Requests, worker jobs, status, credit gate check, runtime transport mock | Mock gate checks ready; execution metadata only | Provider execution requires backend provider gateway | Provider-secret required |
| Render | Timing manifest, preview, readiness, status, credit gate check, mock render lease | Timing/readiness, mock gate checks, and generic render lease placeholder ready | Real render/export is worker/backend-only | Backend required for execution |
| Music | Director plan, cue sheet, prompt plan, QA, mix, credit gate check | Mock planning/QA/mix and mock gate checks ready | Real generation is provider/backend-only | No provider calls in mock runtime |
| SFX | Project SFX workflow, Director, prompt, timing/trim, mix, QA, library candidate, credit gate check | Project-level mock SFX flow plus planning/QA/library and mock gate checks ready | Real SFX generation is provider/backend-only | No provider calls in mock runtime |
| StoryTiming | Master timing, caption/cut, music/SFX, signatures, QA, render manifest | Mock timing flows ready | Real media timing analysis remains worker-only | Workspace member |
| Storage | Status, upload plan, validation, paths, signed URLs, delete | Status/planning/path ready | Signed uploads/downloads and deletes need backend review | Service-role for privileged operations |
| Providers | AI planning, music, SFX, AI video | Disabled | Future backend provider gateway | Provider-secret required |
| Admin | Audit, moderation, privileged asset delete | Disabled | Future admin backend | Backend service role |
| Stripe | Checkout, webhook, subscription | Disabled | Future payment backend | Payment-secret required |

## Important Route IDs

- `auth.bootstrap.status`
- `auth.bootstrap.currentUser`
- `projects.demo.create`
- `media.uploadPlan.create`
- `media.upload.validate`
- `media.sourceSequence.create`
- `planning.demo.chatNative.create`
- `credits.estimate.create`
- `credits.gate.check`
- `credits.reserve`
- `credits.release`
- `credits.refund`
- `jobs.queue`
- `jobs.gate.check`
- `jobs.dependencies.create`
- `jobs.dispatch.mock`
- `jobs.retry.schedule`
- `runtime.envelope.create`
- `runtime.transport.mockSend`
- `worker.lease.claim`
- `worker.lease.heartbeat`
- `worker.lease.renew`
- `worker.lease.release`
- `worker.lease.complete`
- `worker.lease.fail`
- `worker.lease.recoverStale`
- `worker.runtime.registry`
- `storage.objectPath.create`
- `generation.request.create`
- `generation.creditGate.check`
- `render.preview.create`
- `render.creditGate.check`
- `music.creditGate.check`
- `sfx.project.plan`
- `sfx.project.providerRoutes`
- `sfx.project.prompts`
- `sfx.project.creditEstimate`
- `sfx.project.queueMockGeneration`
- `sfx.project.runMockWorker`
- `sfx.project.status`
- `sfx.providerReadiness.check`
- `sfx.creditGate.check`
- `providers.openai.planningRequest`
- `stripe.webhook.handle`

Backend-required and disabled routes are intentionally blocked by `handleMockApiRequest`.

## RP-FIX-09 Credit Runtime Routes

RP-FIX-09 wires safe mock handlers for credit gate checks while preserving backend-required status for real ledger mutations. The mock router can demonstrate allowed/blocked gates for generation, render, music, and SFX, but real reserve, spend, release, refund, provider execution, render execution, and worker queue mutation still require backend runtime.

## RP-FIX-10 Job Runtime Routes

RP-FIX-10 adds mock-ready job runtime routes for queue readiness, gate checks, dependency chains, mock dispatch, status, events, retry, and cancel. Real batch creation, service-role job mutation, Cloud Run dispatch, provider calls, rendering, and worker leases remain backend-required.

## RP-FIX-11 Runtime Transport And Worker Lease Routes

RP-FIX-11 adds mock-ready route metadata and handlers for runtime envelope creation, mock transport send, worker lease claim/heartbeat/renew/release/complete/fail, stale recovery, and worker runtime registry inspection. Real transport, real lease mutation, Cloud Run, Pub/Sub, Supabase Edge Functions, provider execution, render execution, and service-role worker state changes remain backend-required.

## RP-FIX-12 Server Route Surface

RP-FIX-12 adds a mock-only Node server scaffold for future Cloud Run deployment. Server routes are `/health`, `/ready`, `/api/runtime/status`, `/api/routes`, and `/api/mock`. `/api/mock` forwards existing API request envelopes into the mock router and continues blocking backend-required/provider/payment/service-role routes.

## RP-FIX-14 Project SFX Workflow Routes

RP-FIX-14 adds mock-ready project SFX route metadata and handlers for SFX project planning, provider routes, prompt plans, credit estimates, mock generation queueing, mock worker execution, and project SFX status. These routes connect the existing SoundSync SFX Director, provider router, prompt adapters, credit gates, mock worker, provider adapter, trim/alignment, mix, QA, and library-decision layers into the editor project flow.

This is still mock-only. Real Mirelo SFX V1.5 and MMAudio V2 calls, provider keys, storage uploads, Cloud Run worker execution, Supabase persistence, Stripe, and rendering remain backend-required.

## RP-FIX-15 SFX Provider Readiness Route

RP-FIX-15 adds `sfx.providerReadiness.check`, a mock-ready readiness route for future real Mirelo SFX V1.5 and MMAudio V2 execution. The route returns provider mode, runtime mode, block reasons, required backend capabilities, warnings, and a safe next step.

This route is readiness-only. It does not import provider SDKs, make HTTP calls, read raw keys, upload audio, deploy workers, write Supabase rows, spend credits, or render media.
