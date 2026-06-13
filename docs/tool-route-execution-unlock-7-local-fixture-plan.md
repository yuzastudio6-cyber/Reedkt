# TOOL-ROUTE-EXECUTION-UNLOCK-7 Local Fixture Plan

## Summary

TOOL-ROUTE-EXECUTION-UNLOCK-7 records a metadata-only local fixture plan after PR #398 merged the dry-run pass review. The decision is `tool_route_local_fixture_plan_ready_with_warnings`, which means the tool-route workstream is ready for a future local fixture validation packet, not runtime execution.

This packet does not execute fixtures, tools, routes, workers, providers, media, browser capture, map rendering, Supabase writes, SQL, migrations, Docker, Cloud Run, signed URL creation, public artifact creation, credit mutation, beta unlock, production unlock, or raw prompt execution.

## Source Verification

The plan accepts the merged source chain as metadata evidence:

- PR #398 dry-run pass review: `tool_route_dry_run_pass_review_recorded_with_warnings_ready_for_local_fixture_planning`.
- PR #392 gate status: `tool_route_dry_run_gate_status_recorded_with_warnings_ready_for_dry_run_pass_review`.
- PR #385 owner approval: `tool_route_owner_approved_with_warnings_for_next_dry_run_gate`.
- PR #381 dry-run validation: `tool_route_dry_run_validation_passed_with_warnings_ready_for_owner_approval`.
- PR #377 dry-run contract: `tool_route_dry_run_contract_ready_with_warnings`.
- PR #374 dry-run plan: `tool_route_dry_run_plan_ready_with_warnings`.
- PR #369 repo audit: `tool_route_repo_audit_passed_with_warnings_ready_for_dry_run_plan`.
- PR #360 pending owner studies: `tool_study_pending_owners_completed_ready_for_tool_route_execution_unlock_audit`.

Completed Web Search Capture and Map Geospatial studies are referenced only and not duplicated.

## Local Fixture Scope

The future local fixture validation should read the existing UNLOCK-2 dry-run contract fixtures and UNLOCK-3 validation evidence. The scope is 18 synthetic cases: 10 metadata-accepted fixtures and 8 fail-closed fixtures.

Validation should cover fixture presence, unique case identifiers, schema contracts, scoring policy, valid metadata acceptance, invalid fail-closed behavior, blocked raw prompt requests, blocked signed URL and public artifact requests, blocked runtime execution requests, owner handoffs, no-execution policy, and redaction scans.

## Source Of Truth

Future source of truth remains an approved plan snapshot plus private placeholder source references. Production source of truth remains blocked until the correct owner lanes approve Supabase row references, private GCS path references, manifests, and checksums.

Signed URLs and public artifact URLs are not source of truth.

## Runtime Gates

The following remain blocked: tool execution, route execution, worker execution, job dispatch, job claim and lease mutation, provider and model calls, Supabase writes, SQL, migrations, storage writes, signed URLs, public artifacts, media processing, browser capture, map rendering, Docker, Cloud Run, Cloud Build, credits, Stripe, beta, production, Demucs, Track A runtime, and Track B media runtime.

`dryRunPassedClaimed` remains `false`.

`generatedLocalFixturePassedClaimed` remains `false`.

## Next Prompt

`TOOL-ROUTE-EXECUTION-UNLOCK-8: tool-route local fixture validation, no execution`

UNLOCK-8 may validate metadata fixtures only. It must not execute tool, route, worker, provider, Supabase, media, Docker, Cloud, artifact, beta, or production paths.
