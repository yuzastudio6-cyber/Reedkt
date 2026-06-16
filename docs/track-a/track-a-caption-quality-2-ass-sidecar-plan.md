# TRACKA-CAPTION-QUALITY-2 ASS Sidecar Planning

Status: `future_execution_packet_planning_only`

## Purpose

Plan the future ASS sidecar contract for corrected controlled-test captions. This phase does not generate an ASS file and does not run libass, FFmpeg, Remotion, media processing, or private E2E execution.

## Planned Sidecar Fields

| Field | Requirement |
| --- | --- |
| `captionSourceId` | `tracka-caption-quality-1-controlled-test-copy` |
| `captionSourceType` | `controlled_test_caption_copy` |
| `transcriptAccuracyClaim` | `false` |
| `lineText[]` | exact four #426 approved corrected lines |
| `timingBase` | future controlled-test timing only; no timing execution in this phase |
| `stylePolicy` | readable professional controlled-test caption styling |
| `safeZonePolicy` | keep captions clear of faces, products, masks, charts, maps, labels, and review UI |
| `lineBreakPolicy` | prefer one or two readable lines; no cramped text |
| `collisionPolicy` | fail future QA if captions collide with important visual evidence |
| `checksumPolicy` | future sidecar checksum required before downstream burn-in review |

## Rejected Text

The old awkward preview sample is rejected: "Hey guys, I saw how you guys doing today is going to do going to be the first".

## Future QA Requirements

- verify only corrected #426 caption lines are present.
- verify the sidecar has deterministic line order.
- verify style and safe-zone choices match the Track A review frame.
- verify transcript accuracy is not claimed.
- verify the sidecar remains private and manifest-bound.

## Blocked Scope

ASS sidecar generation, libass burn-in, FFmpeg validation, Remotion preview, media processing, private artifact access, signed URLs, public artifacts, beta unlock, production unlock, and final delivery remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
