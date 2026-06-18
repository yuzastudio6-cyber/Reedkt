# Track A Restricted Internal Beta Scope Decision 1

## Source-Of-Truth Status

sourceBase: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

sourceBaseMergeSha: `cd0cdbb676bd35623b1acb63206914a0bc6b5a99`

sourceEvidence: `#419`, `#422`, `#426`, `#429`, `#434`, `#440`, `#443`, `#447`, `#452`, `#459`, `#463`, `#475`, `#484`, `#488`, `#492`

#492 outcome: `accepted_for_restricted_internal_beta_scope_with_configurable_caption_policy`

#492 policy: `user_configurable_default_one_line`

## Decision Values

trackARestrictedInternalBetaScopeDecision: `approved_for_private_e2e_revalidation_planning`

trackAInternalBetaUnlocked: false

trackAPrivateE2ERevalidationPlanningReady: true

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `ready`

INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_tracka_private_e2e_revalidation`

productionReady: false

externalBetaReady: false

finalDeliveryReady: false

## Decision Summary

Track A is approved to proceed into restricted private E2E revalidation planning with a narrow scope: private render/export review, corrected controlled-test caption burn-in, configurable caption layout policy, libass caption burn-in runtime evidence, FFmpeg/FFprobe private validation evidence, private preview evidence where current-source proof is sufficient, and private artifact manifest/checksum/QA-report evidence.

This decision does not unlock internal beta. It only freezes the allowed and excluded scope for the next private E2E revalidation planning packet.

## Caption Layout Policy Carried Forward

defaultCaptionPreset: `one_line_bottom_safe_area`

defaultMaxLines: `1`

defaultPlacement: `bottom_center_safe_area`

defaultAvoidFaceObstruction: `true`

defaultSafeMarginsRequired: `true`

defaultTranscriptAccuracyClaim: `false`

configurablePresets: `one_line_bottom_safe_area`, `two_line_subtitle`, `auto_wrap_subtitle`, `creator_large_caption`, `lower_third_caption`, `manual_position_and_size`

## Ownership Boundary

Workstream owner: `INTERNAL_BETA_READINESS / TRACK_A_RENDER_EXPORT coordination`

Related workstreams: `TRACK_A_RENDER_EXPORT`, `WORKER_RUNTIME_JOBS`, `TOOL_ROUTE_COORDINATION`, `TRACK_B_MEDIA_PROCESSING`, `AI_TOOLS_CREATIVE_GRAPHICS`, `PROVIDER_GATEWAY_MODELS`, `SUPABASE_RLS_STORAGE_DATABASE`, `OBSERVABILITY_AUDIT_COST`, `COMPLIANCE_SECURITY`, `FRONTEND_PRODUCT_UX`, `BILLING_STRIPE_CREDITS`.

This phase does not own Track B runtime, AI Tools runtime, Provider/model execution, Worker Runtime execution, Supabase schema/RLS/migrations, public artifact delivery, signed URL delivery, external beta unlock, production unlock, or paid production unlock.

## Supabase Update Classification

- Supabase update required: docs/status only
- Supabase update status: docs_only
- Supabase environment touched: none
- SQL executed: none
- Migration deployed: no
- Next Supabase action: none

## Scope Boundary

runtimeExecutionInThisPr: false

gcsAccessInThisPr: false

privateArtifactAccessInThisPr: false

ffmpegExecutionInThisPr: false

ffprobeExecutionInThisPr: false

libassExecutionInThisPr: false

remotionExecutionInThisPr: false

workerExecutionInThisPr: false

providerModelCallInThisPr: false

routeExecutionInThisPr: false

signedUrlsCreated: false

publicArtifactsCreated: false

supabaseMutationInThisPr: false

sqlExecutedInThisPr: false

dependencyMutationInThisPr: false

packageLockMutationInThisPr: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
