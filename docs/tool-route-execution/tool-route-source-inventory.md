# Tool Route Source Inventory

Inventory status: `repo_source_inventory_created`

| Surface | Path | Purpose | Status | Risk | Owner | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| Worker claim routes | `server/routes/worker-routes.ts` | Claim, heartbeat, release, tool readiness, worker job run, media probe endpoints. | Exists | Contains live route handlers; keep execution blocked until TOOL-ROUTE-1 and worker gates pass. | `WORKER_RUNTIME_JOBS` | Require approved snapshot, scoped manifest, and claim/lease tests before use. |
| Job routes | `server/routes/job-routes.ts` | Job and job event API records. | Exists | Job creation may feed later worker execution. | `WORKER_RUNTIME_JOBS` | Keep route execution tied to approved snapshot and idempotency. |
| Provider gateway routes | `server/routes/provider-gateway-routes.ts` | Records provider request attempts and webhooks. | Exists | Provider fallback must not become implicit tool fallback. | `PROVIDER_GATEWAY_MODELS` | Keep provider calls behind separate approved provider gates. |
| Render routes | `server/routes/render-routes.ts` | Render job records and basic smoke preview handoff. | Exists | Final render/export ownership belongs to Track A. | `TRACK_A_RENDER_EXPORT` | Keep final render/export blocked until Track A approval. |
| Route helpers | `server/routes/route-helpers.ts` | Shared runtime context, idempotency, and response helpers. | Exists | Service context can carry privileged clients. | `TOOL_ROUTE_EXECUTION` | Enforce narrow handlers and redacted logging. |
| Worker CLI | `server/cli/run-worker-job.ts` | Local worker runner entrypoint. | Exists | Executes worker handlers when invoked. | `WORKER_RUNTIME_JOBS` | Do not run in this audit; require future approval. |
| Worker claim runner | `server/workers/worker-claim-runner.ts` | Loads jobs, checks gates, claims leases, runs worker handlers. | Exists | Direct execution path after gates pass. | `WORKER_RUNTIME_JOBS` | Require TOOL-ROUTE-1 dry-run contracts before route-owned handoff. |
| Worker gates | `server/workers/worker-gates.ts` | Approved snapshot, credit, raw chat, job status, and tool readiness gates. | Exists | Gate coverage is necessary but not complete route unlock. | `WORKER_RUNTIME_JOBS` | Add route-specific manifest contract tests later. |
| Worker runtime | `server/workers/worker-runtime.ts` | Dispatches worker types to handlers. | Exists | Handler dispatch must not become raw tool routing. | `WORKER_RUNTIME_JOBS` | Keep dispatch constrained by job type and approved snapshot. |
| Tool contracts | `src/backend/contracts/tool-execution-contracts.ts` | Tool execution plan, steps, artifacts, QA, fallback, and run result types. | Exists | Contract metadata can be mistaken for execution readiness. | `TOOL_ROUTE_EXECUTION` | Bind future route payloads to these contracts. |
| Artifact contracts | `src/backend/contracts/tool-artifact-contracts.ts` | Private tool artifact metadata. | Exists | Public or signed URL source-of-truth drift. | `TOOL_ROUTE_EXECUTION` | Require private artifact manifest plus checksum. |
| Tool registry policy | `server/tool-registry/tool-runtime-policy.ts` | Evaluates worker/runtime policies for production tool profiles. | Exists | Existing policy allows some metadata decisions but not route unlock. | `TOOL_ROUTE_EXECUTION` | Use as input to future route fixture tests. |
| Tool security policy | `server/security-review/tool-execution-security-policy.ts` | Records approved snapshot, plan, idempotency, raw prompt, provider, and arbitrary arg constraints. | Exists | Needs enforcement evidence before execution. | `COMPLIANCE_SECURITY` | Reference in TOOL-ROUTE-1 diagnostics. |
| Observability | `server/observability/worker-event-observability.ts` | Sanitizes worker event logs. | Exists | Logs may leak unsafe payloads if not redacted. | `OBSERVABILITY_AUDIT_COST` | Require route id, correlation id, and redaction checks later. |
| Track B route dry-runs | `src/lib/track-b/noop-route-dry-run/` and `src/lib/track-b/metadata-route-dry-run/` | Restricted route dry-run validation libraries. | Exists | Track B-only evidence must not become global unlock. | `TRACK_B_MEDIA_PROCESSING` | Treat as prior scoped evidence only. |
| Package scripts | `package.json` | Contains route, worker, tool, diagnostic, build, and summary scripts. | Exists | Runtime scripts can execute workers/tools if run. | `TOOL_ROUTE_EXECUTION` | Add only docs-only diagnostic script in this audit. |

Supabase status: update required `docs/status only`; update status `docs_only`; environment touched `none`; SQL executed `none`; migration deployed `no`.
