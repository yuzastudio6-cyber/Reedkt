# AI_TOOLS_CREATIVE_GRAPHICS Scoped Tool-Call Manifest Shape

Decision: `approved_with_warnings_for_ai_graphics_route_manifest_integration`

## Required Shape

Future AI graphics scoped tool-call manifests must remain metadata-only and include:

- `scopedToolCallManifestId`: placeholder identifier, never a runtime job id.
- `planSnapshotId`: approved plan snapshot reference.
- `ownerId`: `AI_TOOLS_CREATIVE_GRAPHICS`.
- `capabilityId`: one of the approved Batch 1-3 capability ids.
- `toolId`: one accepted tool from the route eligibility matrix.
- `routeId`: placeholder route metadata id, not an executable route.
- `proofBatch`: Batch 1, Batch 2, or Batch 3.
- `proofStatus`: accepted with warnings source decision.
- `inputArtifactScopeRef`: private metadata placeholder.
- `outputArtifactScopeRef`: private metadata placeholder.
- `checksumRef`: placeholder checksum reference.
- `qaEvidenceRef`: placeholder QA requirement reference.
- `observabilityEvidenceRef`: placeholder observability requirement reference.
- `blockedUses`: runtime/tool/route/worker/provider/browser/WebGL/canvas/render/export/Supabase/GCS/public/signed URL/beta/production blocks.
- `failureBehavior`: `fail_closed_return_blocked_reason_never_fallback_to_raw_execution`.

## Consumer Policy

The manifest is a contract for future route metadata integration. It is not a command, raw prompt, runtime payload, provider prompt, worker payload, or artifact delivery mechanism.

No route execution, actual tool execution, worker execution, provider/model call, browser/WebGL/canvas runtime, Remotion render/export, resvg rasterization, Supabase mutation, GCS/storage transfer, signed URL creation, public artifact creation, beta unlock, or production unlock was enabled.
