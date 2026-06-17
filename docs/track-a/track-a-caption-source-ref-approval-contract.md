# TRACKA-CAPTION-SOURCE-REF-1 Approval Contract

Status: `approved`

## Contract

An approved private controlled-test source ref for corrected-caption burn-in revalidation must satisfy all gates below.

| gate | required value | current status |
| --- | --- | --- |
| exact ref | exact private `gs://` object ref | passed |
| provenance | controlled Track A sample source | candidate provenance recorded from #67/#75/#77/#80/#82 |
| privacy | not public and not signed URL | public and signed URL forms rejected; exact private `gs://` candidate only |
| source type | clean source video, not review artifact | Phase 32 source candidate selected; old-caption outputs rejected |
| old caption exclusion | not old-caption-burned output | candidate passes by evidence review; rejected previews remain excluded |
| final delivery boundary | not final delivery source-of-truth | candidate treated as private controlled-test source only |
| arbitrary media boundary | not arbitrary user media | candidate treated as controlled Track A sample only |
| size and duration | bounded for future private revalidation | metadata size recorded as `94522751` |
| checksum | known or future-required | metadata hash recorded when reported by storage |

## Preferred Candidate

candidateId: `phase32_color_corrected_source_export`

sourceRef: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

approvalStatus: `approved`

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

## Downstream Contract

TRACKA-CAPTION-QUALITY-3R2 may consume only an approved candidate that passes this contract. TRACKA-CAPTION-QUALITY-3R2 must still run guarded corrected-caption burn-in revalidation separately and must not infer burn-in success from this packet.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
