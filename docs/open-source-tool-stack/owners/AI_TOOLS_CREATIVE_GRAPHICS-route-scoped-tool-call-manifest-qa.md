# AI_TOOLS_CREATIVE_GRAPHICS Route Scoped Tool-Call Manifest QA

Decision: `ai_graphics_route_manifest_integration_qa_passed_with_warnings`

## Reviewed Shape

The PR #451 scoped tool-call manifest shape is accepted with warnings because it requires:

- `scopedToolCallManifestId` placeholder, not a runtime job id.
- `planSnapshotId` approved plan snapshot reference.
- `ownerId`: `AI_TOOLS_CREATIVE_GRAPHICS`.
- `capabilityId`, `toolId`, `routeId`, `proofBatch`, and `proofStatus` fields derived from the QA acceptance matrix.
- private `inputArtifactScopeRef` and `outputArtifactScopeRef` placeholders.
- `checksumRef`, `qaEvidenceRef`, and `observabilityEvidenceRef` placeholders.
- blocked uses for runtime, tool, route, worker, provider, browser, WebGL, canvas, render/export, Supabase, GCS, public/signed URL, beta, and production paths.
- `failureBehavior`: `fail_closed_return_blocked_reason_never_fallback_to_raw_execution`.

## QA Finding

The shape is suitable for a future Tool Route metadata integration approval. It does not contain raw prompts, provider prompts, executable route ids, worker payloads, live storage paths, signed URLs, public URLs, or runtime commands.

No route execution, actual tool execution, worker execution, provider/model call, browser/WebGL/canvas runtime, Remotion render/export, resvg rasterization, Supabase mutation, GCS/storage transfer, signed URL creation, public artifact creation, beta unlock, or production unlock was enabled.
