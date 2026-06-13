# TOOL-ROUTE-2 Contract Test Report

Report status: `passed_with_warnings`

Command run: `npm run --silent tool-route:offline-contract-tests`

## Files Scanned

- TOOL-ROUTE-1 base docs.
- Seven fixture JSON files under `docs/tool-route-execution/fixtures/`.
- Offline runner source `scripts/validation/tool-route-offline-contract-tests.mjs`.

## Pass Summary

- Fixtures expected: `7`
- Fixtures checked: `7`
- Fixtures passed: `7`
- Fixtures blocked: `0`
- Fixture validation result: `tool_route_offline_contract_tests_passed_with_warnings`

## Warnings

- Upstream PR #366 is draft/open.
- Upstream PR #368 is draft/open.
- GitHub check rollup for PR #368 is `none`.
- Foundation validation runner is absent on this base.

## Blockers

No fixture/schema blockers were found. Runtime execution remains blocked by policy and by design.

## No-Execution Proof

- No route handler import proof: passed.
- No tool runtime import proof: passed.
- No worker execution proof: passed.
- No provider call proof: passed.
- No Supabase proof: passed.
- No SQL proof: passed.
- No GCS/storage transfer proof: passed.
- No public artifact proof: passed.
- No signed-URL proof: passed.
- No media/browser/map/final render proof: passed.

The runner uses Node built-ins only and reads committed files only.

Production capability enabled: `none; offline tool-route contract tests only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
