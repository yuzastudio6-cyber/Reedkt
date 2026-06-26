# SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1

Use this after `SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1`.

## Current Blocker

The guarded replacement runner created replacement branch candidate `reeditpro-clean-staging-v2` / `rjenorvzqsxwljvvvtxd` under non-production parent project `Reeditpro` / `wmyyttnynmteqgcdishd`, then stopped before DB URL secret rotation.

Reason: read-only migration history showed remote-only migration `20260626163138`, so the replacement branch is not source-aligned for migration-chain apply.

## Required Work

Implement a docs/status/diagnostics-only source-mapping packet that inspects repository and lane evidence for remote-only migration `20260626163138`.

Decide whether:

- `20260626163138` maps to a committed migration such as `20260625031135_rp_data_03_internal_beta_static_gap_contract.sql`;
- a later explicit migration-history repair policy is safe;
- a different isolated non-production Supabase target is required;
- the unadopted replacement branch should be cleaned up under a separate explicit gate.

## Boundaries

Do not rotate `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`, run migration apply or dry-run, run `supabase db pull`, run direct SQL mutation, delete/reset branches, create storage objects, execute service-role routes/workers/providers/media, create signed/public artifacts, or unlock internal beta, external beta, production, or final delivery.
