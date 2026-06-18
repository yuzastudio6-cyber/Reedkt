# TRACKA-CAPTION-QUALITY-5 Upload-To-Chat Instructions

Status: `ready_after_upload_of_layout_fixed_caption_preview`

## Upload Candidate Files

| File | Upload? | Reason |
| --- | --- | --- |
| `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-layout-fixed-caption-preview.mp4` | yes | caption layout visual review artifact |
| `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-ffprobe.json` | optional metadata | validates private preview container/streams |
| `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-qa-report.json` | optional metadata | records QA gate status |
| `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-artifact-manifest.json` | optional metadata | records checksums and provenance |
| `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-layout-fixed-caption.ass` | optional metadata | proves approved corrected caption text |
| `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-approved-source.mp4` | no | approved private source input, not review output |

Do not upload signed URLs, public artifacts, production files, final delivery exports, or unrelated source media as source of truth.

## Preview Status

correctedCaptionPreview: `created`

previewSha256: `150dc68a935c90083f49f6ad329a073c4d1d14dc216c20fe0bb05aa764add02a`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A caption layout fix revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
