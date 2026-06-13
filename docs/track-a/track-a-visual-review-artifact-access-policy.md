# Track A Visual Review Artifact Access Policy

Status: `guarded_private_access_policy`

This policy governs the optional local bundle path for TRACKA-VISUAL-REVIEW-ARTIFACT-BUNDLE-1.

## Default Mode

Default mode is manifest-only.

- no `gcloud` call
- no GCS metadata read
- no GCS object copy
- no local media bundle
- no signed URL
- no public artifact
- no visual review pass/fail outcome

Default mode reports `blocked_pending_private_artifact_access_confirmation_or_uploaded_frames`.

## Confirmed Bounded Mode

Confirmed bounded mode requires both:

- `--execute`
- `REEDITPRO_CONFIRM_TRACKA_PRIVATE_ARTIFACT_BUNDLE=true`

Allowed operations in confirmed bounded mode:

- read committed docs to build the allowlist
- reject unsafe refs before any external command
- run `gcloud storage ls -L` only for exact allowlisted `gs://` object refs
- run `gcloud storage cp` only for exact allowlisted small review artifacts
- copy to `/tmp/reeditpro-tracka-visual-review-bundle/<bundleId>/`
- compute SHA-256 checksums for copied files
- write local, untracked upload instructions in the temp bundle

## Rejected Refs And Operations

- wildcard refs
- prefix-wide refs, including `gs://.../phase45b-20260531T19552/`
- `artifact_ref_not_recorded_in_current_source`
- public URLs
- signed URLs
- refs not sourced from #390, #393, or #396 docs
- GCS uploads
- storage transfer
- bucket mutation
- IAM mutation
- deletion
- object rewrite
- metadata mutation
- media processing, conversion, extraction, rendering, or preview generation

## Size Policy

The bundle should prefer still frames, contact sheets, QA JSON, and manifest JSON. Large full videos or exports should not be copied unless a later prompt explicitly approves an exact object and size cap. Large or prefix-only refs must be recorded as `needs_manual_private_review_or_smaller_sample`.

## Source-Of-Truth Rule

The source of truth remains committed private refs, structured manifests, checksums, and review outcomes. Signed URLs, public artifacts, raw prompts, raw provider responses, broad prefixes, temporary local copies, and unreviewed media are not source-of-truth.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. If executed with confirmation, only bounded private GCS metadata/read access for explicit Track A review artifact refs was allowed.
