# RP-E2E-READY-01 Baseline Readiness Audit

Date: 2026-05-21

## Purpose

RP-E2E-READY-01 is a documentation-only readiness milestone. It confirms the current mock/local state of ReeditPro before any real end-to-end editing runtime work begins.

This audit does not add provider calls, secrets, Stripe, Cloud Run deployment, Supabase execution, worker execution, rendering, media processing, or production routes.

## Sources Reviewed

- `README.md`
- `docs/backend-api-skeleton.md`
- `worker-tool-runtime-architecture.md`
- `launch-tool-stack-update.md`
- `supabase/migration-order.md`
- `docs/google-cloud/RP-GCP-04-before-real-integration-checklist.md`

## Baseline Validation

`node_modules` was already present, so `npm install` was not needed.

Validation results:

- `npm.cmd ls --depth=0`: passed.
- `npm.cmd run build`: passed. Vite reported the existing large chunk warning only.
- `npm.cmd run lint`: passed.

No production deployment, migration execution, provider call, Secret Manager read, Stripe action, Cloud Run job execution, or real render was performed.

## Current Installed Dependencies

Runtime dependencies:

| Package | Installed version |
| --- | --- |
| `@supabase/supabase-js` | `2.106.1` |
| `lucide-react` | `1.14.0` |
| `react` | `19.2.6` |
| `react-dom` | `19.2.6` |
| `react-router-dom` | `7.15.0` |

Development and build dependencies:

| Package | Installed version |
| --- | --- |
| `@eslint/js` | `10.0.1` |
| `@types/node` | `24.12.3` |
| `@types/react` | `19.2.14` |
| `@types/react-dom` | `19.2.3` |
| `@vitejs/plugin-react` | `6.0.1` |
| `eslint` | `10.3.0` |
| `eslint-plugin-react-hooks` | `7.1.1` |
| `eslint-plugin-react-refresh` | `0.5.2` |
| `globals` | `17.6.0` |
| `typescript` | `6.0.3` |
| `typescript-eslint` | `8.59.3` |
| `vite` | `8.0.12` |

## Mock-Only Vs Real

Mock/local today:

- Frontend prototype and chat-native planning UI.
- API route contracts, route registry, mock API router, and frontend-safe API client.
- Mock backend services for projects, media planning, intent/edit planning, edit quality, StoryTiming, SoundSync, SFX, generation placeholders, render placeholders, revisions, QA, credits, and jobs.
- Mock orchestration for project/edit/SFX/StoryTiming/render readiness flows.
- Mock SFX provider adapter paths for internal library, Mirelo SFX V1.5, and MMAudio V2.
- Mock worker skeletons, runtime envelopes, worker lease metadata, and render worker container skeletons.
- Supabase SQL migration files and local/staging readiness docs.
- Google Cloud resource maps, deployment examples, and readiness checklists that store names and references only.

Real/not active today:

- No deployed backend API service.
- No service-role Supabase handler.
- No remote Supabase migration execution confirmed by this repo state.
- No live provider calls for OpenAI, Wan, Hailuo, Veo, Lyria, Mirelo, MMAudio, or any other provider.
- No Stripe checkout, webhooks, ledger mutation, or real credit spend/refund.
- No signed storage upload/download runtime.
- No Cloud Run API service, Cloud Run Jobs, Pub/Sub, Cloud Tasks, or live worker dispatch.
- No Remotion, FFmpeg, VapourSynth, AudioFlux, Signalsmith Stretch, Sharp/libvips, Playwright/browser capture, or OpenCV-style media execution.
- No real media upload, download, rendering, transcoding, audio processing, transcription, beat detection, or QA media analysis.

## Missing Editing Tools

The launch tool stack is planned, not installed or executable.

Missing or non-executable editing/runtime tools:

- Remotion and `@remotion/renderer` for real preview/export composition.
- FFmpeg with reviewed LGPL-safe configuration for ingest, trimming, audio extraction, final encode, and export.
- VapourSynth for worker-only frame/native video pipeline work.
- AudioFlux for real audio analysis, beat/drop/onset detection, and SoundSync features.
- Signalsmith Stretch for time-stretch and pitch adjustment.
- Sharp + libvips for thumbnails, watermarks, resizing, overlay asset preparation, and image pipeline work.
- Playwright/browser capture worker tooling for authorized captures.
- OpenCV-style or comparable QA/media analysis tools.

The repo currently contains planning docs, mock contracts, and skeletons for these areas only. No tool package should be treated as production-ready until installation, licensing, security, benchmarks, worker isolation, and QA paths are reviewed.

## Missing Backend Runtime

The backend boundary is partially modeled but not production-active.

Missing backend runtime pieces:

- Deployed Cloud Run API service.
- Authenticated backend route middleware.
- Service-role Supabase runtime and audited service-role handlers.
- Secret Manager bindings and runtime secret resolution.
- Signed URL service for private storage access.
- Real handlers for backend-required routes.
- Transactional credit ledger mutation.
- Stripe checkout and webhook runtime.
- Provider gateway transport.
- Worker dispatch runtime through Cloud Run Jobs, Pub/Sub, or Cloud Tasks.
- Monitoring, rate limits, request logging without secrets, alerting, and operational runbooks.

The current mock backend shape is useful for contract safety, but it cannot run real editing work end to end yet.

## Missing Database Runtime Tables

SQL migration files exist under `supabase/migrations`, including:

- Core workspace, project, chat, media, and source sequence foundations.
- Intent and edit planning tables.
- Professional edit quality tables.
- Credit ledger and approval gate tables.
- Job orchestration and agent run tables.
- Stroke Motion data model tables.
- Generation provider and generated asset tables.
- Render, preview, export, revision, and QA tables.
- SFX Director tables.
- StoryTiming master timing tables.
- Storage upload pipeline readiness policies.
- Worker leases and backend runtime transport tables.

However, production runtime tables are still missing until migrations are applied and verified in a real Supabase environment. Required future validation includes local/staging migration execution, RLS verification, storage policy tests, Supabase advisor review, backup/rollback readiness, and explicit approval before production use.

## Missing Worker And Runtime Connections

Mock worker skeletons and payload contracts exist, but they are not connected to live execution.

Missing runtime connections:

- SFX generation workers do not execute real Mirelo or MMAudio calls.
- Lyria/music workers do not call real music generation APIs.
- Remotion render workers do not render real previews or exports.
- FFmpeg/media workers do not ingest, trim, transcode, or export media.
- AudioFlux/SoundSync workers do not run real beat, onset, rhythm, or ducking analysis.
- Browser capture workers do not run authorized capture jobs.
- QA/export workers do not inspect rendered output or publish final exports.
- Library-promotion workers do not promote generated SFX into a real reusable asset library.
- Worker leases, runtime messages, idempotency checks, and dispatch placeholders are local/mock and not connected to live queues, GCS, Secret Manager, or service-role mutation.

## Exact Next Implementation Order

1. Complete this RP-E2E-READY-01 audit and keep it documentation-only.
2. Validate Supabase migrations locally and in staging, including RLS, storage policies, worker lease tables, advisory checks, backups, and rollback steps.
3. Deploy the mock Cloud Run API service with backend-required routes still blocked.
4. Add authenticated backend route middleware and service-role Supabase handlers for bootstrap, approved snapshots, credits, jobs, signed storage, and status reads.
5. Connect real job queue, lease mutation, and idempotent worker dispatch without providers.
6. Connect private GCS signed upload/download and canonical storage records.
7. Add worker containers one lane at a time: Remotion mock-to-real readiness, SFX mock-to-real readiness, audio/tool workers, QA workers, and export workers.
8. Enable provider transports only after Secret Manager, approval gates, credit reservation, storage, retry/refund, QA, and logging safety pass.
9. Add Stripe only after backend runtime and credit ledger mutation are production-safe.
10. Run a full end-to-end flow with mock providers first, then limited real-provider smoke tests behind explicit flags.

## RP-GCP-04 Checklist Status

Current baseline:

- Baseline build passed.
- Baseline lint passed.
- No secrets were added.
- No provider SDK network calls were added.
- Approved snapshot, worker payload, storage path, provider gateway, render worker, and readiness contracts exist in mock/planning form.
- `.env.example` remains placeholder-oriented.
- Supabase service role remains backend-only by policy.
- No real Google Cloud resources were created by this audit.
- No provider API calls were added.
- No rendering execution was added.
- No browser capture execution was added.
- No Stripe integration was added.

Still blocked before real integration:

- Deploy backend runtime safely.
- Verify service-role boundaries in production runtime.
- Apply and verify Supabase migrations.
- Add Secret Manager runtime binding.
- Add real worker dispatch and storage paths.
- Add provider/payment/render execution only behind approval, credit, QA, and logging gates.

## Final Readiness Assessment

ReeditPro is ready for the next mock-to-runtime hardening milestone, not for real end-to-end production editing execution.

The repo is strong in planning contracts, mock flows, route boundaries, migration design, and worker skeletons. The missing layer is production runtime: deployed backend, applied database, live worker dispatch, private storage, provider transport, credit/Stripe execution, real render/media tooling, and operational controls.
