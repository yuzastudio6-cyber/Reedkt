# End-To-End Video Editor Readiness

Status: local E2E MVP is working locally / production video editing remains production-required.

Branch target: `codex/reeditpro-e2e-readiness`

## Staging Gate Status

The staging Cloud Run / Remotion render infrastructure canary passed as a guarded manual gate:

- Run: `26321096931`
- Head SHA: `915b110548cac27cdaffdbffb17bdfa54a724a01`
- Smoke run ID: `rp-e2e-smoke-299243de-9589-4f4a-9d02-5d1ca5fd4b35`
- Result: `PASS`, render status `preview_ready`
- Cloud Run path: `/canary/render`
- Remotion path: `renderMedia / bundle / selectComposition`
- Artifact: `video/mp4`, `22,708` bytes, `3s`, `160x90`, `15fps`, `45` frames
- Cleanup: `26` records deleted, no cleanup errors, no leftover records, no leftover query errors

The staging real-video upload-to-preview canary also passed as a guarded manual gate:

- Run: `26348118904`
- Head SHA: `a3dbc6c83dce5dc2b1b3cb83339450ac0b83a574`
- Smoke run ID: `rp-e2e-smoke-a7606dae-f697-40cb-ae0a-644cd32b4bc9`
- Result: `PASS`, render status `preview_ready`
- Source video: smoke-tagged GCS artifact created and downloaded by Cloud Run
- Cloud Run path: `/canary/render`
- Remotion path: `renderMedia / bundle / selectComposition`
- Preview artifact: `video/mp4`, `48,232` bytes, `3s`, `160x90`, `15fps`, `45` frames
- Job transitions: `worker_claimed -> completed`
- Cleanup: `26` Supabase records deleted, `2` GCS objects deleted, no cleanup errors, no leftover records, no leftover query errors

These prove only staging smoke canary paths. They do not enable production rendering, providers, Stripe/payment, customer media, broad E2E suites, queue draining, or existing user job processing. OIDC/WIF was used and no service account JSON key path was used.

RP-TOOLS-01 now adds code-enforced runtime editing tool contracts for FFmpeg, FFprobe, Remotion, Sharp/libvips, OpenCV, AudioFlux, Signalsmith Stretch, Whisper/faster-whisper/whisper.cpp, PySceneDetect, Playwright, and VapourSynth.

- Current strict required tools: `ffmpeg`, `ffprobe`, and `remotion`
- Code-enforced/proven staging tools: `ffmpeg`, `ffprobe`, and `remotion`
- Optional/planned tools: Sharp/libvips, OpenCV, AudioFlux, Signalsmith Stretch, Whisper variants, PySceneDetect, Playwright runtime capture, and VapourSynth
- Safe checks only: version, import, or package-resolution checks; no media processing, provider calls, Stripe/payment, production deploy, customer media, broad queues, or service account JSON keys

RP-MEDIA-01 passed as the guarded media-analysis worker canary:

- Run: `26349869644`
- Job: `77566075442`
- Head SHA: `287e33bead1dcfdab086494723f6e250bc262804`
- Smoke run ID: `rp-e2e-smoke-c52baa68-bb67-43c1-b9bc-380cc44d9121`
- Result: `PASS`
- Required for this gate: FFmpeg and FFprobe
- Not required for this gate: Remotion and Cloud Run rendering
- Flow: generated smoke MP4 -> GCS source media -> Supabase source metadata -> FFprobe metadata -> FFmpeg thumbnail/audio check -> GCS analysis artifacts -> smoke-safe media-analysis job metadata -> cleanup and strict leftover checks
- FFprobe summary: `3s`, `160x90`, `mpeg4`, `mp4` container, one video stream, no audio
- FFmpeg thumbnail: `image/jpeg`, `160x90`, `3,364` bytes
- Artifact path: `workspaces/{workspaceId}/projects/{projectId}/media-analysis/{smokeRunId}/...`
- Optional warnings only: PySceneDetect, Whisper variants, OpenCV, and AudioFlux
- Cleanup: `15` Supabase records deleted, `5` GCS objects deleted, no cleanup errors, no leftover records, no leftover query errors

RP-EDIT-01 is implemented as the next fail-closed staging canary, but it has not yet been live-dispatched or recorded as passed.

- Required for this gate: FFmpeg, FFprobe, and Remotion
- Flow: generated smoke MP4 -> GCS source media -> FFprobe/FFmpeg analysis -> deterministic one-segment timeline -> private Cloud Run `/canary/render` -> Remotion preview render -> GCS preview artifact -> render/QA metadata -> cleanup and strict leftover checks
- Timeline: `3s`, `160x90`, `15fps`, `45` frames, one trimmed source segment, caption placeholder, and lower-third/safe-zone overlay
- Preview path: `workspaces/{workspaceId}/projects/{projectId}/previews/{renderId}/...`
- Rollout blocker: Cloud Run service image redeploy is required before live dispatch because the canary service and Remotion entrypoint changed

## What This Branch Proves

This branch consolidates the newest planning-stack backend/runtime/render scaffolds with the pushed AI editor shell and browser-local MVP flow.

The canonical `/editor` UI is now the focused AI Editor chat shell: sidebar visible by default, compact project header, source sequence review inside chat, compact composer, and plan/credit/progress/preview cards only when they are relevant. The old demo scenario selector, planner regression panel, Supabase schema/migration cards, and developer planning-progress surface are removed from the visible editor path.

The local flow is demo-safe:

1. Open `/projects/new`.
2. Create a local project.
3. Select local source files in browser file input.
4. Create upload plans from file metadata only.
5. Open `/editor?projectId=...`.
6. Preserve and review source clip order.
7. Confirm source order, output frame, cleanup preference, edit level, and visual preference.
8. Generate the mock edit plan and credit estimate.
9. Approve the plan and credits.
10. Reserve mock credits.
11. Queue, lease, heartbeat, dispatch, and complete a mock job through the mock API/runtime path.
12. Reach a preview-ready placeholder state.

No file upload, provider call, Stripe call, Cloud Run call, Supabase mutation, FFmpeg run, Remotion render, or real export happens in this branch.

## Local E2E Demo Checklist

| Area | Status | Notes |
| --- | --- | --- |
| Root route | working locally | `/` redirects to `/editor` for fastest testing. |
| Project setup | working locally | `/projects/new` opens the local project setup form. |
| Local files | working locally | Browser-selected files create metadata and upload plans only. |
| Upload order | working locally | Selected order becomes source order and can be reviewed/reordered in chat. |
| Editor shell | working locally | `/editor` uses the focused chat-native editor from the AI editor shell; old mega-planning/dev UI is disconnected. |
| Sidebar toggle | working locally | Header toolbar hides/shows the sidebar and stores preference in `localStorage`. |
| Project loading | working locally | `/editor?projectId=...` loads browser-local project state. |
| Demo fallback | working locally | `/editor` without a project falls back to the polished demo chat. |
| Planning cards | working locally | Intent, source sequence, aspect ratio, cleanup, edit level, visual preference, plan, timing, QA, and credits are mock-generated. |
| Approval gates | working locally | Local approval requires source order, frame, cleanup, edit level, visual preference, plan, and credits. |
| Mock credits | mock-only | Approval creates a mock reservation, not a real ledger transaction. |
| Mock job runtime | mock-only | Mock API routes create queue, lease, heartbeat, dispatch, completion, and events. |
| Preview ready | mock-only | Preview/export-ready UI is a placeholder status, not rendered video. |
| Backend scaffold | mock-only | Node server exposes health/readiness/runtime/routes/mock endpoints when started locally. |

## Production Readiness Checklist

| Area | Status | Notes |
| --- | --- | --- |
| Supabase auth/bootstrap | mock-only | Browser-safe helpers exist; production auth screens and backend service-role fallback are still needed. |
| Supabase migrations | production-required | Active migrations exist locally but still need local/staging validation, advisor review, backups, and production approval. |
| Storage uploads | production-required | Upload planning exists; real Supabase Storage buckets, RLS, signed uploads/downloads, and policy validation remain. |
| Approved snapshots | production-required | Mock snapshots exist in memory/browser flow; durable DB snapshot persistence is still needed. |
| Credit ledger | production-required | Mock estimates/reservations/spend/refund exist; transactional backend ledger and Stripe credit purchase flow remain. |
| Worker queue | production-required | Mock job queue, dependencies, lease, heartbeat, retry, and dispatch exist; durable cloud queue/leases remain. |
| Backend runtime | production-required | Cloud Run API service is scaffolded but not deployed. |
| Provider gateway | production-required | OpenAI, Lyria, Mirelo, MMAudio, Wan, Veo, Kling, Hailuo, and related provider calls remain disabled/backend-required. |
| Render/export | production-required | Staging Cloud Run / Remotion infrastructure and real-video upload-to-preview canaries passed with tiny smoke artifacts. Production render/export workers, customer media processing, final exports, and production QA remain. |
| Runtime editing tools | partially fixed | Typed registry and safe readiness checks exist for core/open-source tools. Optional tool installation, license/security review, worker images, worker canaries, and production/customer execution remain blocked. |
| Media analysis worker | staging smoke passed | RP-MEDIA-01 passed with one generated staging smoke video, FFprobe metadata, FFmpeg thumbnail extraction, GCS artifacts, Supabase cleanup, and no leftovers. Customer media analysis remains blocked. |
| Timeline composition worker | implementation added | RP-EDIT-01 adds a staging-only canary for a deterministic one-segment edit timeline rendered through Cloud Run/Remotion. Live workflow dispatch/pass recording is still pending; customer timeline rendering remains blocked. |
| Stripe | production-required | Checkout, subscriptions, webhooks, invoices, and credit purchase reconciliation remain missing. |
| Monitoring/rate limits | production-required | Production logging, metrics, alerts, abuse controls, and quota enforcement remain missing. |
| QA | production-required | Mock planning QA exists; real media QA, frame/audio validation, render QA, and failure recovery still need workers. |

## Safe Local Run Path

Frontend:

```powershell
npm.cmd run dev
```

Backend scaffold:

```powershell
$env:SERVER_RUNTIME_MODE='mock'
$env:PORT='8080'
npm.cmd run start:server
```

Useful URLs:

- `http://127.0.0.1:5173/editor`
- `http://127.0.0.1:5173/projects/new`
- `http://127.0.0.1:8080/health`
- `http://127.0.0.1:8080/ready`
- `http://127.0.0.1:8080/api/runtime/status`
- `http://127.0.0.1:8080/api/routes`

## Fail-Closed Rules Verified By Design

- Frontend uses only public/mock-safe routes.
- Browser code does not read backend-only secrets.
- Backend-required routes return blocked/backend-required responses in mock mode.
- Real provider, payment, worker, render, signed-storage, and service-role operations are not called.
- Changing source order or major planning inputs resets approval/progress state.

## Recommended Next Production Milestone

Next safe staging gates, in order:

1. Live RP-EDIT-01 real timeline composition canary dispatch/recording.
2. SoundSync analysis canary.
3. Provider sandbox validation, disabled by default and limited to a single provider plus a single smoke-tagged job.

Every next gate must keep explicit allow flags, staging-only configuration, cleanup, strict leftover checks, no Stripe/payment, no production, no broad E2E, no queue drain, and no customer media.

Next production milestone remains separate: production backend/runtime hardening after staging gates complete.

That production milestone should validate active migrations, generated database types, RLS/storage policies, Cloud Run service startup, Secret Manager placeholders, request auth, and live mock API transport without enabling Stripe, broad providers, or production rendering.
