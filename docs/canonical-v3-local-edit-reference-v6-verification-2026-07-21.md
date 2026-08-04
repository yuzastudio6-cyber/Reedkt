# Canonical V3 local Edit Reference V6 verification

Date: 2026-07-21

## Verdict

The owner-authorized, local-only canonical V3 database chain is executable and
verified for Edit Reference V6 persistence, RPC behavior, recovery, and
two-user/two-workspace isolation.

This proof does not modify or supersede `supabase/migrations/`. That historical
chain remains frozen with status `blocked_by_parallel_foundations`. No remote
Supabase project, cloud service, provider, billing system, deployment, or
production environment was contacted or changed.

## Repository identity

- checkout: `/Volumes/REeditproWork/reeditpro-canonical-ui-integration`
- branch: `codex/edit-reference-canonical-integration`
- authorized base commit: `89f3786f0a5ca7c14969f2b4de56ab22d35ff435`
- authorized base tree: `7187e1656bb4651cce4db90f1f8eeb36a0235d07`
- execution scope: local only
- remote mutation allowed: false
- production authority: false

## Isolated migration chain

The executable proof lives under `database/canonical-v3-local/` and uses a
separate local Supabase project and loopback ports. The chain contains:

1. `202607210001_identity_and_exact_edit_authority.sql`
   - canonical `auth.users -> profiles -> workspace_members` identity;
   - composite workspace/project/edit-session tenant bindings;
   - exact-edit preference state, plans, estimates, snapshots, and execution
     authority;
   - forced RLS and authenticated read policies with RPC-only mutation.
2. `202607210002_edit_reference_v6_schema.sql`
   - Edit Reference library, studies, evidence, assets, DNA, QA, application,
     audit, idempotency, lifecycle, Study Chat, and long-form persistence;
   - pre-plan study authority without fabricated approved snapshots or credit
     reservations.
3. `202607210003_edit_reference_v6_security_and_rpcs.sql`
   - `mutate_edit_reference_application_lifecycle_v3`;
   - `read_exact_edit_reference_application_state_v2`;
   - `assert_preference_application_plan_current_v1`;
   - 13 Study Chat operations;
   - 9 long-form operations;
   - immutable-history triggers, grants, forced RLS, CAS, replay, lease,
     checkpoint, recovery, and cost rules.

The live post-reset catalog contained 37 public tables and all 37 had forced
RLS enabled. The catalog contained exactly 13 Study Chat operations, 9
long-form operations, and the 3 named lifecycle/planning operations.

## Runtime boundary

`server/edit-references/edit-reference-local-supabase-rpc-adapter.ts` is a
process-branded, loopback-only adapter for the isolated local proof. It:

- accepts only the canonical local API origin on port 57431;
- delegates returned lifecycle and planning data to the frozen V6 validators;
- rejects remote origins and any attempted production promotion;
- does not construct a live hosted repository, provider, worker, or billing
  authority.

The associated smoke executes the real local SQL lifecycle RPC and planning
read inside a rolled-back transaction and validates the resulting receipt
through the TypeScript contract.

## Local database verification

`database/canonical-v3-local/run-local-verification.sh` was run from the
authorized external-drive checkout. The runner:

- unsets `SUPABASE_ACCESS_TOKEN`;
- refuses any non-loopback database URL;
- starts only the isolated local Supabase stack when needed;
- performs a clean local reset;
- executes every SQL test with `ON_ERROR_STOP`;
- runs the TypeScript local-adapter smoke;
- verifies the source manifest.

The final run passed:

- `001_two_user_two_workspace_rls.sql`;
- `002_edit_reference_v6_lifecycle_rpc.sql`;
- `003_edit_reference_v6_recovery_and_cost.sql`;
- `004_schema_security_invariants.sql`;
- the actual-SQL TypeScript adapter proof;
- the 15-file source manifest.

The tests prove:

- two users cannot read or mutate each other's workspaces, projects, edits,
  references, studies, applications, attempts, checkpoints, outputs, or costs;
- viewer access cannot cross the write-authority boundary;
- apply, replace, and remove use exact revision-bound CAS;
- lifecycle changes invalidate stale draft plans and estimates and revoke
  affected execution authority without mutating approved snapshots or history;
- source/application/DNA/QA/frame/request/planning lineage is exact;
- completed Study Chat responses, unknown provider outcomes, checkbacks,
  fallback ordering, replay, and terminal reconciliation are bounded;
- Kimi K3 is primary, Qwen 3.7 is first fallback, DeepSeek V4 Pro is final
  fallback, and Qwen2.5-VL cannot satisfy reasoning;
- failed provider-attempt cost is retained and Qwen production-scoped cost
  requires versioned CNY-to-USD FX evidence;
- long-form work supports dependency scheduling, one active digest-only lease,
  monotonic heartbeat/checkpointing, pause/resume/cancel, terminal outputs,
  cost evidence, and expired-lease recovery;
- valid large or six-hour-like source metadata is not rejected by a simple
  size or whole-study timeout rule;
- internal provider and infrastructure cost remains separate from customer
  price, credits, service fee, wallet, and billing.

## Repository verification

The following checks passed against this source:

- `npm run typecheck:server`;
- focused ESLint for the local adapter and smoke;
- `npm run lint`;
- `npm run build`;
- `npm run check:frontend-boundary` (855 files);
- `npm run check:secrets` (4,873 files, zero secret values printed);
- Edit Reference application-lifecycle smoke;
- Edit Reference production-planning-context smoke;
- Edit Reference long-form persistence-contract smoke;
- Edit Reference Study Chat persistence smoke;
- Edit Reference Study Chat reasoning-receipt smoke;
- shared planning Preference-application-authority-port smoke;
- `git diff --check` after staging.

The build emitted only the already-disclosed ineffective-dynamic-import and
large-chunk warnings. No test was weakened or silently skipped.

## Defects found and corrected during local execution

- terminal long-form checkpoint copying is limited to checkpoint sequences not
  already persisted, so a retry cannot violate checkpoint uniqueness;
- terminal Study Chat settlement closes outstanding checkbacks;
- an unknown provider outcome requires a checkback and may reconcile only
  through the controlled unknown-to-final path;
- completed, failed, and cancelled provider outcomes remain immutable;
- reconciliation cost excludes the current attempt and cannot regress;
- required digest guards are null-safe and fail closed;
- missing versioned Qwen FX fails closed;
- lifecycle requests require the exact V6 request schema and RPC identity;
- output-frame lineage requires the exact frozen schema and rejects
  browser-supplied authority.

## Source integrity

`database/canonical-v3-local/manifest.json` records the exact SHA-256 hashes of
the isolated config, migrations, tests, runner, verifier, README, and two
repository adapter files. `database/canonical-v3-local/verify.mjs` passed with
3 migrations and 15 total manifest entries.

Migration SHA-256 values:

- `202607210001_identity_and_exact_edit_authority.sql`:
  `b16d43cc5b3e47bc83583ad3e86ab15529a6d9dafd06844b5c403d34ffe77867`
- `202607210002_edit_reference_v6_schema.sql`:
  `35618686aab6111003d2cda59c1e10a5f51472125275aac467de6faabd5b7445`
- `202607210003_edit_reference_v6_security_and_rpcs.sql`:
  `97adf4a7e85d9419818e37f0ca73fdab7d52649b7ba68f1bc01f6f14b80e6523`

## Raw baseline and remaining gates

The existing raw migration audit still reports
`blocked_by_parallel_foundations`; the existing raw security audit still
reports `blocked_by_security_findings`. Those results describe the frozen
historical `supabase/migrations/` chain, not the isolated V3 local proof. They
were not hidden, weakened, or reclassified.

Still required before any staging or production claim:

- a reviewed forward migration/cutover plan from the isolated chain;
- controlled backup, restore, rollback, and same-source migration evidence;
- owner authorization for staging;
- live Auth/RLS/Storage and two-user/two-workspace staging proof;
- qualified server-only repository/RPC adapters and release receipts;
- deployed provider, checkback, worker, large-media, and recovery evidence;
- separate customer pricing, credit, wallet, billing, and settlement work;
- deployment, public delivery, and independent production acceptance.

Until those gates pass, `productionReady=false` and all remote actions remain
disabled.
