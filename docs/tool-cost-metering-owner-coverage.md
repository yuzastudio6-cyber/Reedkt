# Tool Cost Metering Owner Coverage

This PR adds mock-safe backend metering coverage for every tool currently registered in `PRODUCTION_TOOL_IDS`.

## Source Of Truth

- Registry source: `server/tool-registry/production-tool-types.ts`
- Profile source: `server/tool-registry/production-tool-profiles.ts`
- Readiness source: `server/workers/production-readiness/production-tool-readiness-specs.ts`
- Coverage source: `server/tool-cost-metering/tool-cost-owner-coverage.ts`
- Rate card: `tool-metering-v1-2026-06-26`

The current registry contains 49 production tool IDs. The smoke test fails if any registered tool lacks an owner coverage case, if a duplicate case appears, if any readiness spec is missing, or if coverage implies production billing/product readiness.

## Owner Coverage Rules

- Every registered tool has a metering owner derived from its worker boundary.
- Every registered tool has a default usage category for summary grouping.
- Every registered tool has a default provider type, compute level, and quality level for estimates.
- Every registered tool exposes its production readiness worker types, container image roles, readiness check modes, and missing-readiness production blocker status.
- Every registered tool requires an approved plan snapshot, credit estimate, credit reservation, and idempotent event key before billable work.
- Tool events exclude the ReEditPro service fee.
- Supabase-backed event persistence now has a backend skeleton and local migration artifact; live deployment, service-role validation, wallet settlement, Stripe, monitoring, and billing QA remain blocked.
- Product-ready local OSS tools remain `0`.

## API

`GET /v1/tool-costs/owner-coverage` returns the owner-facing coverage summary and per-tool records. The route requires auth and does not mutate state.

## Boundary

This coverage makes tool cost ownership explicit for ReEditPro’s registered tool stack. It adds a persistent backend path for audited tool events, but it does not enable live charging, provider calls, remote Supabase deployment, Stripe, production billing, product runtime execution, or external beta readiness.
