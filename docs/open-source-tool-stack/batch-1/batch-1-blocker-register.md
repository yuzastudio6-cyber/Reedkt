# Batch 1 Blocker Register

Decision: `blocked_pending_package_lock_sync_review`.

## package_lock_sync_review

Outcome: `blocked_pending_package_lock_sync_review`

Severity: `blocking`

Evidence:
- missing @emnapi/runtime@1.11.1
- missing @emnapi/core@1.11.1
- invalid @emnapi/wasi-threads@1.2.1 not satisfying 1.2.2
- missing @emnapi/core@1.10.0
- missing @emnapi/runtime@1.10.0
- missing @emnapi/wasi-threads@1.2.1

Resolution prompt: `DEPENDENCY_BASELINE_REPAIR_BEFORE_TOOL_BATCH_1`.

## install_proof_execution_not_authorized

Outcome: `blocked_pending_separate_approval_after_baseline_repair`

Severity: `blocking`

Evidence:
- Batch 1 approval packet is docs/diagnostics only

Resolution prompt: `DEPENDENCY_BASELINE_REPAIR_BEFORE_TOOL_BATCH_1`.
