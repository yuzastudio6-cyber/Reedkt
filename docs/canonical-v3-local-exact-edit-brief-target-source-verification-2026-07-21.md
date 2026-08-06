# Canonical V3 Local Exact Edit Brief And Target Source — 2026-07-21

Status: `local_contract_and_runtime_verified_production_blocked`

This bounded slice connects the exact named-edit Brief and target-video source
to the same request-scoped canonical V3 authority already used by the Edit
Preference library study. It does not modify the frozen historical
`supabase/migrations/` chain and performs no remote Supabase, cloud, provider,
billing, deployment, or public action.

## Authority and flow

Migration 013 adds one append-only `exact_edit_brief_versions` table and three
authenticated, server-signed loopback RPCs:

- `reeditpro_save_exact_edit_brief_v1` writes an idempotent immutable version
  bound to workspace, project, named edit, finalized source storage/media
  identities, author, revision, and content digest;
- `reeditpro_read_exact_edit_brief_v1` reads only the latest tenant-visible
  version without mutating it; and
- `reeditpro_register_target_pre_plan_source_v1` registers a distinct target
  source only after re-reading the exact Brief ID, revision, digest, target
  project/edit, reference/study, and finalized media lineage.

The target source enters the existing canonical source registry and the same
distributed pre-plan study transaction/lease/checkpoint/recovery authority.
It is marked `sourceAuthority=target_source_media`; it is not presented as
user Preference evidence and it does not create a second queue, scheduler,
lease, cost, or persistence authority.

The mounted server context resolves a new request-scoped exact-Brief port from
the authenticated user JWT. Browser input cannot select the RPC, database,
tenant, revision, digest, or source-registration authority. The legacy
backend-local Brief store remains only as the explicit mock/local fallback
when the canonical factory is absent and cannot self-promote.

## Focused proof

The isolated loopback PostgREST/RLS smoke verifies:

- Brief insert, exact idempotent replay, revision 2, and latest-version read;
- owner-B denial against owner-A's exact edit;
- a two-hour, 80 GiB target plan compiled into 100 dependency work items;
- two verified preflight checkpoints before all downstream work remains
  queued;
- target-source registration and exact create replay through the existing
  distributed queue;
- direct authenticated browser-table access remains denied;
- cross-tenant target-source mutation remains denied; and
- a forged Brief digest cannot register or enqueue another target source.

The six-hour library-reference regression remains 36 chunks and 292 work
items, proving the new target discriminator does not weaken the established
multi-hour path.

The uninterrupted aggregate then passed both mounted signed-in Chromium
journeys, the application/lifecycle postconditions, and a destructive
backup/reset/restore rehearsal across all 51 reviewed data tables. The
private recovery archive SHA-256 was
`6697ca6f1a86b260f64e0a11b5c4cc75f94deda9f3443a1f00ccd19b00737d7d`;
the restored logical-state SHA-256 was
`6064ac90d4d52a421f11657cb49bceab733c93e1f6e84307d570d7bcccb8af7d`.
The isolated manifest verified 13 migrations and 148 source/evidence files.

## Deliberately closed gates

This remains isolated local evidence with `productionAuthority=false`.
Worker dispatch, private-object reads by a deployed worker, semantic provider
execution, durable target-understanding package persistence, deployed
Auth/RLS/Storage, multi-replica recovery, customer pricing/credits/service
fees, billing, deployment, and public delivery remain closed.

The next bounded integration must persist the target-understanding package
and its evidence/DNA/QA lineage through canonical RPC authority before the
exact-edit application can consume it. No current local success is classified
as hosted or production readiness.
