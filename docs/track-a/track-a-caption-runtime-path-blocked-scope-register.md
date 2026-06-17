# Track A Caption Runtime Path Blocked Scope Register

Status: `blocked_runtime_image_build_failed`

Blocked in this phase:

- actual caption burn-in.
- actual libass media processing.
- actual FFmpeg/FFprobe media processing.
- actual Remotion render.
- private GCS read/copy/write.
- public artifacts.
- signed URLs.
- final delivery/export.
- internal beta unlock.
- external beta unlock.
- production unlock.
- paid production unlock.
- arbitrary user media.
- broad media.
- provider/model calls.
- raw prompt execution.
- Supabase schema/RLS/migrations.
- Supabase product-row mutation.
- billing/credit mutation.
- dependency mutation.
- package-lock mutation.
- committed binaries.
- Docker media mounts.
- Docker image push.
- Cloud Run build or deployment.

## Current Blocker

runtimePathStatus: `blocked_runtime_image_build_failed`

blocker: `blocked_runtime_image_build_failed`

provisioningStatus: `not_needed`

provisioningFailureSummary: `none`

libassRepairStatus: `not_needed`

libassRepairFailureSummary: `none`

dockerRuntimeStatus: `blocked_runtime_image_build_failed`

dockerRuntimeBlocker: `blocked_runtime_image_build_failed`

dockerRuntimeBuildStatus: `blocked_runtime_image_build_failed`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed repo-owned Docker FFmpeg/ffprobe/libass runtime inspection were allowed; no media input or output was used.
