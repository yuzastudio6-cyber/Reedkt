# RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-SOURCE-IMPORT-1

Use this prompt only if the product decision is to advance the QWEN persisted-worker-dispatch draft stack after `RP-EXTERNAL-BETA-ACTIVE-LANE-CURRENT-STATE-AFTER-QWEN-AUTH-BRIDGE-1`.

## Goal

Import the minimum current-base source required to review the persisted-worker-dispatch transport path without blindly merging draft PRs.

## Required Boundary

- Start from the latest integration branch.
- Treat PR #1794 and related QWEN transport PRs as evidence, not merge targets.
- Name the exact source files, runtime gates, approved snapshot fixture, credit no-spend policy, queue/idempotency references, artifact/checksum policy, timeout/cost guard, and rollback path.
- Keep broad external beta, public artifacts, paid production, final delivery/export, arbitrary media, and production unlock blocked.

## Forbidden By Default

No QWEN inference, provider/model call, Cloud Run job execution, worker dispatch, Supabase mutation, SQL execution, signed/public artifact creation, credit mutation, media processing, or deployment is allowed unless a later packet explicitly authorizes that exact action with a confirmation gate and rollback plan.
