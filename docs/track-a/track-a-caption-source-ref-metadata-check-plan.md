# TRACKA-CAPTION-SOURCE-REF-1 Metadata Check Plan

Status: `blocked_pending_metadata_confirmation`

metadataConfirmationCurrentState: `absent_or_not_true`

gcsAccess: false

metadataCheckExecuted: false

## Current Run

This run did not call `gcloud`, access GCS, stat objects, list prefixes, copy objects, download objects, create signed URLs, or mutate buckets.

## Future Confirmed Check

If a later run explicitly sets `REEDITPRO_CONFIRM_TRACKA_CAPTION_SOURCE_REF_CHECK=true`, the check may stat only exact candidate object refs already recorded in this packet.

Allowed future operation:

```bash
gcloud storage ls -L gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4
```

Blocked future operations:

- no `gcloud storage cp`.
- no download.
- no upload.
- no signed URL creation.
- no object mutation.
- no IAM mutation.
- no bucket-wide listing.
- no broad prefix listing.
- no public URL usage.
- no media processing.

## Expected Metadata Fields

- exact object URI.
- generation/metageneration if available.
- content type.
- object size.
- updated timestamp.
- md5 or crc32c if available.
- storage class if available.
- privacy boundary from bucket/object metadata.
- duration remains future-required unless an approved metadata-only extractor is separately authorized.

## Outcomes

| condition | result |
| --- | --- |
| confirmation absent | `blocked_pending_metadata_confirmation` |
| exact candidate stat passes | `approved` |
| exact candidate missing, inaccessible, public, signed-only, too broad, or not clean source | `blocked_no_clean_source_ref` |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
