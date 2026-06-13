# TOOL-ROUTE-EXECUTION-UNLOCK-1: Tool-Route Execution Dry-Run Plan, No Execution

Create a metadata-only dry-run plan for tool-route execution after the repo audit passed with warnings.

Do not execute tools, routes, workers, providers, media, browser capture, map rendering, Docker, Cloud Run, Supabase, SQL, storage, signed URLs, public artifacts, credits, beta, production, raw prompts, or final render/export.

Required inputs:

- `docs/activation-tool-route-execution-unlock-0-repo-audit-reports/tool_route_repo_audit_decision.json`
- `docs/activation-tool-route-execution-unlock-0-repo-audit-reports/tool_route_completed_tool_study_rollup.json`
- Existing Track B route manifest reports
- Worker runtime local fixture plan reports
- Plan snapshot contract reports

Plan requirements:

- Define dry-run-only route request and result contracts for all six owner lanes.
- Preserve approved plan snapshot, structured agent findings, edit intents, private source refs, manifest refs, checksum refs, and idempotency/correlation fields.
- Include fail-closed cases for raw prompt execution, public artifact requests, signed URL source-of-truth, broad media, provider/model calls, Supabase writes, worker/job mutation, and production/beta unlock requests.
- Keep tool execution, route execution, worker execution, job dispatch, Supabase writes, SQL, providers, media, browser capture, map rendering, Docker/Cloud Run, public artifacts, signed URLs, production, external beta, paid production, and `generated_local_fixture_passed` blocked.

Expected decision:

- `tool_route_dry_run_plan_ready`
- or a blocked dry-run-plan decision with an exact fix prompt.
