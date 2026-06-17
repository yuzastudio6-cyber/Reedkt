# AI Graphics Local Fixture Scoped Manifest Template

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

Future scoped manifest fixtures must remain placeholder-only and include:

- `manifestId`: `<SCOPED_TOOL_CALL_MANIFEST_ID>`
- `planSnapshotId`: `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`
- `toolRouteOwner`: `TOOL_ROUTE_EXECUTION`
- `sourceOwner`: `AI_TOOLS_CREATIVE_GRAPHICS`
- `toolId`: one of the 13 accepted AI graphics tool names
- `capabilityId`: accepted owner/capability id from the inventory
- `routeRef`: placeholder metadata route ref only
- `privateArtifactRef`: `<PRIVATE_ARTIFACT_MANIFEST_REF>`
- `checksumRef`: `<CHECKSUM_PLACEHOLDER>`
- `qaRef`, `observabilityRef`, `cleanupRef`, and `workerHandoffRef`
- `blockedUses`: runtime, route/tool/worker/provider execution, browser/WebGL/canvas, render/export, rasterization, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production

The scoped manifest template is a planning contract. It is not an execution request and must not include raw prompt text, real URLs, signed URLs, public artifact paths, provider raw output, user media, or executable instructions.
