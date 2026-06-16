# TRACKA-CAPTION-QUALITY-2 Future Remotion Preview Planning

Status: `future_only_blocked`

## Purpose

Plan how a future Remotion preview should consume the corrected controlled-test caption source after a separate execution packet exists. This phase does not run Remotion, browser capture, media processing, or final render/export.

## Future Preview Inputs

- `captionSourceType: controlled_test_caption_copy`
- approved four-line #426 caption copy
- future sidecar or caption manifest checksum
- future private preview asset manifest
- timing placeholders or approved controlled-test timing records
- private review QA record

## Future Preview QA

| Gate | Expected Result |
| --- | --- |
| text accuracy | preview contains only corrected #426 text |
| readability | captions remain readable in the selected review frame |
| safe zones | captions avoid faces, masks, products, charts, maps, browser labels, and key evidence |
| motion restraint | caption motion does not distract from visual evidence |
| source truth | preview is a review artifact only; manifest and checksums remain source of truth |
| scope | no production, external beta, final delivery, public artifact, or signed URL approval |

## Current Blockers

- corrected-caption visual burn-in has not run.
- Remotion execution remains blocked.
- private E2E remains blocked pending caption burn-in revalidation execution and scope decision.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
