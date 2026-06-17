# TRACKA-CAPTION-QUALITY-3R2 Upload-To-Chat Instructions

Status: `blocked_pending_review_safe_visual_artifact`

No corrected-caption preview file is available for upload.

## Human Action Required

Do not upload the ASS/JSON files as proof of visual burn-in. They prove the corrected caption contract and fail-closed execution only. A future guarded run must create a corrected-caption preview before TRACKA-CAPTION-QUALITY-4 can record visual outcome.

Do not upload signed URLs, public artifacts, production files, or final delivery exports as source of truth.

## Current Local Files

| File | Upload? | Reason |
| --- | --- | --- |
| corrected ASS sidecar | optional metadata only | proves corrected caption source, but does not prove visual burn-in |
| QA report JSON | optional metadata only | records gate status and blocker |
| artifact manifest JSON | optional metadata only | records no visual artifact was created |
| corrected-caption preview | no | not_created |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation was allowed only with REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true, using the approved #452 private source ref, and producing private review artifacts only.
