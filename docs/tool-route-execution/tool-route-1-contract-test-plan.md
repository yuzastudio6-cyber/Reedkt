# TOOL-ROUTE-1 Contract Test Plan

Contract test plan status: `offline_static_tests_created`

TOOL-ROUTE-1 contract tests are static diagnostics over committed docs and JSON fixtures. They do not import route handlers, instantiate workers, call tools, call providers, access Supabase, run SQL, upload artifacts, create signed URLs, or generate public artifacts.

## Diagnostic Command

`npm run --silent tool-route:dry-run-fixtures:diagnostics`

The diagnostic verifies:

- required TOOL-ROUTE-1 docs exist.
- seven scoped tool-call fixtures exist and parse.
- each fixture has required owner-study refs, capability refs, selected tools, route refs, artifact scope placeholders, private artifact manifest placeholders, checksum requirements, QA requirements, observability requirements, blocked uses, and false approval booleans.
- plan snapshot IDs are placeholders and not raw chat text.
- source-of-truth policy is preserved: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.
- no fixture claims route/tool/worker/provider execution, Supabase mutation, SQL, storage transfer, signed URL source-of-truth use, public artifacts, media processing, browser capture, map rendering, final render/export, beta, production, or dependency mutation.

## Non-Execution Boundary

The diagnostic uses Node built-ins only and reads files only. It intentionally does not run `worker:run`, route smoke tests, tool smoke tests, provider dry-runs, media probes, Docker/Cloud Run commands, Supabase commands, SQL, GCS upload commands, browser capture, map rendering, final render/export, beta, or production commands.

## Acceptance

Passing diagnostics means the offline dry-run fixture plan is ready for a later TOOL-ROUTE-2 contract-test execution prompt. It does not mean route execution, tool execution, worker execution, internal beta, external beta, paid production, or production is approved.
