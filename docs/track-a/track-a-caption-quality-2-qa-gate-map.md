# TRACKA-CAPTION-QUALITY-2 QA Gate Map

Status: `planning_only`

| Gate | Required Future Evidence | Current Status |
| --- | --- | --- |
| corrected caption source | `captionSourceType: controlled_test_caption_copy`, `transcriptAccuracyClaim: false`, four #426 lines | pass_for_text_source |
| rejected old text | old awkward preview text is not reused | planned_gate |
| ASS sidecar integrity | sidecar manifest, source id, checksum, exact text | future_required |
| libass burn-in visual proof | private review sample with corrected captions | blocked_pending_TRACKA-CAPTION-QUALITY-3 |
| Remotion preview proof | private preview manifest and review sample | blocked_pending_TRACKA-CAPTION-QUALITY-3 |
| FFmpeg/FFprobe validation | metadata/checksum validation after approved execution | blocked_pending_TRACKA-CAPTION-QUALITY-3 |
| private E2E | one clean private E2E review sample after corrected-caption proof | blocked_pending_caption_burnin_revalidation_execution_and_scope_decision |
| scope decision | decide whether BiRefNet and Real-ESRGAN are excluded from first beta | required_before_internal_beta_rollup |
| source-of-truth | structured manifests and checksums, not previews alone | planned_gate |

## Readiness Decisions

TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet

TRACKA-MISSING-VISUAL-EVIDENCE-3 readiness: optional_scope_expansion_only

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision

INTERNAL-BETA readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision

## Blocked Claims

This QA map does not claim libass success, Remotion success, FFmpeg/FFprobe validation success, private E2E success, internal beta readiness, production readiness, final delivery readiness, public artifact readiness, or signed URL readiness.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
