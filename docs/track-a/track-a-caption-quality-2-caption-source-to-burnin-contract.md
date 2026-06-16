# TRACKA-CAPTION-QUALITY-2 Caption Source To Burn-In Contract

Status: `planning_only`

## Source Contract

| Field | Value |
| --- | --- |
| `captionSourceId` | `tracka-caption-quality-1-controlled-test-copy` |
| `captionSourceType` | `controlled_test_caption_copy` |
| `transcriptAccuracyClaim` | `false` |
| `captionTextQualityForControlledTest` | `pass` |
| `visualBurnInRevalidationRequired` | `true` |
| `sourceOwner` | `TRACK_A_RENDER_EXPORT` |
| `sourcePR` | #426 merged at `58a3f87a6fc07e3afc6fb699c40c8b744cc75eab` |
| `downstreamPhase` | `TRACKA-CAPTION-QUALITY-3` |

## Approved Lines

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

## Allowed Use

- controlled Track A private visual revalidation
- future ASS sidecar planning
- future libass burn-in planning
- future Remotion preview planning
- future FFmpeg/FFprobe validation planning
- future private E2E review planning

## Blocked Use

- arbitrary user media transcripts
- transcript accuracy claims
- production captions
- external beta captions
- final delivery captions
- raw prompt execution
- public artifact captions
- signed URL source-of-truth captions

## Source-Of-Truth Rule

Structured caption source records, corrected line text, future sidecar checksums, private manifest refs, and QA records are source of truth. Old preview captions, temporary renders, screenshots without manifests, signed URLs, public artifacts, raw prompts, raw provider responses, and final exports are not source of truth.

## Required Future Handoff

TRACKA-CAPTION-QUALITY-3 must consume this contract and produce an execution packet before any future approved execution. That packet must still require owner approval, runtime gates, private artifact policy, QA gates, and explicit no-production/no-beta/no-final-delivery scope.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
