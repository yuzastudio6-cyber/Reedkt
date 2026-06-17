# TRACKA-CAPTION-SOURCE-REF-1 Approved Private Controlled-Test Source Ref Resolution

Status: `approved`

Patch type: Track A approved private controlled-test source ref resolution.

Branch: `codex/rp-tracka-caption-source-ref-1-approved-private-source`

Base: `ce4b2feac22247581ba361e71df33feb1e667507`

Run ID: `tracka-caption-source-ref-1r-20260617T145432`

## Purpose

TRACKA-CAPTION-QUALITY-3R created a corrected ASS sidecar from the approved #426 controlled-test caption copy, then failed closed before burn-in because no clean approved private controlled-test source ref was recorded.

This packet resolves the source-ref contract only. It records the preferred candidate, rejects unsafe source candidates, and records an exact metadata/stat result for the preferred candidate when explicitly confirmed.

## Source-Of-Truth Audit

| Source | Status | Evidence |
| --- | --- | --- |
| #447 | merged at `ce4b2feac22247581ba361e71df33feb1e667507` | records `blocked_missing_approved_private_source_ref` |
| #443 | merged | guarded burn-in packet ready for 3R |
| #426 | merged | approved controlled-test caption copy; `transcriptAccuracyClaim: false` |
| #429 | merged | missing visual evidence bundle; review artifacts only |
| #434 | merged | missing visual evidence review outcome; partial pass with warnings |
| #67, #75, #77, #80, #82 | historical/open evidence | cite the approved Phase 32 private source/export ref |

## Source Ref Resolution

approvedPrivateSourceRefStatus: `approved`

selectedCandidate: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

preferredCandidate: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

metadataConfirmationRequired: `REEDITPRO_CONFIRM_TRACKA_CAPTION_SOURCE_REF_CHECK=true`

metadataConfirmationCurrentState: `true`

metadataCheckExecuted: true

gcsAccess: `metadata_stat_only`

gcloudExecuted: true

sourceRefApproved: true

blocker: `none`

## Metadata Summary

| field | value |
| --- | --- |
| objectUri | `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4` |
| size | `94522751` |
| contentType | `video/mp4` |
| generation | `1779975269726662` |
| metageneration | `1` |
| storageClass | `STANDARD` |
| updated | `2026-05-28T13:34:29Z` |
| crc32c | `/HiYtQ==` |
| md5 | `3QrjneF4xbmU8d/OlswU+Q==` |

## Requirements

- exact private `gs://` object ref.
- controlled Track A sample source.
- not public.
- not a signed URL.
- not final delivery source-of-truth.
- not arbitrary user media.
- not old-caption-burned output if used as caption source.
- suitable for future corrected-caption private revalidation.
- bounded size and duration.
- provenance recorded.
- checksum status known or future-required.

## Decision

The Phase 32 color-corrected private export is the preferred candidate because it is repeatedly cited as the approved Phase 32 source in #67, #75, #77, #80, and #82.

TRACKA-CAPTION-QUALITY-3R2 readiness: `ready_for_guarded_execution_with_approved_private_source_ref`

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

Internal beta readiness: `blocked_pending_caption_burnin_visual_review_and_scope_decision`

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
