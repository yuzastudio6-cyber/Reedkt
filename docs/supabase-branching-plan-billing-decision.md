# Supabase Branching Plan Billing Decision

Decision: `blocked_pending_operator_billing_action`

Approval status: `not_approved_for_branch_create_rerun`

Target: `wmyyttnynmteqgcdishd` / `reeditpro-internal-staging-clean`

This packet reviews Supabase branching plan and billing readiness only. It does not create a branch, mutate billing, upgrade a plan, run SQL, deploy migrations, repair migration history, write Track B backfill rows, submit support tickets, touch production, or read secret payloads.

## Source Evidence

- PR #283 failure class: `branch_create_plan_or_billing_unavailable`
- PR #283 deterministic retry possible: `false`
- PR #280 clean target approval: `approved_for_future_clean_supabase_staging_branch`
- PR #198 Track B backfill remains separate: `true`
- Registry migration present: `true`

## Cost Estimate

- Default Micro branch hourly starting rate: `$0.01344`
- 24-hour estimate: `$0.32256`
- 6-day internal testing estimate: `$1.93536`
- 30-day if left running estimate: `$9.6768`

Usage unknowns such as egress, disk, storage, quota, and branch size/region effects are not guessed in this packet.

## Required Next Action

The current decision remains blocked until an operator completes and records the Supabase billing/branching dashboard action and cost-owner approval in repo-safe metadata.

## Documentation Basis

- Supabase Branching: https://supabase.com/docs/guides/deployment/branching
- Supabase Branching usage and pricing: https://supabase.com/docs/guides/platform/manage-your-usage/branching
- Supabase CLI reference: https://supabase.com/docs/reference/cli/introduction
- Supabase db push reference: https://supabase.com/docs/reference/cli/supabase-db-push
