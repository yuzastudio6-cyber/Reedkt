# Backend Readiness Gap Report

## Updated Gap Status

| Gap | Status | Notes |
| --- | --- | --- |
| Local E2E video editor demo not testable | Partially fixed | Browser-local project setup, source metadata/upload plans, approval gates, mock credit/job/lease/dispatch events, sidebar toggle, and preview-ready placeholder now work without production services. Real video editing remains production-required. |
| Auth/profile/workspace bootstrap missing | Partially fixed | Frontend-safe bootstrap exists. Backend/admin fallback still needed for RLS-blocked creation. |
| Backend runtime missing | Partially fixed | API route contracts, registry, mock router, and frontend client exist. No deployed Cloud Run/API route/Edge Function runtime exists. |
| Storage/upload runtime missing | Partially fixed | Upload validation, bucket mapping, path planning, mock metadata, source order flows, and local policy readiness exist. Real uploads still need deployed buckets/RLS and likely signed backend routes. |
| Credit runtime missing | Partially fixed | Mock-safe estimates, approval gates, reservations, spend/release/refund skeletons, and generation/render/provider gate checks exist. Real transactional ledger execution remains backend-required. |
| Worker/job queue runtime missing | Partially fixed | Mock queue items, job gates, dependency chains, dispatch placeholders, events, retry/recovery, scenarios, and route handlers exist. Real cloud/backend queue and worker dispatch remain open. |
| Backend runtime transport and worker leasing missing | Partially fixed | Mock runtime envelopes, transport placeholders, lease claim/heartbeat/renew/release/complete/fail/cancel, stale recovery, idempotency helpers, route handlers, and a local lease migration exist. Real backend/cloud lease enforcement remains open. |
| Production backend runtime not chosen or scaffolded | Partially fixed | Cloud Run API service is selected and a mock-only Node HTTP scaffold exists with health/readiness/runtime/routes/mock endpoints. Separate staging-only Cloud Run / Remotion render infrastructure and real-video upload-to-preview canaries passed. Production deployment, Secret Manager hardening, service-role handlers, providers, Stripe, workers, and customer render execution remain open. |
| Editing tool runtime registry missing | Partially fixed | RP-TOOLS-01 adds typed server contracts, safe readiness checks, worker-to-tool mapping, CLI output, and smoke tests for FFmpeg, FFprobe, Remotion, Sharp/libvips, OpenCV, AudioFlux, Signalsmith Stretch, Whisper variants, PySceneDetect, Playwright, and VapourSynth. It does not install optional tools or approve production/customer execution. |
| Provider integrations missing | Partially reduced | Project SFX now reaches mock Mirelo/MMAudio/internal-library routing and includes readiness reporting for future real SFX transport. Real AI, Lyria, Mirelo, MMAudio, Stripe, and rendering calls are still not added. |
| Supabase production validation missing | Open | No remote migration, local Supabase test, staging test, or advisor review was run. |

## Staging Render Infrastructure Canary Result

The staging Cloud Run / Remotion render infrastructure gate passed through the guarded workflow `RP E2E Staging Cloud Run Remotion Render Infrastructure Canary`.

- Run ID: `26321096931`
- Head SHA: `915b110548cac27cdaffdbffb17bdfa54a724a01`
- Smoke run ID: `rp-e2e-smoke-299243de-9589-4f4a-9d02-5d1ca5fd4b35`
- Render status: `preview_ready`
- Cloud Run path: `/canary/render`
- Remotion path: `renderMedia / bundle / selectComposition`
- Output: `video/mp4`, `22,708` bytes, `3s`, `160x90`, `15fps`, `45` frames
- Cleanup: `26` records deleted, cleanup errors `[]`, leftover records `[]`, leftover query errors `[]`

This remains staging-only. It did not run production, Stripe/payment, provider generation, customer media, broad E2E, queue drain, or existing user jobs.

## Staging Real-Video Upload-To-Preview Canary Result

The staging real-video upload-to-preview gate passed through the guarded workflow `RP E2E Staging Real Video Upload To Preview Canary`.

- Run ID: `26348118904`
- Head SHA: `a3dbc6c83dce5dc2b1b3cb83339450ac0b83a574`
- Smoke run ID: `rp-e2e-smoke-a7606dae-f697-40cb-ae0a-644cd32b4bc9`
- Render status: `preview_ready`
- Source video: smoke-tagged GCS artifact created and downloaded by Cloud Run
- Cloud Run path: `/canary/render`
- Remotion path: `renderMedia / bundle / selectComposition`
- Preview output: `video/mp4`, `48,232` bytes, `3s`, `160x90`, `15fps`, `45` frames
- Job transitions: `worker_claimed -> completed`
- Cleanup: `26` Supabase records deleted, `2` GCS objects deleted, cleanup errors `[]`, leftover records `[]`, leftover query errors `[]`

This remains staging-only. It did not run production, Stripe/payment, provider generation, customer media, broad E2E, queue drain, or existing user jobs. OIDC/WIF was used and no service account JSON key path was used.

## RP-TOOLS-01 Runtime Tool Registry Result

The open-source editing tool registry is now code-enforced in `server/tools/*` and connected to safe worker readiness checks.

- Current strict required tools: `ffmpeg`, `ffprobe`, and `remotion`
- Code-enforced/proven staging tools: `ffmpeg`, `ffprobe`, and `remotion`
- Optional/planned tools: Sharp/libvips, OpenCV, AudioFlux, Signalsmith Stretch, Whisper variants, PySceneDetect, Playwright runtime capture, and VapourSynth
- Worker mappings: media analysis, render, audio SoundSync, image asset, browser capture, and advanced frame workers
- Safety: version/import/package checks only; no media processing, providers, Stripe/payment, production deploy, customer media, queue drain, secrets, or service account JSON keys

Remaining blockers: production/customer tool execution, optional tool installation in worker images, license/security review, resource caps, and worker canaries.

Next staging gates, in order: media analysis worker canary, real timeline composition canary, SoundSync analysis canary, then provider sandbox validation. The provider sandbox must stay disabled by default, single-provider/single-job only, smoke-tagged, cleanup-enforced, and separate from Stripe/payment or production flows.

## Local E2E MVP Result

The consolidated E2E branch makes the first demo-safe product loop testable from one URL. The local flow creates browser-local projects, preserves selected source order, generates mock plans and credit estimates, requires approval gates, runs mock reservation/job/lease/dispatch routes, and reaches a preview-ready placeholder.

This does not replace production backend work. Supabase validation, Cloud Run deployment, real storage uploads, approved snapshot persistence, transactional credits, durable queues/leases, provider gateways, rendering/export, Stripe, monitoring, and production QA remain open.

## RP-FIX-06 Result

The auth bootstrap foundation is safe to import in the frontend and safe when Supabase env values are missing. It is not a production backend.

## RP-FIX-07 Result

The storage/upload foundation is safe to import and mock-friendly. It does not upload files automatically, deploy storage policies, or create production delivery URLs.

## RP-FIX-08 Result

The backend API boundary foundation is safe and mock-friendly. It defines route contracts and blocks backend-required routes, but it does not deploy a backend or implement real provider, payment, render, worker, signed storage, or service-role behavior.

## RP-FIX-09 Result

The credit runtime foundation is safe and mock-friendly. It defines the approval/reservation gate before expensive work and can demonstrate allowed/blocked/spend/refund flows locally. It does not implement Stripe, production purchases, transactional backend ledger mutation, provider calls, worker execution, or rendering.

## RP-FIX-10 Result

The job runtime foundation is safe and mock-friendly. It defines queue readiness, dependency chains, worker dispatch placeholders, job events, retry/recovery, chat summaries, and API mock handlers. It does not deploy a backend queue, start Cloud Run workers, call providers, render media, mutate remote Supabase, or use service-role credentials.

## RP-FIX-11 Result

The backend runtime transport and worker lease foundation is safe and mock-friendly. It defines runtime envelopes, mock transport, backend/cloud transport placeholders, mock lease lifecycle, stale lease recovery, idempotency helpers, a worker runtime registry, mock scenarios, mock orchestrators, route handlers, and a local-only migration for future lease tables. It does not deploy Cloud Run, call Pub/Sub, call Supabase Edge Functions, mutate remote Supabase, call providers, render media, integrate Stripe, or use service-role credentials.

## RP-FIX-12 Result

The first backend runtime target is selected and scaffolded. A mock-only Node HTTP server can expose health, readiness, runtime status, route registry, and mock API transport endpoints for a future Cloud Run API service. It does not deploy Cloud Run, configure Secret Manager, run migrations, call providers, call Stripe, run workers, render media, mutate remote Supabase, or use service-role credentials.

## RP-FIX-14 Result

Project SFX integration is partially fixed. The repo now wires SFX Director planning, provider routing, prompt planning, credit estimate/approval/reservation gates, mock generation requests, mock job queue items, the SFX worker skeleton, mock Mirelo/MMAudio/internal-library adapter output, trim/hit alignment, mix planning, QA, project asset decisions, and chat status into one project editing flow.

Real Mirelo/MMAudio execution remains disabled. Provider keys, Secret Manager, Cloud Run worker execution, remote Supabase writes, storage uploads, real audio files, Stripe, and rendering remain future backend work.

## RP-FIX-15 Result

Real SFX provider execution readiness is partially fixed. The repo now has a backend-only readiness service, readiness scenarios, a mock readiness orchestrator, and the `sfx.providerReadiness.check` route. The readiness output explains runtime blocks, provider mode, missing Secret Manager reference names, approval/credit/request/job gaps, source-footage approval requirements, storage/provenance requirements, warnings, and safe next steps.

This is readiness-only. Real Mirelo/MMAudio transport, Secret Manager value resolution, Cloud Run workers, Supabase writes, storage uploads, real audio generation, Stripe, and rendering remain future backend work.
