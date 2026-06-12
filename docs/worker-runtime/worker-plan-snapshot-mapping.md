# Worker Plan Snapshot Mapping

Status: `ready_for_worker_2_dry_run_fixture_plan`.

Workers must consume approved plan snapshots and scoped manifests. They must not choose tools by hardcoded keyword and must not execute raw prompt text.

| PLAN-SNAPSHOT-0 Field | Future Worker Payload Field | WORKER-1 Rule |
| --- | --- | --- |
| `providerFindings` | `providerEvidenceRefs` | Sanitized evidence only; no provider call. |
| `requestedCapabilities` | `capabilityRefs` | Structured capability IDs; no keyword tool selection. |
| `selectedToolPlan` | `scopedToolCallManifestRef` | Must come from tool-study/capability routing and later tool-route owner gates. |
| `editIntents` | `editIntentRefs` | Structured intent refs only; no raw chat payload. |
| `artifactScopes` | `artifactScopeRefs` | Private placeholders only. |
| `QARequirements` | `qaHooks` | Planned QA hooks only; no QA execution. |
| `observabilityRequirements` | `observabilityHooks` | Planned event/log/cost hooks only. |
| `cleanupRollbackRequirements` | `cleanupRollbackHooks` | Planned cleanup/rollback refs only. |
| `blockedUses` | `blockedUses` | Must be enforced before any future dry-run or execution. |
| `approvalState` | `approvalState` | WORKER-1 sets `ready_for_worker_2_dry_run_fixture_plan` only. |
| `nextGate` | `nextAllowedPrompt` | `WORKER-2 - Worker Runtime Dry-Run Fixture Plan / Contract Tests`. |

## Dispatch Constraints

- No hardcoded tools.
- No blocked tools.
- No provider fallback.
- No route/tool dispatch before TOOL-ROUTE-0 and later execution gates.
- No provider runtime before PROVIDER-GATEWAY-0 and later execution gates.
- Readiness stage required before WORKER-2: `ready_for_worker_2_dry_run_fixture_plan`.

## Approval Booleans

```json
{
  "rawPromptExecutionApproved": false,
  "workerExecutionApprovedNow": false,
  "toolExecutionApprovedNow": false,
  "routeExecutionApprovedNow": false,
  "providerRuntimeApprovedNow": false,
  "supabaseMutationApprovedNow": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "internalBetaApproved": false,
  "externalBetaApproved": false,
  "productionApproved": false
}
```
