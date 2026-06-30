# QWEN Transport Readiness Plan Current

Packet: `RP-EXTERNAL-BETA-QWEN-TRANSPORT-READINESS-PLAN-CURRENT-1`

Decision: `completed_current_base_qwen_transport_readiness_plan_ready_for_confirmed_transport_runtime_preflight`

Execution: `completed_docs_only_current_base_qwen_transport_readiness_plan_no_runtime_invocation`

## Target Services

| Field | Value |
| --- | --- |
| Google Cloud project | `reeditpro` |
| Region | `us-central1` |
| Staging API service | `reeditpro-staging-api` |
| Staging API latest ready revision from readback | `reeditpro-staging-api-00006-6gw` |
| QWEN worker service | `reeditpro-qwen2-5-vl-l4-worker` |
| QWEN worker latest ready revision from readback | `reeditpro-qwen2-5-vl-l4-worker-00037-658` |
| Target Supabase ref | `wmyyttnynmteqgcdishd` |
| Target class | `Reeditpro / staging` |

## Product Route

Route id: `providers.qwen25Vl.structuredVisualMetadataPlan`

Route path: `POST /api/providers/qwen2-5-vl/structured-visual-metadata`

Required header: `Idempotency-Key: qwen-transport-runtime-preflight-current-1-single-tester-fixture-v1`

Route behavior expected for the next packet:

- backend-only route;
- authenticated single-tester context;
- fail-closed unless runtime gate values and request refs are present;
- structured metadata only;
- no frontend provider/model call;
- no raw prompt execution;
- no arbitrary media;
- no public artifacts or signed URLs;
- no final render/export.

## Request Body Shape

The confirmed preflight packet may use only this non-secret generated fixture shape:

```json
{
  "workspaceId": "external_beta_single_tester_workspace",
  "projectId": "external_beta_qwen_transport_project",
  "editSessionId": "external_beta_qwen_transport_edit_session",
  "requestId": "qwen_transport_runtime_preflight_current_1",
  "workspaceMembershipRef": "workspace-membership://single-tester/qwen-transport-runtime-preflight-current-1",
  "targetRef": "wmyyttnynmteqgcdishd",
  "workflowBindingId": "workflow-binding://qwen-transport-runtime-preflight-current-1",
  "adapterRequestId": "adapter-request://qwen-transport-runtime-preflight-current-1",
  "approvedSnapshotReadbackRef": "approved-snapshot://qwen-transport-runtime-preflight-current-1/structured-metadata-only",
  "creditReservationReadbackRef": "credit-reservation://qwen-transport-runtime-preflight-current-1/no-spend",
  "queueLeaseReadbackRef": "queue-lease://qwen-transport-runtime-preflight-current-1/non-mutating-readiness",
  "privateInputManifestReadbackRef": "manifest://qwen-transport-runtime-preflight-current-1/private-input",
  "privateArtifactManifestReadbackRef": "manifest://qwen-transport-runtime-preflight-current-1/private-artifacts",
  "privateArtifactChecksumReadbackRef": "sha256:qwen-transport-runtime-preflight-current-1-private-artifacts",
  "sourceSequenceMapReadbackRef": "source-sequence-map://qwen-transport-runtime-preflight-current-1/generated-fixture",
  "compiledIntentReadbackRef": "compiled-intent://qwen-transport-runtime-preflight-current-1/generated-fixture",
  "editPlanVersionReadbackRef": "edit-plan-version://qwen-transport-runtime-preflight-current-1/generated-fixture",
  "modelRoutingPolicyReadbackRef": "model-routing-policy://qwen-transport-runtime-preflight-current-1/qwen2-5-vl-structured-metadata-only",
  "qaPolicyReadbackRef": "qa-policy://qwen-transport-runtime-preflight-current-1/private-structured-metadata-only",
  "routeReadbackExecutionRequested": false,
  "providerModelCallRequested": false,
  "workerDispatchRequested": false,
  "mediaProcessingRequested": false,
  "signedUrlCreationRequested": false,
  "publicArtifactRequested": false,
  "finalRenderExportRequested": false,
  "externalBetaUnlockRequested": false
}
```

## Confirmation And Runtime Gate

The next packet must require an explicit confirmation gate before any Cloud Run request, identity-token fetch, route request send, QWEN invocation, or worker dispatch.

Required gate values for the future confirmed preflight:

- `REEDITPRO_CONFIRM_QWEN_TRANSPORT_RUNTIME_PREFLIGHT_CURRENT_1=true`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`

## Artifact And Checksum Policy

- Private artifacts only.
- Report, manifest, and checksum JSON may be written only under `/tmp/reeditpro-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1/<runId>/`.
- No generated assets, media files, model outputs, signed URLs, or public artifacts may be committed.
- If a runtime request is sent in the future packet, it must record only sanitized metadata: run ID, request id, route id, target services, status code/category, bounded response summary, artifact file names, byte counts, and SHA-256 checksums.

## Timeout, Cost, Cleanup, And Rollback

- Request timeout: `30s` maximum for the future confirmed preflight.
- QWEN output scope: structured metadata fixture only.
- Credit policy: `credit_reservation_no_spend`; no spend, charge, refund, Stripe action, or wallet mutation.
- Cleanup: delete transient token/header files immediately; keep only sanitized `/tmp` report JSON.
- Rollback: no persistent rollout is allowed; failure records only a blocker and leaves broad external beta and production locked.

## Failure Classifications

The next packet must record exactly one primary blocker if it cannot pass:

- `blocked_missing_qwen_transport_runtime_preflight_confirmation`
- `blocked_runtime_gate_env_mismatch`
- `blocked_route_fixture_contract_incomplete`
- `blocked_identity_token_fetch_failed`
- `blocked_cloud_run_request_failed`
- `blocked_route_response_classification_failed`
- `blocked_unexpected_provider_model_execution`
- `blocked_unexpected_worker_dispatch`
- `blocked_unexpected_supabase_or_sql_mutation`
- `blocked_unexpected_public_or_signed_artifact`

## Readiness

Readiness: `ready_for_confirmed_qwen_transport_runtime_preflight_current_1`

Next milestone: `RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1`

Product-ready end-to-end local OSS tools: `0`.
