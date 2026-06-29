# QWEN Persisted Worker Dispatch Draft Stack Triage

Packet: `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-DRAFT-STACK-TRIAGE-1`

Decision: `completed_qwen_persisted_worker_dispatch_draft_stack_triage_no_blind_merge`

Execution: `completed_docs_only_qwen_dispatch_stack_triage_no_runtime_execution`

Product-ready end-to-end local OSS tools: `0`

## Triage Result

The QWEN2.5-VL persisted worker dispatch lane is active and has advanced beyond the older `QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1` source boundary. The current top-of-stack is PR #1695, but it is still draft and based on PR #1690 rather than the current integration base.

Result: `source_import_required_before_runtime_or_merge`.

## Accepted As Evidence

- #1695 may be used as current top-of-stack evidence for the real-dispatch execution approval shape.
- #1690 may be used as current execution-plan evidence for approved snapshot intake, credit no-spend checks, private refs, idempotency, backend-only lease, request envelope, private invoke credential path, Cloud Run L4 attempt shape, result validation, QA/audit/cost/cleanup/credit handoff.
- Lower draft PRs may be used only as supporting source history when the future source-import packet proves they are still required and safe from current integration.

## Not Accepted As Source-Of-Truth Yet

- #1695 is not accepted as current integration source-of-truth.
- #1690 is not accepted as current integration source-of-truth.
- No QWEN draft stack branch is approved for blind merge.
- No non-draft lower stack PR is approved for blind merge from this packet.
- No real dispatch, Cloud Run invocation, QWEN inference, worker dispatch, Supabase mutation, SQL execution, generated asset creation, credit mutation, beta unlock, production unlock, or public artifact creation is approved.

## Required Next Step

Next milestone: `QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_SOURCE_IMPORT_1`

The next packet should:

- start from the latest integration branch;
- read #1695, #1690, and required lower stack evidence;
- import or re-create only the scoped docs/mock/source/smoke pieces that are still required;
- preserve backend-only execution boundaries;
- keep runtime disabled unless a later explicit confirmation gate authorizes it;
- rerun full validation from the current integration base;
- keep broad external beta and production blocked.

## Carry-Forward Status

- Active external beta lane: `active_single_tester_external_beta_for_aiediting_reeditpro_com`.
- Single tester real usage QA: `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`.
- QWEN2.5-VL controlled product flow: `qa_passed_single_tester_qwen_product_flow_runtime_evidence_backend_only_gated_not_broad_provider_unlock`.
- QWEN persisted worker dispatch draft stack: `source_import_required_before_runtime_or_merge`.
- Broad external beta: `blocked_no_additional_named_tester_list`.
- Paid production/final delivery/export/production unlock: `blocked`.
- PR #577 remains open/draft/blocked/excluded as source-of-truth.
