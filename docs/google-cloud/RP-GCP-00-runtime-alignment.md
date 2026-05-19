# RP-GCP-00 Runtime Alignment

## Purpose

RP-GCP-00 prepares ReeditPro for future Google Cloud production integration without deploying anything, creating resources, adding credentials, calling providers, connecting remote Supabase, uploading media, or rendering video.

This is a mock-only production-readiness alignment layer.

## Source Of Truth

Supabase remains the source of truth for:

- auth
- database records
- approved plan snapshots
- credit estimates, approvals, reservations, ledger metadata, and refunds
- job metadata and events
- generated asset metadata
- render, QA, preview review, revision, export, and audit records

Google Cloud will later handle:

- GCS media and artifact storage
- provider gateway runtime
- worker jobs
- Remotion rendering
- Secret Manager
- logs and monitoring
- orchestration through Cloud Tasks, Pub/Sub, Workflows, or Cloud Run

## Frontend Boundary

Frontend code never calls OpenAI, Wan, Hailuo, Veo, Remotion workers, FFmpeg workers, Playwright/browser-capture workers, provider SDKs, worker services, Google Cloud services, or server-only Supabase paths directly.

Frontend can show plans, approvals, progress, previews, and user actions. Expensive work stays behind approved backend/worker boundaries.

## Worker Execution Boundary

Workers execute approved snapshots, not raw chat.

Before expensive work, future workers must load trusted context from Supabase by ID and verify:

- approved edit plan
- approved credit estimate
- credit reservation when generation/render/export work is required
- dependency readiness
- approved snapshot status and hash
- model/tier policy
- QA and fallback policy
- frame, timing, source cleanup, and render readiness rules where relevant

Workers must write outputs to storage and write metadata, status, and events back to Supabase. They must not mutate plans outside approved fallback and revision rules.

## Snapshot Migration Reality

The current active local migration chain already contains `public.approved_plan_snapshots` in `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`.

RP-GCP-00 therefore does not add a new approved snapshot migration or draft migration. If the production contract later needs columns such as `workspace_id`, `snapshot_hash`, `execution_ready_at`, or richer audit fields, that hardening should happen in a later reviewed migration milestone.

## Secret And Logging Boundary

Workers must never log:

- raw secrets
- signed URLs
- provider keys
- service-role keys
- webhook secrets
- raw sensitive user data

Database rows and provider metadata may store Secret Manager reference names only. Raw secrets belong in Secret Manager or secure local developer environments, never in source control or frontend code.

## Browser Capture Boundary

Browser/app capture must be user-authorized. It must not bypass authentication, paywalls, CAPTCHAs, robots, rate limits, site restrictions, or user permissions.

Browser capture is future worker-only behavior. RP-GCP-00 does not install, run, or configure Playwright.

## Non-Goals

RP-GCP-00 does not:

- create Google Cloud resources
- run `gcloud`
- add real API keys
- connect remote Supabase
- call provider APIs
- add Stripe
- implement real uploads
- install or execute Remotion, FFmpeg, Playwright, or provider SDKs
- implement real rendering

