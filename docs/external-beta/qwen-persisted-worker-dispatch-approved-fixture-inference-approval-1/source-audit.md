# QWEN Persisted Worker Dispatch Approved Fixture Inference Approval Source Audit

Packet: `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL-1`

Decision: `approved_single_bounded_qwen_persisted_worker_dispatch_approved_fixture_inference_attempt_pending_confirmation_gate`

Execution: `completed_docs_only_qwen_persisted_worker_dispatch_approved_fixture_inference_approval_no_runtime_execution`

## Source Chain

- #1410 records the backend-only approved-snapshot job orchestration contract, including approved snapshot, approval record, credit estimate, credit reservation, job, worker lease, idempotency, private manifests, model routing, QA policy, and QWEN runtime evidence references.
- #1414 records the accepted confirmed QWEN approved-snapshot runtime fixture with HTTP `200`, `qwen_fixture_inference_smoke_completed`, structured metadata accepted, schema valid, and fail-closed restore passed.
- #1417 records QA over #1414 evidence with approved-snapshot, credit-reservation, job-lease, private-artifact-manifest, and fail-closed gates reviewed.
- #1798 records the active single-tester lane after the QWEN auth bridge.
- #1803 imports current-base persisted worker dispatch transport evidence, accepting draft-stack private reachability/fail-closed 403 evidence only.
- #1805 records the approved fixture inference plan and requires this approval packet before any persisted-dispatch runtime retry.
- #1808 is an open draft branch-to-branch approval PR that includes runtime/mock/source changes; it is recorded as draft-stack evidence only and is not the current-base source-of-truth for this docs-only approval packet.
- `RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1` local run `2026-06-30T02-01-10-237Z-03964b88` records `completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry` with token values not printed or persisted.
- `RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1` records authenticated staging readback for `aiediting@reeditpro.com` and target `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- #577 remains open/draft/blocked/excluded and is not source-of-truth for this QWEN lane.

## Source-Derived Runtime Target

- Target project name: `Reeditpro`.
- Supabase project ref: `wmyyttnynmteqgcdishd`.
- Environment: `staging`.
- Google Cloud project: `reeditpro`.
- Google Cloud region: `us-central1`.
- Staging service: `reeditpro-staging-api`.
- Approved tester: `aiediting@reeditpro.com`.

## Source-Derived Approval Envelope

- Confirmation gate: `REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true`.
- Approved snapshot fixture reference: `qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404`.
- Persisted dispatch reference class: `source_derived_single_request_persisted_worker_dispatch_fixture_envelope`.
- Queue/job reference policy: `required_for_confirmed_runtime_attempt_and_must_be_sanitized_in_report`.
- Idempotency policy: `single_attempt_idempotency_key_required`.
- Credit policy: `credit_no_spend_no_persistent_credit_mutation`.
- Private input manifest policy: `private_fixture_manifest_reference_only_no_public_artifact`.
- Private output manifest and checksum policy: `local_or_private_manifest_with_file_names_byte_counts_sha256_only`.
- Timeout and cost ceiling: `single_request_timeout_and_cost_ceiling_required`.
- Fail-closed restore plan: `restore_qwen_inference_disabled_after_attempt_or_on_failure`.
- Rollback path: `no_deployment_or_config_mutation_in_this_approval_phase_runtime_attempt_must_fail_closed`.
- Cleanup policy: `local_tmp_reports_only_no_generated_artifact_commit`.

## Boundary

This approval packet authorizes only a future single bounded approved-fixture runtime attempt when the exact confirmation gate is present. It does not execute the runtime attempt, fetch identity tokens, read secret payload values, invoke Cloud Run, call QWEN, dispatch workers, mutate Supabase, execute SQL, spend credits, create artifacts, or unlock beta/production.

Product-ready end-to-end local OSS tools: `0`
