# Track A Approved Caption Source

Status: `approved_for_controlled_test_copy_only`

## Caption Source Manifest

| Field | Value |
| --- | --- |
| `captionSourceId` | `tracka-caption-quality-1-controlled-test-copy` |
| `captionSourceType` | `controlled_test_caption_copy` |
| `sourceOfTruth` | `docs/track-a/track-a-approved-caption-source.md` |
| `transcriptAccuracyClaim` | false |
| `allowedUse` | controlled Track A private visual revalidation only |
| `blockedUse` | arbitrary user media transcript, production captions, external beta captions |
| `owner` | `TRACK_A_RENDER_EXPORT` |
| `downstreamConsumers` | libass burn-in future revalidation, Remotion preview future revalidation, Track A private E2E future revalidation |
| `QAStatus` | pass |
| `visualRevalidationRequired` | true |

## Approved Controlled-Test Caption Copy

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

## Source Rules

- The source is controlled test copy, not a verified audio transcript.
- The source does not certify transcript accuracy for any user media.
- The source is usable only for future private Track A burn-in and Remotion preview revalidation.
- The source must be passed downstream as structured caption text, not raw prompt text.
- Any future real-user transcription must be owned by Track B, Sound/Music/Audio, Provider Gateway, or Worker Runtime through a separately approved path.

## Rejected Previous Sample

Rejected sample: "Hey guys, I saw how you guys doing today is going to do going to be the first".

Rejection reason: awkward grammar, repeated filler, unclear phrase structure, and insufficient professional polish for internal beta caption evidence.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
