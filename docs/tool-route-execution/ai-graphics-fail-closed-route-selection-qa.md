# AI Graphics Fail-Closed Route Selection QA

Decision: `tool_route_ai_graphics_metadata_integration_qa_passed_with_warnings`

## QA Findings

The PR #456 fail-closed policy is accepted with warnings. Tool Route must return a blocked reason instead of falling back to raw execution whenever approved snapshot, scoped manifest, owner proof, metadata route, artifact scope, checksum, QA, or handoff evidence is missing.

## Required Blocked Reasons

- `blocked_missing_approved_plan_snapshot`
- `blocked_missing_scoped_tool_call_manifest`
- `blocked_missing_ai_graphics_owner_proof`
- `blocked_missing_private_artifact_scope`
- `blocked_missing_checksum_or_qa_ref`
- `blocked_ambiguous_ai_graphics_route`
- `blocked_runtime_execution_requested`
- `blocked_public_or_signed_url_artifact`
- `blocked_supabase_or_gcs_mutation_requested`

## QA Warning

Route selection is metadata planning only. The selector must not infer an executable route from package names, user text, raw prompts, model outputs, provider responses, or public artifact URLs.
