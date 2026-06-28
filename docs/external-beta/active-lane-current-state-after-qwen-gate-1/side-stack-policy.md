# QWEN Side-Stack Policy

Packet: `RP-EXTERNAL-BETA-ACTIVE-LANE-CURRENT-STATE-AFTER-QWEN-GATE-1`

The open `QWEN2_5_VL backend runtime persistence` PR series is treated as a side stack unless and until it is reconciled onto the current integration branch with a fresh source import or explicit stack-adoption packet.

Current policy:

- Do not blindly merge stacked QWEN persistence PRs into the active external beta lane.
- Do not cherry-pick side-stack changes without source audit, duplicate scan, validation, and conflict review.
- Keep the active single-tester beta lane based on the already merged QWEN route/runtime, staging persistence, and controlled product-flow evidence.
- If a concrete feedback issue requires side-stack code, route it through `RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1` with exact source files, risk, validation, and rollback notes.

Side-stack status: `fresh_source_import_required_no_blind_stack_merge`

Active-lane blocker from side stack: `none_without_actionable_single_tester_feedback_issue`
