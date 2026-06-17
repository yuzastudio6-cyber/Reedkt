# TRACKA-CAPTION-SOURCE-REF-1 Approval Contract

Status: `blocked_pending_metadata_confirmation`

## Contract

An approved private controlled-test source ref for corrected-caption burn-in revalidation must satisfy all gates below.

| gate | required value | current status |
| --- | --- | --- |
| exact ref | exact private `gs://` object ref | candidate recorded |
| provenance | controlled Track A sample source | candidate provenance recorded from #67/#75/#77/#80/#82 |
| privacy | not public and not signed URL | pending metadata confirmation |
| source type | clean source video, not review artifact | pending metadata confirmation |
| old caption exclusion | not old-caption-burned output | candidate passes by evidence review, pending metadata confirmation |
| final delivery boundary | not final delivery source-of-truth | candidate treated as private controlled-test source only |
| arbitrary media boundary | not arbitrary user media | candidate treated as controlled Track A sample only |
| size and duration | bounded for future private revalidation | pending metadata confirmation |
| checksum | known or future-required | future-required until metadata check |

## Preferred Candidate

candidateId: `phase32_color_corrected_source_export`

sourceRef: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

approvalStatus: `blocked_pending_metadata_confirmation`

## Blocked Until

Set `REEDITPRO_CONFIRM_TRACKA_CAPTION_SOURCE_REF_CHECK=true` in a later explicit run and perform metadata/stat only on the exact preferred candidate. Do not copy, download, list broad prefixes, create signed URLs, or mutate storage.

## Downstream Contract

TRACKA-CAPTION-QUALITY-3R2 may consume only an approved candidate that passes this contract. TRACKA-CAPTION-QUALITY-3R2 must still run guarded corrected-caption burn-in revalidation separately and must not infer burn-in success from this packet.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
