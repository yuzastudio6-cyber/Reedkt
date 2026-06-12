# Approved Plan Snapshot Schema

Status: `ready_for_owner_review`.

This is a contract schema only. It is not a database schema, migration, route payload, worker payload, or executable runtime config.

## Required Fields

Every future approved plan snapshot must carry these fields before any worker/tool/route execution prompt may evaluate it:

| Field | Contract Requirement |
| --- | --- |
| `planSnapshotId` | Placeholder identifier until a future persistence prompt creates a real row. |
| `workspaceRef` | Workspace placeholder only. |
| `projectRef` | Project placeholder only. |
| `userRef` | User placeholder only. |
| `sourceRequestRef` | Source request placeholder linking compiled intent to the reviewed plan. |
| `providerDryRunEvidenceRefs` | Committed sanitized MODEL-DRYRUN evidence references only. |
| `providerFindings` | Provider capability findings and blocker classes, not raw responses. |
| `requestedCapabilities` | Structured capabilities requested by the compiled edit intent. |
| `candidateToolRefs` | Candidate tool identifiers, readiness states, and ownership boundaries. |
| `selectedToolPlan` | Future selected tool plan after scoring and owner review. |
| `toolReadinessRequirements` | Required package/runtime, QA, provenance, and owner gates. |
| `editIntents` | Structured intent objects derived from user goals, source sequence, and constraints. |
| `artifactScopes` | Private artifact scope placeholders and blocked public/signed URL scope. |
| `privateArtifactManifestRefs` | Placeholder manifest refs only. |
| `checksumRequirements` | Required checksum/provenance placeholders for every future artifact. |
| `SupabaseRecordPlaceholders` | Placeholder row refs; no Supabase mutation is approved. |
| `GcsPrivatePathPlaceholders` | Placeholder private GCS paths; no storage transfer is approved. |
| `workerExecutionGate` | Explicit false approval state and prerequisite list. |
| `toolRouteExecutionGate` | Explicit false approval state and route/tool prerequisites. |
| `providerExecutionGate` | Explicit false approval state for any later provider runtime. |
| `QARequirements` | Required QA evidence classes before execution or beta gates. |
| `observabilityRequirements` | Required audit/cost/error telemetry placeholders. |
| `cleanupRollbackRequirements` | Required cleanup and rollback owner placeholders. |
| `blockedUses` | Unsafe uses blocked by the snapshot. |
| `approvalState` | One of the approved state terms below. |
| `nextGate` | Next required owner prompt or review step. |
| `provenance` | Source evidence, prompt record, validation, and no-scope summary. |

## Approval States

Allowed `approvalState` values:

- `draft_plan_snapshot`
- `ready_for_owner_review`
- `approved_for_dry_run_only`
- `approved_for_controlled_private_sample`
- `blocked_pending_contract_fixes`
- `blocked_pending_workstream_gates`

PLAN-SNAPSHOT-0 sets the contract to `ready_for_owner_review`. It does not set a live snapshot to `approved_for_dry_run_only` or `approved_for_controlled_private_sample`.

## Required Approval Booleans

The PLAN-SNAPSHOT-0 contract requires these defaults:

```json
{
  "workerExecutionApproved": false,
  "toolExecutionApproved": false,
  "routeExecutionApproved": false,
  "providerRuntimeApproved": false,
  "supabaseMutationApproved": false,
  "publicArtifactsApproved": false,
  "signedUrlsApproved": false,
  "rawPromptExecutionApproved": false,
  "internalBetaApproved": false,
  "externalBetaApproved": false,
  "productionApproved": false
}
```

## Minimal Shape

```json
{
  "planSnapshotId": "<PLAN_SNAPSHOT_ID_PLACEHOLDER>",
  "workspaceRef": "<WORKSPACE_REF_PLACEHOLDER>",
  "projectRef": "<PROJECT_REF_PLACEHOLDER>",
  "userRef": "<USER_REF_PLACEHOLDER>",
  "sourceRequestRef": "<SOURCE_REQUEST_REF_PLACEHOLDER>",
  "providerDryRunEvidenceRefs": ["docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2a_summary.json"],
  "providerFindings": {
    "qwenDashscopeStatus": "passed",
    "deepseekStatus": "passed",
    "totalTokensReported": 2871,
    "maxTotalTokens": 7200,
    "costGuardrailStatus": "passed_by_call_and_token_caps"
  },
  "requestedCapabilities": ["<CAPABILITY_ID_PLACEHOLDER>"],
  "candidateToolRefs": ["<CANDIDATE_TOOL_REF_PLACEHOLDER>"],
  "selectedToolPlan": "<SELECTED_TOOL_PLAN_PLACEHOLDER>",
  "toolReadinessRequirements": ["<TOOL_READINESS_REQUIREMENT_PLACEHOLDER>"],
  "editIntents": ["<EDIT_INTENT_PLACEHOLDER>"],
  "artifactScopes": ["<PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER>"],
  "privateArtifactManifestRefs": ["<PRIVATE_ARTIFACT_MANIFEST_REF_PLACEHOLDER>"],
  "checksumRequirements": ["<CHECKSUM_REQUIREMENT_PLACEHOLDER>"],
  "SupabaseRecordPlaceholders": ["<SUPABASE_ROW_PLACEHOLDER>"],
  "GcsPrivatePathPlaceholders": ["<PRIVATE_GCS_PATH_PLACEHOLDER>"],
  "workerExecutionGate": { "workerExecutionApproved": false },
  "toolRouteExecutionGate": { "toolExecutionApproved": false, "routeExecutionApproved": false },
  "providerExecutionGate": { "providerRuntimeApproved": false },
  "QARequirements": ["<QA_REQUIREMENT_PLACEHOLDER>"],
  "observabilityRequirements": ["<OBSERVABILITY_REQUIREMENT_PLACEHOLDER>"],
  "cleanupRollbackRequirements": ["<CLEANUP_ROLLBACK_REQUIREMENT_PLACEHOLDER>"],
  "blockedUses": ["raw_prompt_execution", "signed_url_source_of_truth", "public_artifact", "worker_execution_without_owner_gate"],
  "approvalState": "ready_for_owner_review",
  "nextGate": "PLAN-SNAPSHOT-1 - Approved Plan Snapshot Dry-Run Fixture Contract",
  "provenance": {
    "contractPrompt": "PLAN-SNAPSHOT-0",
    "modelDryRun2aFinalState": "provider_dry_run_passed"
  }
}
```

No Secret Manager payloads, raw provider responses, raw prompts, private URLs, signed URLs, public artifacts, provider calls, worker execution, tool execution, route execution, Supabase mutation, SQL execution, storage transfer, beta unlock, or production unlock were enabled.
