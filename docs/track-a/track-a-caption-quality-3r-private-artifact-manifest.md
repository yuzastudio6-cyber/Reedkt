# TRACKA-CAPTION-QUALITY-3R Private Artifact Manifest

Status: `blocked_missing_approved_private_source_ref`

## Local Bundle

localBundlePath: `/tmp/reeditpro-tracka-caption-quality-3r/tracka-caption-quality-3r-20260617T020429`

privateArtifactsCreated: true

privateVisualArtifactsCreated: false

gcsAccess: false

signedUrlsCreated: false

publicArtifactsCreated: false

## Artifacts

| Artifact | Path | SHA-256 | Status |
| --- | --- | --- | --- |
| corrected ASS sidecar | `/tmp/reeditpro-tracka-caption-quality-3r/tracka-caption-quality-3r-20260617T020429/tracka-caption-quality-3r-corrected-caption.ass` | `d378e153fe621ec42e77ed5dfe0534622466342a8b3a1171c7185c44feb8bbaa` | `created` |
| corrected-caption preview | none | none | blocked_missing_approved_private_source_ref |
| FFprobe metadata JSON | none | none | not_run_source_ref_blocked |
| QA report JSON | `/tmp/reeditpro-tracka-caption-quality-3r/tracka-caption-quality-3r-20260617T020429/tracka-caption-quality-3r-qa-report.json` | recorded locally if execution command ran | metadata_only |

## Blocker

`blocked_missing_approved_private_source_ref`: Merged evidence contains old-caption visual samples and private review artifacts, but no clean approved private controlled-test source ref for corrected-caption burn-in.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation was allowed only when REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true and only for private review artifacts.
