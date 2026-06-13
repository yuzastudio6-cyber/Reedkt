# TOOL-ROUTE-1 Dry-Run Readiness Matrix

Readiness state: `ready_with_warnings_for_tool_route_2`

| Gate | Status | Evidence | Warning | Owner | Next prompt |
| --- | --- | --- | --- | --- | --- |
| TOOL-ROUTE-0 source audit | `passed_with_warnings` | PR #366 source branch, TOOL-ROUTE-0 docs. | PR #366 is draft/open at implementation time. | `TOOL_ROUTE_EXECUTION` | Keep stacked PR draft. |
| Owner studies | `accepted_for_static_contracts` | PR #360 owner studies and completed WEB_SEARCH_CAPTURE / MAP_GEOSPATIAL references. | Owner studies are evidence, not runtime approval. | Owner workstreams | TOOL-ROUTE-2 may use static fixtures only. |
| Synthetic plan snapshot fixtures | `created` | Seven JSON fixtures under `docs/tool-route-execution/fixtures/`. | Placeholder-only; no approved runtime snapshot rows. | `TOOL_ROUTE_EXECUTION` | TOOL-ROUTE-2 offline contract tests. |
| Scoped tool-call manifest contract | `created` | `tool-route-1-scoped-tool-call-manifest-contract.md`. | Execution manifest remains future-only. | `TOOL_ROUTE_EXECUTION` | TOOL-ROUTE-2. |
| Capability-to-route map | `created` | `tool-route-1-capability-to-route-map.md`. | Route refs are placeholders and not invocations. | `TOOL_ROUTE_EXECUTION` | TOOL-ROUTE-2. |
| Contract test plan | `created` | `tool-route-1-contract-test-plan.md`. | Static diagnostics only. | `TOOL_ROUTE_EXECUTION` | TOOL-ROUTE-2. |
| Diagnostics | `created` | `tool-route:dry-run-fixtures:diagnostics`. | Foundation runner absent on base. | `TOOL_ROUTE_EXECUTION` | Keep standalone diagnostic. |
| Supabase status | `docs_only` | Validation results and fixture fields. | No milestone sync. | `SUPABASE_RLS_STORAGE_DATABASE` | Later Supabase owner prompt only if needed. |

Route execution approved: `false`
Tool execution approved: `false`
Worker execution approved: `false`
Provider/model runtime approved: `false`
Supabase mutation approved: `false`
Public artifacts approved: `false`
Signed URLs approved: `false`
Raw prompt execution approved: `false`
Internal beta approved: `false`
External beta approved: `false`
Production approved: `false`

Production capability enabled: `none; tool-route dry-run fixture plan and contract tests only`
