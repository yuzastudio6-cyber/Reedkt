# AI_TOOLS_CREATIVE_GRAPHICS Route Artifact Scope Policy

Decision: `approved_with_warnings_for_ai_graphics_route_manifest_integration`

## Required Artifact Fields

Future route artifact scope records must require:

- `privateArtifactRef`
- `checksumRef`
- `sourceEvidenceRef`
- `planSnapshotId`
- `scopedToolCallManifestId`
- `ownerId`
- `capabilityId`
- `routeId`
- `qaEvidenceRef`
- `observabilityEvidenceRef`
- `cleanupEvidenceRef`

## Rules

- Private artifact refs only.
- Public URLs are not allowed.
- Signed URLs are not source of truth.
- Raw prompt payloads are not allowed.
- Provider raw outputs are not allowed.
- Output artifacts remain placeholders until a later route/tool/worker owner gate explicitly approves execution and private artifact writing.
- Failure behavior is fail-closed if the requested tool, capability, owner, plan snapshot, route id, artifact scope, or checksum ref is missing or outside the approved matrix.

This policy follows PR #164 Track B private artifact and consumer policy context without duplicating Track B ownership.

No GCS upload, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL, route execution, tool execution, worker execution, or production unlock was enabled.
