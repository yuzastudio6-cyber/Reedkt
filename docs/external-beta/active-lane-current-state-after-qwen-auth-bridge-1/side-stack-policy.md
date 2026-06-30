# Side Stack Policy

Packet: `RP-EXTERNAL-BETA-ACTIVE-LANE-CURRENT-STATE-AFTER-QWEN-AUTH-BRIDGE-1`

Open QWEN persisted worker dispatch PRs remain side-stack evidence only.

## Current Policy

- Draft stack merge policy: `fresh_source_import_required_no_blind_stack_merge`.
- Active lane blocker from draft stack: `none_without_actionable_single_tester_feedback_issue`.
- PR #1794 status: `open_draft_mergeable_clean_evidence_only`.
- PR #1788 status: `open_draft_evidence_only`.
- Blind merge approved: `false`.
- Branch rewrite approved: `false`.

## Why

The active single-tester lane already has accepted QWEN product-flow runtime evidence and the staging auth bridge now closes the route/auth handoff gap. The remaining draft transport stack represents a deeper persisted-worker-dispatch path. It should be imported only through a current-base packet that names the exact source files, expected behavior, confirmation gates, rollback path, and validation plan.

## Next Safe Route

If owner-tester feedback exposes a concrete runtime defect, use `RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1`.

If the product decision is to advance persisted-worker dispatch without a feedback issue, use `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-SOURCE-IMPORT-1`.
