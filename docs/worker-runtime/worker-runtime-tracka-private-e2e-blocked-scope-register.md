# Worker Runtime Track A Private E2E Blocked Scope Register

Register status: `active_for_worker_runtime_gate_1`

This register preserves the blocked scope inherited from #497 and #502 for Worker Runtime planning. It prevents this gate from being interpreted as runtime permission.

## Runtime Blocks

| Blocked item | Status |
| --- | --- |
| worker execution | `blocked` |
| worker claim/lease execution | `blocked` |
| service-role worker runtime handler | `blocked` |
| broad service-role handler | `blocked` |
| route execution | `blocked` |
| tool execution | `blocked` |
| provider/model call | `blocked` |
| FFmpeg execution | `blocked` |
| FFprobe execution | `blocked` |
| libass execution | `blocked` |
| Remotion execution | `blocked` |
| media processing | `blocked` |
| frame extraction | `blocked` |
| GCS/private artifact access | `blocked` |
| signed URL creation | `blocked` |
| public artifact creation | `blocked` |
| Supabase mutation | `blocked` |
| SQL/migrations/schema/RLS | `blocked` |
| credit or Stripe mutation | `blocked` |
| dependency or package-lock mutation | `blocked` |
| raw prompt execution | `blocked` |
| final render/export | `blocked` |
| internal beta unlock | `blocked` |
| external beta unlock | `blocked` |
| production unlock | `blocked` |

## Track A Capability Blocks

| Capability | Status |
| --- | --- |
| `birefnet_text_behind_subject_masking` | `excluded_from_first_restricted_internal_beta` |
| `sam2_segmentation_runtime` | `excluded_from_first_restricted_internal_beta` |
| `real_esrgan_enhancement` | `excluded_from_first_restricted_internal_beta` |
| `film_interpolation_runtime` | `excluded_from_first_restricted_internal_beta` |
| `opencolorio_openimageio_production_color_management` | `deferred_from_first_restricted_internal_beta` |
| broad/arbitrary user media | `blocked` |
| public artifacts | `blocked` |
| signed URL source-of-truth | `blocked` |
| final delivery/export | `blocked` |
| external beta | `blocked` |
| paid production | `blocked` |
| production | `blocked` |

## Register Decision

Worker runtime execution readiness: blocked_pending_worker_runtime_transactional_execution_gate

trackAInternalBetaUnlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
