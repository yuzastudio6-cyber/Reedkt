# TRACKA-CAPTION-QUALITY-3R3 Upload-To-Chat Instructions

Status: `ready_after_upload_of_corrected_caption_preview`

## Upload Candidate Files

| File | Upload? | Reason |
| --- | --- | --- |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-corrected-caption-preview.mp4` | yes | corrected-caption visual review artifact |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-ffprobe.json` | optional metadata | validates private preview container/streams |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-qa-report.json` | optional metadata | records QA gate status |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-artifact-manifest.json` | optional metadata | records checksums and provenance |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-corrected-caption.ass` | optional metadata | proves approved corrected caption text |
| `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-approved-source.mp4` | no | approved private source input, not review output |

Do not upload signed URLs, public artifacts, production files, final delivery exports, or unrelated source media as source of truth.

## Preview Status

correctedCaptionPreview: `created`

previewSha256: `ad3557848ae1b23d6767b99a6e27ffa40bdd4ba5bb47c15a13c1e0f74e1b947b`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
