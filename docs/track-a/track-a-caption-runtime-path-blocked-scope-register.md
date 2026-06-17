# Track A Caption Runtime Path Blocked Scope Register

Status: `blocked_ffmpeg_missing_ass_subtitles_filter`

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
- Docker/Cloud Run build/push/deploy.

## Current Blocker

runtimePathStatus: `blocked_ffmpeg_missing_ass_subtitles_filter`

blocker: `blocked_ffmpeg_missing_ass_subtitles_filter`

provisioningStatus: `completed_host_runtime_provisioning`

provisioningFailureSummary: `none`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Only metadata-only local runtime path checks and explicitly confirmed host-level FFmpeg/FFprobe provisioning were allowed; no media input or output was used.
