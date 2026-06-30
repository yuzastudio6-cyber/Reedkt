# RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL-1

Use after `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-PLAN-1`.

## Goal

Approve or reject one controlled QWEN persisted-worker-dispatch approved-fixture inference attempt.

## Required Inputs

- Confirmation gate: `REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE=true`.
- Exact staging target and region.
- Approved tester account.
- Approved snapshot fixture ID or sanitized fixture reference.
- Credit no-spend policy.
- Queue lease or persisted job reference.
- Idempotency key.
- Private input manifest.
- Private output manifest and checksum policy.
- Timeout and cost ceiling.
- Fail-closed restore plan.
- Rollback path.
- Cleanup policy.

## Boundary

Approval must remain single-request and fixture-only. It must not authorize broad provider/model calls, arbitrary media, public artifacts, signed URLs as source-of-truth, credit spend, paid production, final delivery/export, broad external beta, or production unlock.
