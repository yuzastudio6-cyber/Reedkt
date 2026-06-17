# AI Graphics Fail-Closed Route Selection Policy

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

## Fail-Closed Conditions

Tool Route must return a blocked reason and must not fallback to raw execution when any of the following are missing or unsafe:

- approved plan snapshot placeholder;
- scoped tool-call manifest placeholder;
- owner proof reference for the selected AI graphics tool;
- metadata route id;
- blocked-use list;
- private artifact manifest placeholder;
- checksum and QA placeholders;
- worker handoff placeholder;
- route capability mapping;
- artifact source-of-truth boundary.

## Blocked Reason Classes

- `blocked_missing_approved_plan_snapshot`
- `blocked_missing_scoped_tool_call_manifest`
- `blocked_missing_ai_graphics_owner_proof`
- `blocked_missing_private_artifact_scope`
- `blocked_missing_checksum_or_qa_ref`
- `blocked_ambiguous_ai_graphics_route`
- `blocked_runtime_execution_requested`
- `blocked_public_or_signed_url_artifact`
- `blocked_supabase_or_gcs_mutation_requested`

The route selector must not infer an executable route from package names, user text, raw prompts, model outputs, provider responses, or public artifact URLs.
