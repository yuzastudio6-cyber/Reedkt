# TRACKA-CAPTION-QUALITY-3 Burn-In Revalidation Execution Packet

## Goal

Prepare a future execution packet for corrected controlled-test caption burn-in revalidation after TRACKA-CAPTION-QUALITY-2 planning is merged.

## Required Sources

- #426 TRACKA-CAPTION-QUALITY-1 approved caption source.
- #434 TRACKA-MISSING-VISUAL-EVIDENCE-2 outcome.
- `docs/track-a/track-a-caption-quality-2-burnin-revalidation-planning.md`.
- `docs/track-a/track-a-caption-quality-2-caption-source-to-burnin-contract.md`.
- `docs/track-a/track-a-caption-quality-2-ass-sidecar-plan.md`.
- `docs/track-a/track-a-caption-quality-2-libass-burnin-plan.md`.
- `docs/track-a/track-a-caption-quality-2-remotion-preview-plan.md`.
- `docs/track-a/track-a-caption-quality-2-ffmpeg-ffprobe-validation-plan.md`.
- `docs/track-a/track-a-caption-quality-2-qa-gate-map.md`.

## Required Caption Source

captionSourceType: controlled_test_caption_copy

transcriptAccuracyClaim: false

Use only the corrected four-line caption copy from #426:

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

## Execution Packet Requirements

- define bounded private inputs before any execution.
- define ASS sidecar creation requirements and checksum capture.
- define future libass burn-in steps only if separately approved.
- define future Remotion preview steps only if separately approved.
- define future FFmpeg/FFprobe validation steps only if separately approved.
- define no-public-artifact and no-signed-URL policy.
- keep internal beta, external beta, production, final delivery, and broad media blocked.

## Acceptance Criteria

- corrected-caption visual burn-in is explicitly tied to #426.
- old awkward caption text is blocked.
- transcript accuracy remains false.
- output remains private review evidence only.
- TRACKA-PRIVATE-E2E-REVALIDATION-1 remains blocked until caption burn-in revalidation execution and scope decision are complete.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
