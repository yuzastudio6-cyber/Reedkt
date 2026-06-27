# Stack Integration Decision

Decision: `completed_tool_runtime_stack_integration_triage_ready_for_qwen_rollup_bridge`

Execution: `completed_docs_only_stack_triage_no_pr_merge_or_runtime_execution`

Primary next integration candidate: `QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1`

AI Graphics/tool stack action: `AI_GRAPHICS_TOOL_STACK_SPLIT_REPAIR_RETIREMENT_TRIAGE_1`

Sound/tool-calling stack action: `SOUND_TOOL_CALLING_STACK_SPLIT_REPAIR_RETIREMENT_TRIAGE_1`

#577 Remotion action: `keep_excluded_until_runtime_proof_repaired_and_validated`

Product-ready end-to-end local OSS tools: `0`

## Decision Rationale

The QWEN2.5-VL stack is clean and mostly non-draft, so it is the best candidate for a fresh integration-based rollup bridge. However, because it is stacked on non-integration branches, it should not be merged piecemeal or treated as current product source-of-truth until a new integration-based packet reconciles it.

The AI Graphics/tool stack is entirely draft in the inspected set and contains dirty/unknown PRs. It needs split/repair/retirement triage before any production-facing claim.

The Sound/tool-calling stack is draft and should not block the QWEN rollup bridge.

## Safe Forward Path

1. Create `QWEN2_5_VL_EXTERNAL_BETA_STACK_INTEGRATION_ROLLUP_1` from current integration.
2. Read #982 through #1282 evidence and classify source/runtime changes that remain necessary.
3. Create a fresh integration-based bridge PR instead of merging old stacked branches directly.
4. Keep provider/model execution gated by approved snapshot, credit reservation, private artifact policy, runtime flags, and service-side secrets.
5. Keep broad external beta and production blocked until the resulting runtime lane has passed explicit external beta validation.
