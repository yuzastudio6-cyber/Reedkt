# TOOL-ROUTE-EXECUTION-UNLOCK-2 Dry-Run Contract

## Decision

Decision: `tool_route_dry_run_contract_ready_with_warnings`.

This packet defines metadata-only dry-run request/result contracts and synthetic fixtures after merged PR #374. It does not execute tools, routes, workers, providers, media, browser capture, maps, Docker, Cloud, Supabase, SQL, storage, signed URLs, public artifacts, credits, beta, production, or raw prompts.

Next prompt: `TOOL-ROUTE-EXECUTION-UNLOCK-3: tool-route execution dry-run validation, no execution`.

## Source-Of-Truth

- Base branch: `codex/rp-model-orchestration-plan-snapshot-dry-run-validation`
- Base commit: `4560e27fec057e3edd8a3aca2402db09c4621a63`
- Implementation branch: `codex/tool-route-execution-unlock-2-dry-run-contract`
- PR #374 dry-run plan: accepted and merged.
- PR #369 repo audit: accepted and merged.
- PR #360 pending-owner studies: accepted and merged.
- Web search/capture and Map/geospatial studies are referenced only, not duplicated.

## Contract Inventory

- Route request schema: `tool_route_dry_run_route_request_contract_v1`
- Tool request schema: `tool_route_dry_run_tool_request_contract_v1`
- Route result schema: `tool_route_dry_run_route_result_contract_v1`
- Tool result schema: `tool_route_dry_run_tool_result_contract_v1`
- Scoring policy: `tool_route_scoring_policy_v1`

The contract requires structured agent findings, edit intents, approved plan snapshot refs, synthetic source-of-truth refs, candidate capabilities/tools/routes, scoring refs, owner handoffs, audit/cost refs, billing refs, validation evidence refs, idempotency keys, and correlation IDs.

## Fixture Inventory

The fixture pack covers all 18 PR #374 cases: 10 metadata-accepted cases and 8 fail-closed blocked cases. Fixture checksums use canonical JSON content only. All refs are synthetic placeholders.

## Blocked Coverage

The contracts explicitly reject raw prompt execution, raw provider output, direct tool invocation, direct route invocation, executable worker payloads, provider secrets, service-role keys, signed URL source-of-truth, public artifact URLs, beta/production targets, real user data, private project payloads, and media payloads.

## Runtime Gates

All runtime gates remain closed: tool execution, route execution, workers, job dispatch/claim/lease, providers/model calls, raw prompts, Supabase writes, SQL, migrations, storage, signed URLs, public artifacts, media/browser/map execution, Docker, Cloud Run/Build, credit or Stripe mutation, beta, production, Demucs, Track A runtime, Track B runtime, and generated local fixture pass claims.

## Warnings

- Dry-run validation execution is deferred to TOOL-ROUTE-EXECUTION-UNLOCK-3.
- Real tool, route, worker, provider, Supabase, media, artifact, beta, and production execution remain blocked.
- Historical model plan-snapshot dynamic-source smoke caveats remain inherited warnings only; committed source evidence is preserved.
