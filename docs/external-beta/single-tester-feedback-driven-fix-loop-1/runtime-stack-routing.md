# Runtime Stack Routing

Packet: `RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-DRIVEN-FIX-LOOP-1`

## QWEN Runtime Stack

The current open QWEN2.5-VL PR chain is valuable beta-readiness evidence, but it is not a direct integration merge target.

Routing decision: `fresh_source_import_required_no_blind_stack_merge`

Reason:

- the stack is branch-to-branch rather than directly based on `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`;
- the root branch is not the current integration branch;
- existing source evidence already says direct stack merge and blind cherry-pick are not approved;
- product-readiness movement should import the resolved source intentionally, validate it on current integration, and preserve the active external-beta safety gates.

## Required Next Import Lane

Next runtime-stack lane: `RP-EXTERNAL-BETA-QWEN-RUNTIME-STACK-FRESH-SOURCE-IMPORT-1`

That lane should inspect the existing QWEN docs, diagnostics, route contracts, runtime fixture evidence, and open stacked PRs, then create a fresh current-integration source import with explicit validation. It must not run provider/model calls unless a later packet names the target, confirmation gate, secret boundary, cost boundary, rollback, and accepted fixture scope.

## Current Packet Runtime Status

- QWEN/provider/model execution in this packet: `false`
- Worker dispatch in this packet: `false`
- Route execution in this packet: `false`
- Supabase mutation in this packet: `false`
- SQL execution in this packet: `false`
- Deployment in this packet: `false`
