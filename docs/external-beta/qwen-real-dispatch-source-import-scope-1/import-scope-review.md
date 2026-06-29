# QWEN Real Dispatch Import Scope Review

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-SOURCE-IMPORT-SCOPE-1`

Decision: `completed_qwen_real_dispatch_source_import_scope_review_surgical_mock_import_required`

Execution: `completed_docs_only_qwen_source_import_scope_review_no_runtime_execution`

## Scope Decision

The #1695 branch is not accepted for direct import or merge. It can be used only as draft evidence for a fresh current-integration mock-only source import.

Decision detail: `blocked_full_stack_import_rejected_surgical_mock_source_import_required`.

## Candidate Evidence From #1695

The stacked PR diff for #1695 contains these candidate source records:

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval-smoke.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup.ts`
- `server/smoke/qwen2-5-vl-cloud-run-gpu-private-invoke-readiness-rollup-smoke.ts`
- `docs/qwen2-5-vl-7b-planner-ui-surfacing.md`
- `src/lib/qwen-vl-planner-routing-ui.ts`
- `server/smoke/qwen2-5-vl-planner-ui-surfacing-smoke.ts`
- `package.json`

These files are not automatically accepted. They must be recreated or imported in a smaller current-integration packet only if their dependency chain is bounded.

## Dependency Fanout Found

The top approval mock imports the lower execution plan mock:

- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.ts`

The approval smoke also requires:

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan-smoke.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`

The worker runtime source fans out into lease, idempotency, private-invoke, and dispatch adapter surfaces. That worker runtime chain is not accepted for import in this scope packet because it would cross from mock/source records into runtime implementation surfaces without a current-integration source-import proof.

## Required Next Import Shape

Next milestone: `QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1`.

That milestone should:

- start from current integration after this packet;
- recreate a self-contained mock-only real-dispatch plan/approval/preflight record;
- avoid importing the #1695 worker runtime source file;
- keep all runtime flags false until a later explicit confirmation-gated runtime packet;
- preserve approved snapshot, credit reservation, private artifact, idempotency, lease, audit, QA, and cleanup requirements as requirements only;
- prove the smoke/diagnostics are bounded and do not dispatch workers, invoke Cloud Run, run QWEN inference, touch Supabase, write SQL, create generated assets, mutate credits, or unlock beta/production.

Product-ready end-to-end local OSS tools: `0`.
