# TOOL-ROUTE-EXECUTION-UNLOCK-7 Local Fixture Plan

## Summary

Create a metadata-only local fixture planning packet after TOOL-ROUTE-EXECUTION-UNLOCK-6 records the dry-run pass review. This prompt plans local fixture validation only; it must not execute tools, routes, workers, providers, Supabase writes, SQL, media/browser/map paths, Docker/Cloud paths, signed URLs, public artifacts, beta/production unlocks, billing/credit mutation, raw prompts, or generated local fixtures.

Expected decision: `tool_route_local_fixture_plan_ready_with_warnings`, unless source checks reveal a hard blocker.

## Source Inputs

- TOOL-ROUTE-EXECUTION-UNLOCK-6 pass-review reports.
- TOOL-ROUTE-EXECUTION-UNLOCK-5 gate-status reports.
- TOOL-ROUTE-EXECUTION-UNLOCK-4 owner approval reports.
- TOOL-ROUTE-EXECUTION-UNLOCK-3 validation reports.
- TOOL-ROUTE-EXECUTION-UNLOCK-2 contract reports and fixtures.
- TOOL-ROUTE-EXECUTION-UNLOCK-1 dry-run plan reports.
- TOOL-ROUTE-EXECUTION-UNLOCK-0 repo-audit reports.
- PR #360 tool studies and completed Web Search Capture / Map Geospatial study references.

## Planning Requirements

- Map the 18 tool-route dry-run contract cases into local fixture planning metadata.
- Preserve the 10 metadata-accepted and 8 fail-closed fixture split.
- Require synthetic/private placeholder refs only.
- Keep source of truth as Supabase row reference plus private GCS path reference plus manifest plus checksum plus approved plan snapshot.
- Keep signed URLs and public artifacts blocked as source of truth.
- Keep `dryRunPassedClaimed` and `generatedLocalFixturePassedClaimed` false unless a later explicit owner gate changes that status.

## Runtime Gates

Tool execution, route execution, worker execution, job dispatch/claim/lease, providers, Supabase persistence, SQL/migrations, media/browser/map runtime, Docker/Cloud runtime, public artifacts, signed URLs, credits/Stripe, beta, production, and generated local fixture execution remain blocked.

## Validation

Run the new local-fixture-plan diagnostics/report/summary, then the UNLOCK-6 through UNLOCK-0 diagnostics/summaries, pending-owner diagnostics, worker/model/product/Supabase metadata checks where scripts exist, readiness summaries, lint/typecheck/build when dependencies permit, diff checks, and changed/staged-file safety scans.
