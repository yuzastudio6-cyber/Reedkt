# TRACKA-CAPTION-QUALITY-3R3 Upload-To-Chat Instructions

Status: `blocked_pending_review_safe_visual_artifact`

## Upload Candidate Files

| File | Upload? | Reason |
| --- | --- | --- |
| `not_created` | no | corrected-caption visual review artifact |
| `not_created` | optional metadata | validates private preview container/streams |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-20260617T214049/tracka-caption-quality-3r3-qa-report.json` | optional metadata | records QA gate status |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-20260617T214049/tracka-caption-quality-3r3-artifact-manifest.json` | optional metadata | records checksums and provenance |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-20260617T214049/tracka-caption-quality-3r3-corrected-caption.ass` | optional metadata | proves approved corrected caption text |
| `not_created` | no | approved private source input, not review output |

Do not upload signed URLs, public artifacts, production files, final delivery exports, or unrelated source media as source of truth.

## Preview Status

correctedCaptionPreview: `blocked_approved_source_ref_access_failed`

previewSha256: `not_created`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
