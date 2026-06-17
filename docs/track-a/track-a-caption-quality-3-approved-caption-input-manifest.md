# TRACKA-CAPTION-QUALITY-3 Approved Caption Input Manifest

Status: `approved_input_manifest_for_guarded_revalidation`

## Manifest

| Field | Value |
| --- | --- |
| `captionSourceId` | `tracka-caption-quality-1-controlled-test-copy` |
| `captionSourceType` | `controlled_test_caption_copy` |
| `transcriptAccuracyClaim` | `false` |
| `captionTextQualityForControlledTest` | `pass` |
| `captionVisualBurnInRevalidationRequired` | `true` |
| `sourcePR` | #426 |
| `sourceMergeSha` | `58a3f87a6fc07e3afc6fb699c40c8b744cc75eab` |
| `planningPR` | #440 |
| `planningMergeSha` | `ea238ad8ffc28c277ea36ba66b8488cb37cf66cc` |
| `futureConfirmationEnv` | `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true` |

## Corrected Caption Lines

1. "Hey everyone — welcome to this ReEditPro visual review."
2. "Today we are testing captions, overlays, and private render quality."
3. "The goal is a clean, professional edit with readable text."
4. "Review this sample for timing, polish, and visual clarity."

## Rejected Caption Text

Old awkward #419 preview caption text is rejected and not reused: "Hey guys, I saw how you guys doing today is going to do going to be the first".

## Future Checksum Requirements

- future ASS sidecar checksum required.
- future rendered preview checksum required.
- future private review artifact checksum required.
- source caption manifest checksum required before private E2E handoff.

## Allowed Use

Track A corrected-caption private revalidation only.

## Blocked Use

Production captions, arbitrary user captions, transcript accuracy claims, public captions, external beta captions, final delivery captions, signed URL source-of-truth, public artifacts, and raw prompts are blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Track A caption burn-in runtime execution remains blocked unless explicitly confirmed with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true.
