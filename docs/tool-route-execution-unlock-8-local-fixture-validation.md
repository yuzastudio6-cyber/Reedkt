# TOOL-ROUTE-EXECUTION-UNLOCK-8 Local Fixture Validation

## Summary

TOOL-ROUTE-EXECUTION-UNLOCK-8 validates the metadata-only local fixture plan merged in PR #404. The decision is `tool_route_local_fixture_validation_passed_with_warnings_ready_for_owner_approval`.

This packet validates fixture files, coverage, schema/scoring metadata, blocked cases, and owner handoffs as repository metadata only. It does not execute fixtures, tools, routes, workers, providers, media, browser capture, map rendering, Supabase writes, SQL, migrations, Docker, Cloud Run, signed URL creation, public artifact creation, credit mutation, beta unlock, production unlock, raw prompt execution, or final render/export.

## Source Verification

The accepted source chain is:

- PR #404 local fixture plan: `tool_route_local_fixture_plan_ready_with_warnings`.
- PR #398 dry-run pass review: `tool_route_dry_run_pass_review_recorded_with_warnings_ready_for_local_fixture_planning`.
- PR #392 gate status: `tool_route_dry_run_gate_status_recorded_with_warnings_ready_for_dry_run_pass_review`.
- PR #385 owner approval: `tool_route_owner_approved_with_warnings_for_next_dry_run_gate`.
- PR #381 dry-run validation: `tool_route_dry_run_validation_passed_with_warnings_ready_for_owner_approval`.
- PR #377 dry-run contract: `tool_route_dry_run_contract_ready_with_warnings`.
- PR #374 dry-run plan: `tool_route_dry_run_plan_ready_with_warnings`.
- PR #369 repo audit: `tool_route_repo_audit_passed_with_warnings_ready_for_dry_run_plan`.
- PR #360 pending owner studies: `tool_study_pending_owners_completed_ready_for_tool_route_execution_unlock_audit`.

Completed Web Search Capture and Map Geospatial studies are referenced only and not duplicated.

## Fixture Validation

The validation accepts the existing UNLOCK-2 dry-run contract fixture scope:

- 18 synthetic cases.
- 10 metadata-accepted fixtures.
- 8 fail-closed fixtures.
- Request/result schema metadata.
- Candidate capability, tool, and route metadata.
- Scoring policy metadata.
- Manifest and checksum metadata.
- Owner handoff metadata.

Valid fixtures are accepted only as metadata. Invalid fixtures remain fail-closed for raw prompt, signed URL source-of-truth, public artifact, tool runtime, route runtime, provider runtime, worker runtime, and Supabase mutation requests.

## Runtime Gates

The following remain blocked: tool execution, route execution, worker execution, job dispatch, job claim and lease mutation, provider and model calls, Supabase writes, SQL, migrations, storage writes, signed URLs, public artifacts, media processing, browser capture, map rendering, Docker, Cloud Run, Cloud Build, credits, Stripe, beta, production, Demucs, Track A runtime, and Track B media runtime.

`dryRunPassedClaimed` remains `false`.

`generatedLocalFixturePassedClaimed` remains `false`.

## Next Prompt

`TOOL-ROUTE-EXECUTION-UNLOCK-9: owner approval for tool-route local fixture gate, no execution`

## Validation Notes

Built-ins-only UNLOCK-8 diagnostics, report, and summary pass. Dependency-backed checks require local `node_modules`; this implementation prompt did not approve dependency hydration, so `tsx`, lint, typecheck, build, and readiness-summary commands remain blocked by the local dependency state rather than by the UNLOCK-8 packet.
