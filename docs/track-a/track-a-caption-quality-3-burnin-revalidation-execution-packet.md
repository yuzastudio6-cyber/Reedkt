# TRACKA-CAPTION-QUALITY-3 Burn-In Revalidation Execution Packet

Status: `guarded_execution_packet_created`

Branch: `codex/rp-tracka-caption-quality-3-burnin-revalidation-execution-packet`

PR title: `[track-a] Caption burn-in revalidation execution packet`

Base: `ea238ad8ffc28c277ea36ba66b8488cb37cf66cc`

## Source-Of-Truth Audit

| Source | Status | Role |
| --- | --- | --- |
| #419 TRACKA-VISUAL-REVIEW-2C | merged at `01e19cf6bd975b6ac9168c2d226638d211849886` | records `pass_with_warnings_sample_level` |
| #422 TRACKA-VISUAL-GAP-CLOSURE-1 | merged at `cc49487f56e2c30f8f77af84b856da0453a07e1d` | records caption/transcript quality and OTIO/full E2E as internal beta blockers |
| #426 TRACKA-CAPTION-QUALITY-1 | merged at `58a3f87a6fc07e3afc6fb699c40c8b744cc75eab` | closes controlled-test caption text quality and defines the approved caption source |
| #429 TRACKA-MISSING-VISUAL-EVIDENCE-1 | merged at `e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f` | provides the merged missing visual evidence bundle source |
| #434 TRACKA-MISSING-VISUAL-EVIDENCE-2 | merged at `2bb01b188aeb636c4234ecd4a9bf6a12ad87eee3` | records `partial_pass_with_warnings` and keeps corrected-caption burn-in blocked |
| #440 TRACKA-CAPTION-QUALITY-2 | merged at `ea238ad8ffc28c277ea36ba66b8488cb37cf66cc` | records `TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet` |

## Execution Mode

execution: blocked_pending_caption_burnin_execution_confirmation

Required confirmation for future execution: `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`

Because the confirmation is not set in this packet phase, this PR creates the guarded execution packet, contracts, QA map, IAM/storage plan, command plan, and diagnostics only.

## Approved Caption Source

captionSourceId: tracka-caption-quality-1-controlled-test-copy

captionSourceType: controlled_test_caption_copy

transcriptAccuracyClaim: false

captionTextQualityForControlledTest: pass

captionVisualBurnInRevalidationRequired: true

Corrected controlled-test caption copy:

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

Old awkward #419 preview caption text is rejected and not reused: "Hey guys, I saw how you guys doing today is going to do going to be the first".

## Guarded Pathway

- ASS sidecar execution contract: documented only.
- libass burn-in execution contract: documented only.
- Remotion preview execution contract: documented only.
- FFmpeg/FFprobe validation contract: documented only.
- private artifact policy: documented only.
- IAM/storage plan: report-only, no GCS access.
- command plan: future-only, gated by the confirmation env.

## Current Statuses

TRACKA-CAPTION-QUALITY-3R readiness: ready_for_guarded_execution

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: blocked_pending_caption_burnin_revalidation_execution_and_scope_decision

INTERNAL-BETA readiness: blocked_pending_caption_burnin_revalidation_and_scope_decision

Corrected-caption burn-in runtime execution has not run.

## Blocked Scope

Track A runtime, libass, FFmpeg/FFprobe, Remotion, private GCS read/write, media output creation, private E2E, tool execution, worker execution, provider/model calls, routes, Supabase, SQL, migrations, signed URLs, public artifacts, final delivery, internal beta, external beta, production, billing, dependency mutation, package-lock mutation, and raw prompt execution remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
