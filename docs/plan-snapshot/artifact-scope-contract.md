# Artifact Scope Contract

Status: `ready_for_owner_review`.

This contract defines artifact references for a future approved snapshot. It does not upload, move, publish, sign, or fetch artifacts.

## Source Of Truth

Signed URLs must not become source of truth.

The future artifact source of truth is exactly:

`Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

## Required Artifact Fields

Future snapshots should include:

- `artifactScopes`
- `privateArtifactManifestRefs`
- `checksumRequirements`
- `SupabaseRecordPlaceholders`
- `GcsPrivatePathPlaceholders`
- `sourceOfTruthPolicy`
- `artifactRetentionPolicy`
- `cleanupRollbackRequirements`

## MODEL-DRYRUN-2A Reconciliation

MODEL-DRYRUN-2A records `privateArtifactUploadStatus: uploaded`. PLAN-SNAPSHOT-0 treats that as prior approved dry-run evidence only.

PLAN-SNAPSHOT-0 does not perform storage transfer, does not upload private artifacts, does not generate a signed URL, does not create a public artifact, and does not mutate Supabase. Future prompts must re-check artifact ownership, manifest references, checksums, cleanup scope, and owner approval before using any private artifact path.

## Blocked Uses

- signed URL as source of truth
- public artifact creation
- unapproved storage transfer
- Supabase mutation
- SQL execution
- private URL commit
- raw provider response commit
- beta or production unlock

No Secret Manager payloads, raw provider responses, raw prompts, private URLs, signed URLs, public artifacts, provider calls, worker execution, tool execution, route execution, Supabase mutation, SQL execution, storage transfer, beta unlock, or production unlock were enabled.
