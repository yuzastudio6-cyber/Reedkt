# TRACKA-CAPTION-QUALITY-3R2 — Burn-In Revalidation Execution With Approved Private Source Ref

## Summary

Run this prompt only after TRACKA-CAPTION-SOURCE-REF-1 records an approved private controlled-test source ref. If source ref status is still `blocked_pending_metadata_confirmation`, `blocked_access_denied`, `blocked_missing_exact_object`, `blocked_metadata_check_failed`, or `blocked_no_clean_source_ref`, stop and report the blocker.

## Required Inputs

- Approved private source ref from TRACKA-CAPTION-SOURCE-REF-1.
- #426 approved controlled-test caption copy.
- #447 corrected ASS sidecar evidence and fail-closed execution result.
- Metadata confirmation evidence for the source ref.

## Approved Source Ref Status

approvedPrivateSourceRefStatus: `approved`

selectedCandidate: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

sourceRefApproved: true

TRACKA-CAPTION-QUALITY-3R2 readiness: `ready_for_guarded_execution_with_approved_private_source_ref`

## Execution Boundary

TRACKA-CAPTION-QUALITY-3R2 may run guarded corrected-caption burn-in only after a separate explicit confirmation is provided. It must not use old-caption-burned outputs as source inputs.

Blocked unless explicitly confirmed:

- libass execution.
- FFmpeg/FFprobe execution.
- Remotion execution.
- Track A runtime.
- GCS read/copy/download.
- signed URLs.
- public artifacts.
- Supabase mutation.
- SQL.
- internal beta.
- external beta.
- production.
- final delivery.

## Source Ref Rules

The source ref must be exact, private, controlled Track A provenance, not public, not signed, not arbitrary user media, not old-caption-burned output, and suitable for corrected-caption private revalidation.

Preferred candidate from TRACKA-CAPTION-SOURCE-REF-1:

`gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
