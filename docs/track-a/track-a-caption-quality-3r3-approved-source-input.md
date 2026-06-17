# TRACKA-CAPTION-QUALITY-3R3 Approved Source Input

Status: `approved`

sourceRefApproved: true

approvedSourceRef: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

metadataEvidencePath: `docs/activation-phase-tracka-caption-source-ref-1-results.md`

sourceLocalCopyPath: `not_created`

sourceLocalCopySha256: `not_created`

sourceLocalCopySizeBytes: `not_created`

## #452 Metadata

| Field | Value |
| --- | --- |
| `size` | `94522751` |
| `contentType` | `video/mp4` |
| `generation` | `1779975269726662` |
| `metageneration` | `1` |
| `storageClass` | `STANDARD` |
| `updated` | `2026-05-28T13:34:29Z` |
| `crc32c` | `/HiYtQ==` |
| `md5` | `3QrjneF4xbmU8d/OlswU+Q==` |

## GCS Metadata Check

| Field | Value |
| --- | --- |
| confirmationProvided | `true` |
| metadataCheckExecuted | `true` |
| status | `blocked_gcloud_auth_refresh_required` |
| approvedSourceRef | `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4` |
| objectMetadataMatched | `false` |
| gcloudAccount | `aiediting@reeditpro.com` |
| gcloudProject | `reeditpro` |
| activeAccount | `aiediting@reeditpro.com` |
| detail | `ERROR: (gcloud.storage.ls) There was a problem refreshing your current auth tokens: Reauthentication failed. cannot prompt during non-interactive execution. Please run: $ gcloud auth login to obtain new credentials. If you have already logged in with a different account, run: $ gcloud config set account ACCOUNT to select an already authenticated account to use.` |

## Source Rules

- exact private `gs://` object only.
- exact metadata/copy checks require `REEDITPRO_CONFIRM_TRACKA_CAPTION_GCS_ACCESS_REPAIR=true`.
- no public URL.
- no signed URL.
- no prefix-only ref.
- no local review artifact as source.
- no old-caption-burned output as source.
- no arbitrary user media claim.
- no final delivery source-of-truth claim.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
