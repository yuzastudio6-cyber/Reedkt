# TRACKA-CAPTION-QUALITY-2 Future Libass Burn-In Planning

Status: `future_only_blocked`

## Purpose

Define the future libass burn-in review plan for corrected controlled-test captions. This packet does not execute libass, FFmpeg, FFprobe, media processing, render/export, or private E2E paths.

## Required Future Inputs

- approved caption source from #426
- future ASS sidecar manifest and checksum
- private review-safe source clip or approved controlled test input
- owner-approved execution packet from TRACKA-CAPTION-QUALITY-3
- runtime and worker gates that remain absent in this phase

## Future Review Criteria

| Gate | Criteria |
| --- | --- |
| corrected text | rendered captions match the four #426 lines exactly |
| old text rejection | old awkward preview text is absent |
| readability | text is readable at target review size and does not flicker |
| timing compatibility | timing is plausible for controlled-test review, without claiming transcript accuracy |
| visual collision | captions avoid faces, products, masks, charts, maps, browser labels, and key evidence |
| privacy | private review artifacts only, no public artifacts or signed URL source-of-truth |
| provenance | output links to source caption id, sidecar checksum, and approved review manifest |

## Readiness

TRACKA-CAPTION-QUALITY-3 readiness: ready_for_burnin_revalidation_execution_packet

The future libass burn-in execution packet may be drafted next, but libass execution remains blocked until that later packet is separately approved.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
