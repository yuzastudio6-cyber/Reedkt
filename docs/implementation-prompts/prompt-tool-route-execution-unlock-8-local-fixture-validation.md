# TOOL-ROUTE-EXECUTION-UNLOCK-8 Local Fixture Validation

## Summary

Run a metadata-only local fixture validation packet after TOOL-ROUTE-EXECUTION-UNLOCK-7. Use the UNLOCK-7 local fixture plan reports as source of truth. This phase may validate fixture files and deterministic metadata only.

Do not execute tools, routes, workers, providers/models, media, browser capture, map rendering, Docker/Cloud Run, Supabase mutation, SQL, storage writes, signed URLs, public artifacts, beta/production unlocks, raw prompt execution, final render/export, or credit mutation.

## Expected Decision

Allowed decisions:

- `tool_route_local_fixture_validation_passed_with_warnings_ready_for_generated_fixture_review`
- `tool_route_local_fixture_validation_passed_ready_for_generated_fixture_review`
- `tool_route_local_fixture_validation_blocked_missing_plan_evidence`
- `tool_route_local_fixture_validation_blocked_missing_fixture_files`
- `tool_route_local_fixture_validation_blocked_case_coverage`
- `tool_route_local_fixture_validation_blocked_schema_contract`
- `tool_route_local_fixture_validation_blocked_scoring_policy`
- `tool_route_local_fixture_validation_blocked_runtime_gate_ambiguity`
- `tool_route_local_fixture_validation_blocked_source_of_truth_conflict`

Do not claim `dryRunPassedClaimed` or `generatedLocalFixturePassedClaimed` unless a later approved source-of-truth prompt explicitly authorizes that claim.

## Validation Requirements

Validate the existing UNLOCK-2 fixture scope:

- 18 synthetic cases.
- 10 metadata-accepted fixtures.
- 8 fail-closed fixtures.
- Manifest and checksum metadata.
- Request and result schema references.
- Candidate scoring policy.
- Source-of-truth requirements.
- Owner handoff requirements.

The validation must fail closed if fixture content asks for raw prompt execution, direct tool execution, direct route execution, worker runtime execution, provider runtime execution, Supabase mutation, signed URL source of truth, public artifact output, real user data, private project payloads, media payloads, beta targets, or production targets.

## Runtime Gates

Keep all runtime gates closed: tool execution, route execution, worker execution, job dispatch, job claim/lease mutation, provider/model calls, Supabase writes, SQL/migrations, storage writes, public artifacts, signed URLs, media/browser/map execution, Docker/Cloud Run/Cloud Build, credits/Stripe, beta, production, Demucs, Track A runtime, and Track B media runtime.

## Evidence And Reporting

Write deterministic sanitized reports only. Do not commit private payloads, raw provider responses, secrets, runtime logs, generated assets, storage outputs, or temp artifacts.

If validation passes, recommend the next metadata-only review gate. If blocked, recommend a blocker-specific UNLOCK-8 fix prompt.
