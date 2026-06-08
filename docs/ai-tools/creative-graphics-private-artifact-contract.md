# Creative Graphics Private Artifact Contract

Status: `manifest_draft`

## Contract

Creative graphics artifacts remain private until future delivery policy, retention/delete controls, user approval, abuse controls, visibility rules, QA gates, and Track A validation exist.

Required source of truth:

- Supabase artifact row placeholder
- Private GCS path placeholder
- Artifact manifest
- Checksum placeholder
- Approved plan snapshot placeholder

Signed URLs are not source of truth. They may only become temporary review/delivery links in a future approved policy. GD-1 creates no signed URLs and no public artifacts.

## Required Handoff Fields

- `artifactId`
- `artifactType`
- `privateGcsPathPlaceholder`
- `checksumPlaceholder`
- `dimensions`
- `durationFrames` when temporal
- `fps` when temporal
- `alphaSupport`
- `safeZone`
- `timingContext`
- `approvedPlanSnapshotId`
- `qaStatus`
- `blockedUses`

## QA Evidence Fields

- manifest completeness
- checksum/provenance placeholder
- source-of-truth completeness
- typography/readability
- alpha/transparency
- safe-zone compliance
- Track A compatibility
- blocked-use compliance

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
