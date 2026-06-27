# QWEN2.5-VL Stack Decision

Decision: `completed_qwen2_5_vl_stack_source_rollup_ready_for_fresh_fail_closed_source_import`

Runtime readiness: `blocked_pending_fresh_integration_source_import_and_structured_output_smoke_retry`

External beta status: `controlled_single_tester_external_beta_remains_ready_for_aiediting_reeditpro_com_but_qwen_runtime_not_enabled`

Broad external beta: `blocked_no_additional_named_tester_list`

External production: `blocked_pending_broad_beta_tool_runtime_billing_support_legal_security_and_final_export_gates`

## Accepted Source Evidence

- #1282 accepted bounded private invocation and private model-cache/vLLM evidence, but rejected structured output readiness.
- #1287 is the current top clean non-draft QWEN evidence and fixes structured output source behavior only.
- #1287 explicitly records no Cloud Run deployment/invocation, no identity token fetch, no model import/load, no vLLM initialization during validation, no provider calls, no Supabase/SQL, no generated assets, no public artifacts, no signed URLs, no worker dispatch, no media processing, no render/export, no credit mutation, and beta/production blocked.

## Decision

Promote the stack by source import, not by stack merge.

The next packet may import fail-closed QWEN-owned source files from #1287, including structured output parser/source, internal caller source, supporting mock records, docs, and smokes. It must not import or execute deployment, Docker build, Cloud Run invocation, model inference, generated asset creation, public artifacts, signed URLs, Supabase, SQL, worker dispatch, credits, render/export, or production unlocks.

#577 remains open/draft/blocked and excluded as source-of-truth.

Product-ready end-to-end local OSS tools: `0`
