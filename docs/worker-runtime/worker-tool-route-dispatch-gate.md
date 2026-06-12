# Worker Tool Route Dispatch Gate

Status: `ready_for_worker_2_dry_run_fixture_plan`.

Workers cannot dispatch tools or routes until TOOL-ROUTE-0 and later execution gates pass. WORKER-1 creates only the contract boundary.

## Required Future Inputs

- Approved plan snapshot.
- Scoped tool-call manifest.
- Tool-study or capability-routing evidence.
- Explicit owner approval for the exact tool/route class.
- Tool readiness evidence.
- Artifact scope refs.
- QA and observability hooks.
- Cleanup/rollback hooks.

## Dispatch Rules

- No raw prompt execution.
- No provider fallback.
- No hardcoded tool choice by keyword.
- Blocked tools must be excluded.
- Tool/route failure handling must produce safe blocked evidence.
- Route execution remains blocked by default.

## Approval Defaults

```json
{
  "toolExecutionApprovedNow": false,
  "routeExecutionApprovedNow": false,
  "providerRuntimeApprovedNow": false,
  "rawPromptExecutionApproved": false,
  "workerExecutionApprovedNow": false,
  "internalBetaApproved": false,
  "productionApproved": false
}
```
