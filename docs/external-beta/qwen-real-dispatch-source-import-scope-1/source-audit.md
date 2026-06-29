# QWEN Real Dispatch Source Import Scope Audit

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-SOURCE-IMPORT-SCOPE-1`

Decision: `completed_qwen_real_dispatch_source_import_scope_review_surgical_mock_import_required`

Execution: `completed_docs_only_qwen_source_import_scope_review_no_runtime_execution`

Integration base: `e149ca8bf962b8438d97f2c4a5c252a09caaa37c`

Readback date: `2026-06-29`

This packet continues the external-beta QWEN2.5-VL persisted worker dispatch lane after `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-DRAFT-STACK-TRIAGE-1`. It inspects the live draft stack and deliberately rejects a wholesale import into current integration.

## Source Chain

- #1699 is merged at `e149ca8bf962b8438d97f2c4a5c252a09caaa37c` and records `completed_qwen_persisted_worker_dispatch_draft_stack_triage_no_blind_merge`.
- PR #1695 remains open/draft and records the top real-dispatch execution approval shape at head `634d4a81ed720834d67622291c6e4fc810ef61d5`.
- PR #1690 remains open/draft and records the lower real-dispatch execution plan shape at head `83b8bda891ce36e61551088ed46f297a4f10a6b9`.
- PR #1702 is a newer open/draft preflight branch stacked on #1695, with head `89d7a9ddde85cff3cd4abd4547a3abb65b570d18` and base `634d4a81ed720834d67622291c6e4fc810ef61d5`; it is evidence only and not source-of-truth.
- PR #1686 remains open/draft and blocked by `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`.
- PR #577 remains open/draft/blocked/excluded as source-of-truth.

## Current-Integration Diff Result

Comparing current integration `e149ca8bf962b8438d97f2c4a5c252a09caaa37c` to #1695's draft branch produced an unsafe import surface:

- Diff size: `5150` files changed.
- Insertions: `278957`.
- Deletions: `267632`.
- Risk signal: deletes many accepted activation/source docs and touches Docker, Supabase, SQL/migration, server/runtime, route, worker, and package surfaces.
- Import decision: `blocked_full_stack_import_rejected_surgical_mock_source_import_required`.

The GitHub PR diff for #1695 against its stacked base shows only `10` files, which is why a live stacked PR readback can look deceptively small. The current-integration comparison is the safe source-import gate.

## Boundary

No full draft stack import, PR merge, retarget, branch rewrite, source code import, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, identity token fetch, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
