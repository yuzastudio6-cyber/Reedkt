# TOOL-ROUTE-EXECUTION-UNLOCK-3 Dry-Run Validation Prompt

## Summary

Validate the TOOL-ROUTE-EXECUTION-UNLOCK-2 dry-run contract and fixture packet using metadata-only diagnostics. Do not execute tools, routes, workers, providers, media, browser capture, maps, Supabase, SQL, storage, signed URLs, public artifacts, Docker, Cloud, credits, beta, production, or generated local fixture pass claims.

## Required Source Evidence

- TOOL-ROUTE-EXECUTION-UNLOCK-2 decision `tool_route_dry_run_contract_ready_with_warnings`
- 18 contract fixtures under `docs/activation-tool-route-execution-unlock-2-dry-run-contract-fixtures/`
- UNLOCK-2 schema contracts, scoring contract, blocked contracts, and owner handoff contracts
- PR #374 dry-run plan evidence
- PR #369 repo audit evidence
- PR #360 owner study evidence

## Validation Scope

Run contract diagnostics, fixture coverage checks, schema field checks, blocked-case checks, no-execution policy checks, and source-chain metadata checks. Validation remains dry-run metadata only and must not create runtime requests, worker payloads, Supabase rows, GCS paths, signed URLs, public artifacts, or media payloads.

## Success Routing

On pass, recommend the next no-execution tool-route dry-run fixture review or controlled validation prompt. Do not recommend real tool or route execution.
