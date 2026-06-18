# Worker Runtime Transactional Contract 1 Blocked Scope Register

Register status: `blocked_pending_supabase_worker_rpc_schema_readiness`

This register prevents a contract-planning packet from being confused with execution or unlock authority.

## Blocked Runtime Scope

- worker execution
- job claim execution
- lease acquisition
- heartbeat execution
- service-role handler execution
- route execution
- tool execution
- provider/model calls
- Track A runtime/media execution
- FFmpeg/FFprobe/libass/Remotion execution
- browser capture
- private artifact or GCS access
- signed URL creation
- public artifact creation
- final render/export
- raw prompt execution

## Blocked Supabase/Billing/Deployment Scope

- Supabase mutation
- SQL execution
- migration/schema/RLS changes
- storage bucket changes
- Secret Manager payload access
- credit mutation
- Stripe checkout/webhook/payment processing
- dependency mutation
- package-lock mutation
- deployment
- broad service-role handler

## Blocked Product Unlocks

- internal beta
- external beta
- paid production
- production
- broad media
- final delivery/export
- public artifacts
- signed URL source-of-truth

## Blocked Track A Capabilities

- BiRefNet/text-behind-subject/masking
- SAM2
- Real-ESRGAN
- FILM
- OpenColorIO/OpenImageIO production color
- arbitrary user media
- final delivery/export

## Decision

Internal beta unlocked: false

trackAInternalBetaUnlocked: false

INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
