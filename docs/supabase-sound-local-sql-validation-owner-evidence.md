# SUPABASE-SOUND-3B Local SQL Validation Owner Evidence Packet

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- Current acceptance state: evidence_collection_only.
- goForSUPABASE_SOUND_4: false.
- This packet is owner-evidence-collection-only.
- This packet does not execute SQL.
- This packet does not run migrations.
- This packet does not deploy migrations.
- This packet does not create rows.
- This packet does not create storage buckets or objects.
- This packet does not create signed URLs.
- This packet does not call providers.
- This packet does not dispatch workers.
- This packet does not create generated assets.
- This packet does not create credit or approval records.
- This packet does not unlock generated_local_fixture_passed.

SUPABASE-SOUND-3B collects the evidence state needed before a future SUPABASE-SOUND-4 local SQL validation prompt can even be considered. It is not approval to run validation. It does not mutate Supabase, create fixture rows, write storage, call providers, dispatch workers, create artifacts, or unlock any runtime stage.

## Source-of-truth rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs are blocked. Public artifacts are blocked. Source media must remain immutable. Private path, checksum, manifest, and approved plan snapshot must align before fixture execution.

## Raw prompt rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution is blocked. Supabase records must not store raw prompt execution payloads for workers. Future worker-oriented records must reference approved snapshots, structured findings, edit intents, manifests, idempotency metadata, and private source-of-truth records.

## Acceptance evidence summary

- Plan-only continuation accepted: true.
- Local-only fixture planning with mock/reference IDs accepted: true.
- Generated/local fixture execution accepted: false.
- Local SQL validation accepted: false.
- Current acceptance state: evidence_collection_only.
- goForSUPABASE_SOUND_4: false.

The current evidence is incomplete. SUPABASE-SOUND-4 must not run until the missing owner evidence is collected and the owning workstreams explicitly accept the local/non-production validation target, command list, rollback/cleanup expectations, no-live-data proof, and no-execution boundaries.

## Inputs reviewed for evidence collection

- `docs/supabase-sound-local-sql-validation-owner-acceptance.md`
- `docs/supabase-sound-local-fixture-validation-plan.md`
- `docs/supabase-sound-local-fixture-mutation-plan.md`
- `database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql`
- `database/test-sql/999_supabase_sound_local_fixture_records_tests.sql`
- `docs/sound-music-audio-owner-acceptance-checklist.md`
- `docs/sound-music-audio-generated-local-fixture-handoff-packet.md`
- `docs/sound-music-audio-generated-local-fixture-plan.md`
- `docs/cross-chat/SOUND_MUSIC_AUDIO.md`

## Owner evidence matrix

### SUPABASE_RLS_STORAGE_DATABASE

- owner: SUPABASE_RLS_STORAGE_DATABASE.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: not_accepted.
- acceptanceForExecution: not_accepted.
- evidenceFound: SUPABASE-SOUND-1 mutation plan, SUPABASE-SOUND-2 draft migration/test files, SUPABASE-SOUND-3 validation plan, SUPABASE-SOUND-3A acceptance packet.
- evidenceMissing: explicit command approval for local SQL validation, explicit local/non-production target proof, explicit no-live-data proof, explicit rollback/cleanup approval.
- blockers: SQL validation cannot run without owner approval; active migrations must not be created; live Supabase must not be mutated.
- requiredBeforeSUPABASE_SOUND_4: local/non-production target evidence, no-production confirmation, no-live-data confirmation, command list approval, rollback/cleanup approval, draft migration/test review approval.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

### SOUND_MUSIC_AUDIO

- owner: SOUND_MUSIC_AUDIO.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: pending_or_not_applicable.
- acceptanceForExecution: not_accepted.
- evidenceFound: SOUND dry-run contract smoke, dry-run evidence card, generated/local fixture plan, deterministic fixture spec, handoff packet, owner checklist.
- evidenceMissing: confirmation that local SQL validation remains metadata validation only and does not create fixture audio or generated assets.
- blockers: SOUND must not claim generated_local_fixture_passed, create artifacts, call providers, dispatch workers, mutate Supabase, or create credit/approval records.
- requiredBeforeSUPABASE_SOUND_4: SOUND confirmation that fixture requirements remain mock/reference-only for local SQL validation.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

### WORKER_RUNTIME_JOBS

- owner: WORKER_RUNTIME_JOBS.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: not_accepted.
- acceptanceForExecution: not_accepted.
- evidenceFound: no-dispatch boundary in SOUND and SUPABASE planning docs; worker execution path requires approved snapshots.
- evidenceMissing: explicit Worker Runtime acceptance that local SQL validation does not dispatch workers, create leases, create runtime configs, or validate production payload execution.
- blockers: no worker dispatch, no claim/lease execution, no raw prompt worker path, no signed URL worker input.
- requiredBeforeSUPABASE_SOUND_4: Worker Runtime acknowledgement of no dispatch, no lease, no runtime config seed, idempotency expectations, and raw prompt rejection.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

### PROVIDER_GATEWAY_MODELS

- owner: PROVIDER_GATEWAY_MODELS.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: not_accepted.
- acceptanceForExecution: not_accepted.
- evidenceFound: provider calls are blocked; provider secrets are excluded; Lyria remains music/song/soundtrack planning-only.
- evidenceMissing: explicit Provider Gateway acceptance that local SQL validation does not call providers, store provider credentials, or enable transport/fallback.
- blockers: no provider call, no provider transport, no provider fallback, no provider credential values.
- requiredBeforeSUPABASE_SOUND_4: Provider Gateway no-call acknowledgement, credential exclusion confirmation, Lyria boundary confirmation, SFX/ambient execution block confirmation.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

### OBSERVABILITY_AUDIT_COST

- owner: OBSERVABILITY_AUDIT_COST.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: not_accepted.
- acceptanceForExecution: not_accepted.
- evidenceFound: evidence capture and advisor capture expectations are described in SUPABASE-SOUND-3 and SUPABASE-SOUND-3A.
- evidenceMissing: explicit Observability acceptance for validation output capture, advisor capture, audit placeholders, and no-readiness claims.
- blockers: no silent acceptance, no production readiness claim, no beta readiness claim, no unaudited cost path.
- requiredBeforeSUPABASE_SOUND_4: validation output capture acceptance, security/performance advisor capture acceptance, audit/cost placeholder review, no-readiness-claim acknowledgement.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

### BILLING_STRIPE_CREDITS

- owner: BILLING_STRIPE_CREDITS.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: not_accepted.
- acceptanceForExecution: not_accepted.
- evidenceFound: credit spend, reservation, approval, refund, and release paths are blocked.
- evidenceMissing: explicit Billing acceptance that local SQL validation creates no spend, no reservation, no approval, no refund, no release, and no payment operation.
- blockers: no credit rows, no credit approval, no credit reservation, no spend, no payment operation.
- requiredBeforeSUPABASE_SOUND_4: no-spend acknowledgement, no-reservation acknowledgement, no-approval acknowledgement, no payment operation confirmation.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

### TRACK_A_RENDER_EXPORT

- owner: TRACK_A_RENDER_EXPORT.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: not_accepted.
- acceptanceForExecution: not_accepted.
- evidenceFound: Track A final export remains false/not-ready in SOUND dry-run and fixture planning.
- evidenceMissing: explicit Track A acceptance that local SQL validation does not imply final mux/export readiness.
- blockers: no final export, no mux, no delivery, no public artifact, no readiness claim.
- requiredBeforeSUPABASE_SOUND_4: no-final-export acknowledgement, future handoff boundary review, timing/private manifest consumption expectations.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

### TRACK_B_MEDIA_PROCESSING

- owner: TRACK_B_MEDIA_PROCESSING.
- acceptanceForPlanOnly: accepted.
- acceptanceForLocalFixturePlanning: accepted.
- acceptanceForLocalSqlValidation: not_accepted.
- acceptanceForExecution: not_accepted.
- evidenceFound: Track B execution remains not accepted; FFmpeg/model/media processing remain blocked.
- evidenceMissing: explicit Track B acceptance that local SQL validation does not execute media/audio processing or validate Track B runtime behavior.
- blockers: no media processing, no audio processing, no FFmpeg execution, no model execution, no Track B acceptance claim.
- requiredBeforeSUPABASE_SOUND_4: no-processing acknowledgement, no FFmpeg/model execution confirmation, future processing boundary review.
- nextRecommendedPrompt: SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution.

## Missing evidence

- no explicit SUPABASE_RLS_STORAGE_DATABASE command approval for local SQL validation;
- no explicit local/non-production target proof;
- no explicit no-live-data proof;
- no explicit rollback/cleanup approval;
- no explicit Worker Runtime acceptance;
- no explicit Provider Gateway acceptance;
- no explicit Observability acceptance;
- no explicit Billing acceptance;
- no explicit Track A acceptance;
- no explicit Track B acceptance.

## Forbidden actions while evidence is incomplete

- no SQL execution;
- no migration commands;
- no Supabase mutation;
- no storage writes;
- no signed URLs;
- no provider calls;
- no worker dispatch;
- no generated assets;
- no credit rows;
- no public artifacts;
- no staging, beta, external beta, paid production, or production claims.

## Go / no-go result

- goForSUPABASE_SOUND_4: false.
- SUPABASE-SOUND-4 local SQL validation is blocked.
- generated_local_fixture_passed is not claimed.
- Local SQL validation is not accepted until all required owner evidence is complete.

## Evidence required before SUPABASE-SOUND-4

- SUPABASE_RLS_STORAGE_DATABASE command approval recorded.
- Local/non-production target proof recorded.
- No-production confirmation recorded.
- No-live-data confirmation recorded.
- Rollback/cleanup approval recorded.
- SOUND_MUSIC_AUDIO confirms fixture requirements remain mock/reference-only.
- WORKER_RUNTIME_JOBS accepts no-dispatch local SQL validation boundary.
- PROVIDER_GATEWAY_MODELS accepts no-provider local SQL validation boundary.
- OBSERVABILITY_AUDIT_COST accepts validation/advisor evidence capture plan.
- BILLING_STRIPE_CREDITS accepts no-spend/no-reservation/no-approval boundary.
- TRACK_A_RENDER_EXPORT accepts no-export readiness boundary.
- TRACK_B_MEDIA_PROCESSING accepts no-processing boundary.

## Recommendation

`SUPABASE-SOUND-3C: collect missing owner approvals for local SQL validation, no execution`

This is the only recommended next prompt because local SQL validation is still blocked by incomplete owner evidence.
