# ReEditPro canonical V3 local database chain

This directory is the isolated, locally executable database baseline for the
Edit Reference V6 persistence and RPC proof. It does **not** replace or modify
the historical `supabase/migrations/` directory. That raw history remains
frozen with status `blocked_by_parallel_foundations` until a separately
reviewed staging cutover is authorized.

## Scope

The chain provides:

- canonical `auth.users -> profiles -> workspace_members` identity;
- composite workspace/project/edit-session tenant bindings;
- Edit Reference library, study, evidence, asset, DNA, QA, application, audit,
  lifecycle, Study Chat, and long-form study persistence;
- `mutate_edit_reference_application_lifecycle_v3` apply/replace/remove CAS;
- `read_exact_edit_reference_application_state_v2` planning authority;
- `assert_preference_application_plan_current_v1` execution-currentness check;
- durable Kimi K3 -> Qwen 3.7 -> DeepSeek V4 Pro Study Chat attempts, provider
  observations, checkback recovery, receipts, and internal-cost evidence;
- durable pre-plan long-form plans, dependency work items, leases,
  checkpoints, attempts, outputs, pause/resume/cancel, and expired-lease
  recovery without fabricating an approved edit snapshot or credit
  reservation;
- forced RLS with authenticated read scopes and RPC-only mutation;
- a process-branded, loopback-only TypeScript adapter that runs the returned
  SQL receipt and planning read through the frozen V6 backend validators;
- local two-user/two-workspace isolation and adversarial lifecycle/recovery
  tests.

Qwen2.5-VL remains visual-only and is not represented as a Study Chat
reasoning route. Internal provider and infrastructure costs are persisted
without customer price, customer credits, service fee, wallet, or billing
mutation.

## Local verification

Prerequisites are Docker, Supabase CLI, PostgreSQL `psql`, and Node.js. The
runner accepts only the loopback canonical V3 database on port `57432` and
unsets `SUPABASE_ACCESS_TOKEN` before invoking the CLI.

```bash
source /Volumes/REeditproWork/reeditpro-sd-env.zsh
database/canonical-v3-local/run-local-verification.sh
```

The runner starts the isolated local stack if needed, performs a clean local
reset, executes all SQL tests with `ON_ERROR_STOP`, and verifies the source
manifest. Tests run inside transactions and roll back their fixtures.

## Explicitly not authorized or proven

- no remote Supabase link, push, migration, seed, or mutation;
- no staging or production database authority;
- no deployed Auth/RLS/Storage evidence;
- no provider or Google Cloud execution;
- no customer pricing, credits, wallet, billing, or service-fee mutation;
- no deployment, public delivery, or production-readiness claim.

Any staging use requires a separate owner authorization, a reviewed forward
adapter from this isolated chain, same-source migration hashes, controlled
backup/rollback evidence, and independent two-user/two-workspace RLS proof.
