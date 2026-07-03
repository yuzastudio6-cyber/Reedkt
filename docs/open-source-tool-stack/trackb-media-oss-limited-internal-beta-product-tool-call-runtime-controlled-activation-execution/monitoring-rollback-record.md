# Monitoring And Rollback Record

Decision: `trackb_media_oss_limited_internal_beta_product_tool_call_runtime_controlled_activation_execution_passed_ready_for_controlled_activation_qa_review`

The bounded activation artifact records sanitized monitoring shape only. It includes tool id, use case, ranking decision, and gate status. It excludes artifact paths, signed URLs, raw prompts, secret material, Supabase writes, and GCS writes.

Rollback remains a source-of-truth shape, not a live runtime action. The recorded rollback disables route runtime, worker dispatch, and per-tool allowlists, and requires an audit comment before a future live lane can claim rollback execution.
