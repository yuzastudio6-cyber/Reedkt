# Supabase Clean Staging Branch Rerun After Billing

Use this prompt only after the Supabase branching plan/billing blocker is resolved by repo-safe operator evidence.

## Current Packet

- Decision: `blocked_pending_operator_billing_action`
- Required blocker to clear: `operator_billing_action_missing`
- Target project ref: `wmyyttnynmteqgcdishd`
- Target branch: `reeditpro-internal-staging-clean`
- Persistent: `true`
- With data: `false`

## Required Future Behavior

- Rerun PR #283 clean staging branch execution only after billing/branching enablement and cost-owner approval are recorded.
- Keep the branch data-less and persistent for internal staging only.
- Apply migrations only through the approved migration-safe workflow in the clean branch execution phase.
- Verify schema/RLS and migration history before any Track B milestone backfill.
- Keep Track B backfill writes as a later separate guarded phase.

## Still Forbidden

No production Supabase, billing mutation by Codex, plan upgrade by Codex, current staging reset, migration repair, direct SQL, Track B writes, support ticket submission, provider/tool/worker/media execution, Track A, beta, or production unlock is authorized by this packet.
