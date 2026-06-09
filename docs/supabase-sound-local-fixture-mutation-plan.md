# SUPABASE-SOUND-1 Local Fixture Mutation Plan

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This document is a mutation plan only.
- This document does not execute SQL.
- This document does not deploy migrations.
- This document does not create rows.
- This document does not create storage buckets or objects.
- This document does not create signed URLs.
- This document does not unlock generated_local_fixture_passed.

SUPABASE-SOUND-1 is plan-only. It describes the future Supabase/RLS/Storage mutation path for SOUND generated/local fixture records, but it does not execute that path. Live fixture execution, staging fixture execution, public artifact delivery, signed URL delivery, raw prompt execution, beta, external beta, paid production, and production remain blocked.

## Source-Of-Truth Rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs are blocked. Public artifacts are blocked. Source media must remain immutable. The private path, checksum, manifest, and approved plan snapshot must align before any future fixture execution can claim generated_local_fixture_passed.

## Raw Prompt Rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution is blocked. Supabase records must not store raw prompt execution payloads for workers. Worker-oriented records must reference approved snapshots, structured findings, edit intents, manifests, idempotency metadata, and private source-of-truth references instead of mutable chat text.

## Plan-Only Acceptance

Plan-only continuation is accepted. Local-only fixture planning with mock/reference IDs is accepted. Live fixture execution is blocked until a future accepted mutation/execution prompt explicitly creates draft migrations, tests, and owner-reviewed local fixture rows in an approved environment.

This plan is based on SOUND-3D owner acceptance evidence, the SOUND generated/local fixture handoff packet, the SOUND generated/local fixture plan, local migration sources, read-only Supabase metadata, and read-only advisor findings.

## Source Files And Metadata Inspected

- `docs/sound-music-audio-owner-acceptance-checklist.md`
- `docs/sound-music-audio-generated-local-fixture-handoff-packet.md`
- `docs/sound-music-audio-generated-local-fixture-plan.md`
- `docs/cross-chat/SOUND_MUSIC_AUDIO.md`
- `production-readiness-review.md`
- `docs/production-milestone-index.md`
- production audio, artifact, QA, SoundSync, Google Cloud audio worker, and Google Cloud SFX worker policy docs
- `README.md`
- `AGENTS.md`
- `package.json`
- `supabase/migration-order.md`
- `supabase/schema-health-checks.sql`
- `supabase/migrations/*`
- `database/test-sql/*`
- `database/migration-drafts/*`
- `src/backend/cloud/approved-plan-snapshot-contracts.ts`

Optional source-map/runtime docs listed by the prompt were missing and were not created: runtime unlock roadmap, Phase 53A runtime roadmap, tool-call foundation, worker-runtime foundation, worker-claim hardening, provider-gateway foundation, compliance/license/security foundation, observability/audit/cost foundation, Supabase milestone sync policy, source-of-truth map, and production foundation status.

Read-only Supabase metadata confirmed the active project is Reeditpro with project ref `wmyyttnynmteqgcdishd`. Edge Functions are empty. Local migration history and live migration metadata do not yet align for every later local migration file, so SUPABASE-SOUND-2 must start with migration-order/ledger reconciliation before drafting any migration.

## Live Read-Only Metadata Summary

- `feature_gates`: present, RLS enabled, 43 rows, fail-closed readiness ledger.
- `tool_capabilities`: present, RLS enabled, 85 rows, readiness ledger.
- `worker_runtime_configs`: present, RLS enabled, 0 rows.
- `approved_plan_snapshots`: present, RLS enabled, 0 rows.
- `storage.buckets`: present, RLS enabled, 0 rows.
- `storage.objects`: present, RLS enabled, 0 rows.
- `storage_object_records`: present, RLS enabled, 0 rows.
- `signed_url_events`: present, RLS enabled, 0 rows.
- `generation_requests`: present, RLS enabled, 0 rows.
- `generated_assets`: present, RLS enabled, 0 rows.
- `jobs` and `job_events`: present, RLS enabled, 0 rows.
- `sound_effect_plans`, `ambient_sound_plans`, `music_plans`, and `audio_environment_analysis`: present, RLS enabled, 0 rows.
- `credit_estimates`, `credit_approvals`, and `credit_reservations`: present, RLS enabled, 0 rows.
- `qa_reports` and `qa_report_items`: present, RLS enabled, 0 rows.
- `provider_request_attempts` and `provider_webhook_events`: present, RLS enabled, 0 rows.

These tables are schema-present, but that does not mean generated/local fixture execution is accepted. The fixture rows, policies, index review, and owner gates remain future work.

## Tables And Rows Required For Future Local Fixture Execution

### approved_plan_snapshots

Plan:
- Create a fixture-scope approved snapshot row or an accepted reference strategy in a future prompt only.
- Require immutable payload, workspace/project/edit plan linkage, source finding IDs, source intent IDs, snapshot checksum/hash, revision ID if applicable, approval status, fixture scope, and explicit no raw worker prompt payload metadata.
- Store fixture references as approved snapshot metadata, not as chat text or executable prompts.
- Preserve immutability trigger behavior and extend tests if fixture-scope rows need additional constraints.

RLS:
- Workspace/project isolation for reads.
- Backend/service-only insert/update/delete boundaries.
- No client-side write path for approved snapshots.
- No user update/delete policy for immutable rows.

Indexes:
- Keep or add future reviewed coverage for `workspace_id`, `project_id`, `edit_plan_id`, `status`, `approved_at`, and `created_at`.
- Resolve duplicate/unused approved snapshot index findings before execution readiness is claimed.

Tests:
- Immutability update/delete rejection.
- Workspace isolation.
- Approved snapshot required before fixture records can reference it.
- No raw prompt execution payload in snapshot payload or metadata.

Blockers:
- No approved snapshot rows exist for SOUND fixtures.
- Advisor findings include unindexed approved snapshot foreign keys, duplicate approved snapshot indexes, and unused approved snapshot indexes.

### storage_object_records

Plan:
- Create a private fixture artifact source-of-truth row in a future prompt only.
- Require bucket name and object path or an accepted local-private equivalent policy.
- Require checksum algorithm, checksum value, manifest reference, approved snapshot reference, timing cue manifest reference, private artifact manifest reference, `publicArtifactAllowed=false`, source media immutability, and provenance summary.
- Store canonical bucket/object path metadata only, never signed URLs.

RLS:
- Workspace/project isolation for reads.
- Backend/service-only write boundary.
- No public storage access.
- No client writes to canonical storage records.

Indexes:
- Keep or add future reviewed coverage for `workspace_id`, `project_id`, `storage_scope`, checksum fields, status/purpose, and `created_at`.
- Resolve duplicate index findings on storage object records before execution readiness.

Tests:
- No public URL source-of-truth.
- No signed URL source-of-truth.
- Checksum required.
- Private scope required.
- Approved snapshot and manifest references required.

Blockers:
- No storage object record rows exist.
- No storage buckets or objects exist.
- Storage policy acceptance is still required.

### signed_url_events

Plan:
- Signed URL events are audit-only for later delivery or temporary access flows.
- No signed URL creation occurs in the local fixture stage.
- No signed URL value is stored as canonical media truth.
- Review and delivery link policy is required before any later signed access.

RLS:
- Backend/service-only write.
- Workspace-scoped read only if product policy later accepts it.
- No anonymous or broad authenticated access to signed URL event details.

Tests:
- Signed URL values are not stored as source-of-truth.
- Public artifact delivery remains blocked.
- Temporary access event rows cannot replace storage_object_records.

Blockers:
- No signed URL events exist.
- Public artifact and delivery policy are not accepted for SOUND fixtures.

### generation_requests

Plan:
- Create a future local fixture request row only if Worker Runtime and Provider Gateway owners accept the request boundary.
- Require approved snapshot reference, idempotency key, fixture scope, no provider call, no production execution, no raw prompt payload, no signed URL input, and no provider secret fields.
- Keep provider transport blocked for local fixture unless Provider Gateway later accepts otherwise.

RLS:
- Backend/service-only writes.
- Workspace/project scoped reads if product policy allows user visibility.
- No frontend insert/update/delete.

Indexes:
- Keep or add future reviewed coverage for `project_id`, provider/provider_id, `status`, `approved_plan_snapshot_id`, idempotency key, and `created_at`.

Tests:
- Cannot start without approval gates when required.
- Provider call remains blocked.
- Idempotency required.
- No raw prompt execution payload.

Blockers:
- No generation request rows exist.
- Worker Runtime and Provider Gateway execution acceptance are missing.

### generated_assets

Plan:
- Create future private generated/local fixture asset metadata only after storage owner acceptance.
- Do not create an actual artifact in SUPABASE-SOUND-1.
- Require storage object record reference, checksum, source/provenance summary, approved snapshot reference, fixture scope, private artifact kind, QA status, and `publicArtifactAllowed=false`.

RLS:
- Workspace/project isolation.
- Backend/service-only writes.
- No public artifact visibility.

Indexes:
- Keep or add future reviewed coverage for `project_id`, asset kind, status, storage object record reference, generation request reference, and created time.

Tests:
- No public artifact.
- No signed URL source-of-truth.
- Private scope required.
- Storage object record and checksum required.

Blockers:
- No generated asset rows exist.
- Storage object record strategy remains unaccepted for fixture execution.

### jobs and job_events

Plan:
- Future local fixture job/event rows may be created only after Worker Runtime owner acceptance.
- No worker dispatch is allowed from SOUND or SUPABASE-SOUND-1.
- No production worker execution is allowed.
- Require approved snapshot reference, idempotency key, worker type/stage scope, sanitized payload summary, private manifest references, and event logging.

RLS:
- Backend/service-only writes.
- Workspace/project scoped reads where user visibility is appropriate.
- No client-side job dispatch or event mutation.

Indexes:
- Keep or add future reviewed coverage for `status`, job type, `project_id`, approved snapshot reference, idempotency key, and `created_at`.

Tests:
- Cannot dispatch raw prompt.
- Approved snapshot required.
- Idempotency required.
- No signed URL, credential, or privileged key payload fields.

Blockers:
- No job or job event rows exist.
- Worker Runtime has not accepted dispatch, leases, runtime config, retry, or event behavior.

### sound_effect_plans / ambient_sound_plans / music_plans / audio_environment_analysis

Plan:
- Future fixture may reference existing planning rows or create fixture-scope rows only after owner acceptance.
- No provider execution, no public artifacts, no generated audio, and no Track B media processing are allowed from these rows.
- Preserve Lyria as music/song/soundtrack planning metadata only; SFX/foley/ambience must not route to Lyria.

RLS:
- Workspace/project isolation.
- Backend/service write boundaries for fixture-scope planning records.
- User reads only where project membership allows.

Tests:
- No provider call.
- No raw execution payload.
- Lyria music-only boundary.
- Ambience and SFX provider boundaries remain separate.

Blockers:
- SOUND planning tables exist but contain no live fixture rows.
- SOUND owns cue planning semantics; Supabase owns only persistence/RLS/storage shape.

### credit_estimates / credit_approvals / credit_reservations

Plan:
- Local fixture credit rows remain blocked unless Billing owner accepts placeholder/no-spend policy.
- No spend, reservation, approval, refund, or release occurs in SUPABASE-SOUND-1.
- Future rows must be explicitly fixture-scoped and must not imply paid execution.

RLS:
- Strict workspace/account isolation.
- Backend/service write boundaries.
- No frontend bypass of credit gates.

Tests:
- No spend claim.
- No reservation claim.
- No approval claim.
- No paid production unlock.

Blockers:
- Billing/Stripe/Credits owner has not accepted fixture credit semantics.
- Credit rows are empty and must remain unmodified in this prompt.

### feature_gates / tool_capabilities / worker_runtime_configs

Plan:
- Remain fail-closed for execution.
- Any fixture-specific enablement must be explicit, service-owned, owner-accepted, and stage-scoped in a future prompt.
- No mutation occurs in SUPABASE-SOUND-1.

RLS:
- Avoid user-writable runtime gates.
- Backend/service-only mutation for gate/capability/runtime records.
- User reads only if product policy explicitly allows safe visibility.

Tests:
- Frontend cannot enable execution.
- Worker cannot run without approved config.
- Broad media, public artifacts, raw prompt execution, beta, production, external beta, and paid production remain disabled.

Blockers:
- `feature_gates` and `tool_capabilities` have RLS enabled but no policy advisor findings.
- `worker_runtime_configs` has no rows and no SOUND execution acceptance.

## RLS Policy Plan

Future execution requires:
- Workspace/project isolation for user-visible rows.
- Backend/service-only mutations for approved snapshots, storage records, generated asset records, generation requests, jobs, job events, QA evidence, and runtime records.
- User read-only policies where product UX requires visibility.
- No client writes to runtime rows.
- No frontend feature gate toggles.
- No public storage access.
- No broad anonymous or broad authenticated policies for service-only tables.
- Explicit policy tests for fixture scope and workspace isolation.

Execution blockers:
- Advisor findings show RLS enabled but no policy on activation/readiness/feature/tool tables.
- Existing policies and helper functions need review before fixture execution can rely on them.

## Storage Policy Plan

Future execution requires:
- Private bucket/object only.
- No public bucket for SOUND fixture.
- Signed URLs audit-only later; signed URLs are not source of truth.
- Retention/delete controls before public artifact or delivery work.
- Access logging requirements before preview/export delivery work.
- Storage object records must point to private paths and checksums.
- Storage bucket/object creation requires Supabase owner acceptance in a later prompt.

Execution blockers:
- `storage.buckets` and `storage.objects` have zero rows.
- No SOUND fixture bucket/object policy is accepted.
- Public artifact policy remains blocked.

## Index / Performance Plan

Expected future indexes or reviewed coverage:
- `approved_plan_snapshots`: `workspace_id`, `project_id`, `edit_plan_id`, `status`, `created_at`, and approved/fixture scope fields if added later.
- `storage_object_records`: `workspace_id`, `project_id`, `storage_scope`, checksum fields, status/purpose, and `created_at`.
- `generation_requests`: `project_id`, provider/provider_id, `status`, approved snapshot reference, idempotency key, and `created_at`.
- `generated_assets`: `project_id`, asset kind, status, storage object record reference, generation request reference.
- `jobs`: job type, status, `project_id`, approved snapshot reference, idempotency key, and `created_at`.
- `job_events`: job ID, event type, and `created_at`.
- Credit rows: `project_id`, status, and `created_at`.
- SOUND planning rows: `project_id`, `edit_plan_id`, status, and relevant cue/manifest references.

Advisor blockers to carry into SUPABASE-SOUND-2:
- Unindexed foreign keys, including approved snapshot foreign keys.
- Duplicate indexes on approved snapshots.
- Duplicate index on storage object records.
- Unused index findings on approved snapshots and QA tables.
- Multiple permissive policy warning on approved snapshots.

## Security / Advisor Plan

Expected blockers:
- RLS enabled but no policy on activation/readiness/feature/tool tables.
- Mutable `search_path` warnings on runtime helper functions.
- SECURITY DEFINER exposure warnings for workspace/project helper functions and update helper functions.
- Unindexed foreign keys.
- Duplicate indexes.
- Storage policy gaps.
- Workspace isolation gaps.

These block fixture execution readiness. They do not block plan-only documentation and text-smoke work.

## Migration-Order / Milestone-Sync Plan

SUPABASE-SOUND-1 creates no migration. A future SUPABASE-SOUND-2 may draft a migration and RLS tests only if accepted.

Before any future draft migration:
- Check local migration order against the live migration ledger.
- Avoid duplicate migration IDs.
- Reconcile local migrations that are present in the repo but not reflected in live metadata.
- Do not regenerate database types until a future accepted migration/test prompt.
- Run advisors after a future migration in an approved non-production or explicitly accepted environment.
- Keep generated/local fixture execution blocked until the migration, RLS tests, storage policy, cleanup, owner gates, and validation evidence are accepted.

## Fixture Execution Prerequisites

- Supabase owner accepts mutation/storage path.
- Worker Runtime accepts payload/dispatch boundary.
- Provider Gateway confirms no provider calls for local fixture or accepts provider boundary later.
- Observability accepts QA/audit/cost evidence.
- Billing accepts no-spend placeholder policy.
- Track A accepts handoff-only status and final composition requirements.
- Track B accepts handoff-only status and any future media/audio processing boundary.
- Approved snapshot row strategy accepted.
- Storage object record strategy accepted.
- Checksum/private path strategy accepted.
- RLS/storage policy accepted.
- Fixture cleanup/rollback accepted.
- Advisor blockers reviewed or explicitly deferred by the owning workstream.

## Rollback / Cleanup Plan

Future cleanup must cover:
- Fixture approved snapshot rows.
- Fixture storage object records.
- Fixture generated asset metadata.
- Fixture generation request rows.
- Fixture jobs and job events.
- Fixture QA rows.
- Fixture credit placeholders, if any are later accepted.
- Storage objects, if later created.
- Signed URL events, if later allowed as audit records.
- Idempotency keys or worker claim records, if later accepted.

No cleanup is executed in SUPABASE-SOUND-1 because no rows, storage objects, migrations, signed URLs, jobs, assets, credits, approvals, or artifacts are created.

## Blocked Uses

- SQL execution.
- Migration creation, application, or deployment.
- Supabase row mutation.
- Storage bucket or object creation.
- Signed URL creation.
- Signed URLs as source of truth.
- Public artifact creation or delivery.
- Approved snapshot creation.
- Generation request creation.
- Generated asset creation.
- Job or job event creation.
- Credit estimate, approval, reservation, spend, refund, or release creation.
- Feature gate mutation.
- Tool capability seeding.
- Worker runtime config creation.
- Provider calls.
- Worker dispatch.
- Docker, Cloud Run, FFmpeg, and model inference.
- Staging, beta, external beta, paid production, or production unlock.
- Raw prompt execution.

## Cross-Chat Ownership

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting/source workstream: SOUND_MUSIC_AUDIO.
- Related workstreams: TRACK_A_RENDER_EXPORT, TRACK_B_MEDIA_PROCESSING, PROVIDER_GATEWAY_MODELS, WORKER_RUNTIME_JOBS, OBSERVABILITY_AUDIT_COST, BILLING_STRIPE_CREDITS, and AI_TOOLS_CREATIVE_GRAPHICS only if shared timing or plan records later reference creative graphics assets.
- Explicitly not owned: SOUND creative cue planning, provider transport/secrets/fallback, worker dispatch/runtime infrastructure, Docker/Cloud Run execution, Track A final mux/export, Track B media/audio processing execution, billing/Stripe/payment operations, public artifact delivery, signed URL generation, broad beta/production unlock, raw prompt execution, and provider/model execution.

## Supabase Update Classification

- Supabase update required: no for SUPABASE-SOUND-1.
- Supabase update status: mutation plan only; no live mutation.
- Supabase environment touched: read-only metadata inspection only.
- SQL executed: no.
- Migration deployed: no.
- Evidence docs: SOUND owner checklist, SOUND fixture handoff packet, SOUND generated/local fixture plan, and this mutation plan.
- Blockers: no approved snapshot rows, no worker runtime config rows, no storage bucket/object records, no generated assets, no jobs, no credit rows, no runtime owner acceptance for execution, and unresolved advisor findings.
- Next Supabase action: SUPABASE-SOUND-2 draft migration/RLS tests only, no deploy.

## Supabase Milestone Sync

Status: partial and blocked for execution.

Reason: Local schema sources include many relevant tables and policies, and live metadata confirms many relevant tables exist, but live migration metadata does not include every later local migration file and no fixture rows or storage objects exist. Advisor blockers remain.

Evidence: read-only project metadata, migration metadata, table summaries, Edge Function list, security advisors, performance advisors, local migration order, local migration files, schema health checks, and SOUND-3D evidence.

Next action: draft local fixture migration and RLS tests only after explicit SUPABASE-SOUND-2 acceptance.

## Next Prompt Recommendation

`SUPABASE-SOUND-2: draft local fixture migration and RLS tests, no deploy`

Scope: create draft migration/test files only if explicitly accepted, with no SQL execution, no migration deployment, no live rows, no storage writes, no signed URLs, and no environment unlock.
