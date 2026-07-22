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
- `apply_exact_edit_preferences_and_reference_v1` as the one outer exact-edit
  Apply transaction for generic preference changes and the optional nested
  Edit Reference lifecycle command;
- `read_exact_edit_apply_authority_v1` as the sanitized, tenant-bound
  optimistic-concurrency read that supplies record, planning, frame, and
  selected-application digests before the outer transaction re-reads them;
- `read_exact_edit_planning_authority_v1` as the one read-only, exact-edit
  preference authority for canonical planning, including the immutable
  creation baseline, current seven-field values, planning revision, confirmed
  frame, and source-preparation state;
- `record_exact_edit_planning_evidence_v1` as the server-planning handoff that
  binds verified source-candidate and cleanup evidence without changing the
  user's preferences, the planning revision, or any approved snapshot;
- `prepare_edit_reference_application_v1` as the service-role-only,
  idempotent preparation transaction that re-reads approved reference, DNA,
  QA, and exact-target study authority before creating one unconnected
  application; authenticated browser credentials cannot execute it directly;
- `mutate_edit_reference_domain_command_v2` as the service-role-only,
  operation-safe library and study mutation transaction. It preserves the six
  V1 create/update/message/evidence commands and adds bounded, server-prepared
  manual evidence study, Preference DNA synthesis, DNA QA, and DNA approval
  commands without accepting a browser-shaped replacement aggregate;
- `read_edit_reference_domain_aggregate_v2` as the paired service-role-only,
  tenant-bound library and study read, plus
  `read_edit_reference_domain_idempotency_v1` for exact committed-receipt
  recovery before server-side preparation is recomputed. The loopback server
  adapter keeps the service credential inside the backend closure and exposes
  only the existing authenticated ReEditPro HTTP contract;
- `read_exact_edit_reference_application_state_v2` planning authority;
- `assert_preference_application_plan_current_v1` execution-currentness check;
- durable Kimi K3 -> Qwen 3.7 -> DeepSeek V4 Pro Study Chat attempts, provider
  observations, checkback recovery, receipts, and internal-cost evidence;
- durable pre-plan long-form plans, dependency work items, leases,
  checkpoints, attempts, outputs, pause/resume/cancel, and expired-lease
  recovery without fabricating an approved edit snapshot or credit
  reservation;
- `reeditpro_read_pre_plan_study_projection_v1` as the authenticated,
  server-signed, read-only projection used to reconstruct the existing
  high-level Edit Reference study plan and run after a process restart. It is
  not an eighth mutation operation and exposes no lease credential;
- a local-only bridge from the existing Edit Reference long-form runtime port
  to the canonical distributed pre-plan state authority. The bridge compiles
  a six-hour source into 36 bounded chunks and 292 dependency work items,
  persists the two verified ingest/probe preflight results, recovers an exact
  lost claim response, and reads pause/resume/cancel state back from
  PostgreSQL. Worker dispatch and private-object reads remain blocked;
- `reeditpro_register_pre_plan_source_v1` as the authenticated, tenant-bound
  registration of server-verified finalized Preference media before enqueue,
  plus an append-only long-form domain event projection for start/control
  state. The immutable evidence asset is never rewritten, and the paired
  service-role domain RPC revalidates exact plan/run/source/work-count lineage;
- append-only exact-edit Brief versions plus authenticated, server-signed
  save/read RPCs. Each version is bound to the exact workspace, project,
  named edit, finalized source identities, author, revision, and content
  digest; opening or reading a Brief never mutates it;
- `reeditpro_register_target_pre_plan_source_v1` as the matching target-video
  registration path. It binds the exact current Brief revision/digest and
  named-edit identity to a distinct target source ID, then uses the same
  distributed pre-plan queue and lease authority as library study rather than
  introducing a second target-study scheduler;
- forced RLS with authenticated read scopes and RPC-only mutation;
- process-branded, loopback-only TypeScript adapters that run SQL receipts and
  planning reads through the frozen V6 backend validators;
- a real local PostgREST HTTP proof using authenticated, locally signed JWTs
  for exact-edit authority reads and Apply, plus a server-owned loopback
  service-role transport for the explicit library/study command and read RPCs.
  No service-role credential reaches browser code, logs, or response data;
- a mounted signed-in Chromium proof against that same isolated reset. It
  recovers the workspace through authenticated RLS, creates a library
  preference, persists Study Chat direction, studies evidence, synthesizes
  immutable DNA, runs QA, recovers a committed approval after response loss,
  supersedes it through a correction, approves the replacement, and restores
  the exact state after reload;
- a second mounted Chromium proof that uploads a private reference video,
  starts the canonical distributed study through a request-scoped runtime,
  denies another user/workspace, pauses, reloads the exact checkpoint, and
  resumes the same durable run without a second source or queue authority;
- local two-user/two-workspace isolation and adversarial lifecycle,
  server-owned application preparation/replay/conflict, atomic Apply,
  planning-authority read/evidence/replay, immutable-baseline, cleanup
  invalidation, evidence/DNA/QA/approval replay, recovery, direct-RPC/table
  denial, and internal-cost tests.
- a destructive local backup/reset/restore rehearsal covering all 51 reviewed
  canonical data tables, an exact logical-state digest, immutable approved and
  audit history, exact Apply replay/conflict recovery, and restored tenant RLS.

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
reset, executes all SQL tests with `ON_ERROR_STOP`, verifies the local adapter,
provisions two local Auth users, installs the controlled fixture, exercises the
actual loopback PostgREST RPC and RLS path, runs the mounted signed-in Chromium
journey, and performs a private data-only backup/reset/restore rehearsal with
the PostgreSQL 15 tools from the matching local database container, verifies
the source manifest, and performs a final clean reset. SQL tests run inside
transactions and roll back their fixtures. Recovery archives stay under the
external-drive checkout with mode-077 process defaults and are deleted by the
runner; the HTTP proof and restored fixture are also removed by the final
reset. A failed final reset or private runtime-directory cleanup makes the
rehearsal fail closed.

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
The local recovery rehearsal is necessary evidence, but it is not Supabase
PITR, remote backup, staging restore, disaster-recovery, or production proof.
