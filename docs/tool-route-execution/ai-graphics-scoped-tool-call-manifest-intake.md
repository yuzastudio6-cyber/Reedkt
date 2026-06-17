# AI Graphics Scoped Tool-Call Manifest Intake

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

## Required Manifest Fields

Future scoped tool-call manifest intake for AI graphics metadata must include:

- `manifestId`: placeholder only.
- `approvedPlanSnapshotRef`: placeholder only.
- `toolRouteMetadataRef`: placeholder only.
- `ownerProofRef`: one of Batch 1, Batch 2, Batch 3, or route-manifest QA evidence refs.
- `toolPackageRef`: one of the 13 accepted tool package names.
- `capabilityRef`: approved metadata or manifest capability.
- `routeRef`: metadata route placeholder.
- `inputArtifactScope`: private placeholder only.
- `outputArtifactScope`: private placeholder only.
- `checksumRef`: placeholder only.
- `qaRef`: placeholder only.
- `observabilityRef`: placeholder only.
- `workerHandoffRef`: placeholder only.
- `blockedUses`: explicit list of runtime, route, tool, worker, provider, browser/WebGL/canvas, render/export, Supabase, GCS, signed URL, public artifact, beta, and production exclusions.

## Intake Rules

Tool Route must reject any manifest that contains raw prompts, real URLs, signed URLs, public artifact paths, user media, provider output, generated render output, or executable route/tool/worker/provider instructions. A valid scoped manifest is a planning contract, not an execution request.

The artifact source of truth remains approved plan snapshot plus scoped tool-call manifest plus private artifact manifest placeholder plus checksum placeholder. Signed URLs are not source of truth.
