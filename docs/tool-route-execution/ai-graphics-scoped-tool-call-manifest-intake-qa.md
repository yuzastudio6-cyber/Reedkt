# AI Graphics Scoped Tool-Call Manifest Intake QA

Decision: `tool_route_ai_graphics_metadata_integration_qa_passed_with_warnings`

## QA Findings

The PR #456 manifest intake contract is accepted with warnings. It requires placeholder-only `manifestId`, approved plan snapshot refs, Tool Route metadata refs, owner proof refs, package refs, capability refs, route refs, private artifact scopes, checksum refs, QA refs, observability refs, worker handoff refs, and blocked-use lists.

## Accepted Conditions

- `approvedPlanSnapshotRef` is required before any later fixture planning.
- `scopedToolCallManifestRef` is required before any later Tool Route execution-style gate.
- Tool packages must be limited to the 13 accepted AI graphics tools.
- Manifest rows must remain metadata/manifest-only.
- Public artifact paths, signed URLs, raw prompts, provider outputs, generated render outputs, and executable route/tool/worker/provider instructions are rejected.

## QA Warning

The contract is ready for local fixture planning, not route execution. Future fixture planning must continue to use placeholders only and must not import tool runtimes.
