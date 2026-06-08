# SOUND_MUSIC_AUDIO Owner Acceptance Checklist

Status: owner acceptance checklist only.

Current unlock stage: dry_run_passed.

Target future stage: generated_local_fixture_passed.

This checklist is handoff-only. It creates no fixture artifact, audio file, generated asset, Supabase row, storage object, signed URL, public artifact, provider call, worker job, approval record, credit record, GCP resource, Docker image, Cloud Run job, FFmpeg execution, model download, secret, or environment unlock.

This checklist does not claim generated_local_fixture_passed.

## Source References

- `docs/sound-music-audio-generated-local-fixture-plan.md`
- `docs/sound-music-audio-generated-local-fixture-handoff-packet.md`
- `src/backend/mock/mock-sound-music-audio-generated-local-fixture-spec.ts`
- `server/smoke/sound-music-audio-generated-local-fixture-spec-smoke.ts`
- `server/smoke/sound-music-audio-fixture-handoff-packet-smoke.ts`
- `docs/cross-chat/SOUND_MUSIC_AUDIO.md`
- production audio, artifact, QA, SoundSync, Google Cloud audio worker, and Google Cloud SFX worker policy docs

## Correct Source-Of-Truth Path

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs are not source of truth. Chat messages are not source of truth. Local mock fixture IDs are reference-only until the owning workstreams accept a real fixture path.

## Correct Execution Path

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution is blocked. Raw chat must not become direct worker execution. Worker execution remains blocked until Worker Runtime accepts the payload, idempotency, claim, lease, event, retry, and safety boundaries.

## Owner Checklist Summary

| Owner | Acceptance status | What SOUND prepared | Owner must accept | Evidence required | Forbidden bypasses | Next recommended owner prompt |
| --- | --- | --- | --- | --- | --- | --- |
| SOUND_MUSIC_AUDIO | not_accepted_for_execution | dry-run contract, evidence card, generated/local fixture plan, fixture spec, handoff packet, owner checklist | keep cue/manifests/QA planning metadata fail-closed | checklist smoke, dry-run smokes, fixture spec smoke | no artifact creation, no provider calls, no workers, no Supabase mutation, no Track A/B execution | SOUND owns this checklist only |
| SUPABASE_RLS_STORAGE_DATABASE | not_accepted_for_execution | source-of-truth requirements, mock approved snapshot IDs, private path expectations | approved snapshot row strategy, fixture-only scope, storage object records, checksum fields, RLS/storage policies, signed URL audit-only rules, workspace isolation | migration/ledger/RLS/storage acceptance evidence | no live rows, no storage writes, no signed URL source-of-truth | SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution |
| WORKER_RUNTIME_JOBS | not_accepted_for_execution | blocked worker expectations and raw prompt rejection notes | payload shape, idempotency, claim/lease, event logging, no raw prompt, no signed URL input, no provider credentials, no privileged key exposure, no production dispatch | worker runtime contract acceptance evidence | no prompt-to-worker shortcut, no production job dispatch, no Cloud Run dispatch | WORKER-RUNTIME-SOUND-0: audio worker dry-run/local-fixture acceptance audit |
| PROVIDER_GATEWAY_MODELS | not_accepted_for_execution | provider boundary map and Lyria music-only rule | provider transport, secrets, fallback, license/commercial evidence, cost/error semantics, Lyria music/song/soundtrack boundary, SFX/ambient provider boundary | provider gateway and license readiness evidence | no provider calls, no provider credentials, no Lyria SFX/foley/ambience use | PROVIDER-GATEWAY-SOUND-0: provider/license local-fixture acceptance audit |
| OBSERVABILITY_AUDIT_COST | not_accepted_for_execution | QA, audit, cost placeholder requirements | QA evidence format, audit event format, abuse controls, cost guardrails, readiness reporting | QA/audit/cost acceptance evidence | no silent readiness, no beta/production unlock, no untracked cost path | OBSERVABILITY-SOUND-0: QA/audit/cost local-fixture acceptance audit |
| BILLING_STRIPE_CREDITS | not_accepted_for_execution | no-spend billing boundary and credit placeholder notes | future credit estimate, approval, reservation, spend, refund, release semantics | billing and credit ledger acceptance evidence | no credit rows, no spend claims, no reservation, no Stripe/payment operation | BILLING-SOUND-0: sound credit local-fixture acceptance audit |
| TRACK_A_RENDER_EXPORT | not_accepted_for_execution | timing-aware cue manifest and private audio manifest handoff expectations | final mux/export validation, final composition consumption, sync QA, audio readiness acceptance | Track A render/export handoff evidence | no final mux, no final export, no delivery, no final artifact claim | TRACK-A-SOUND-0: sound fixture final composition handoff audit |
| TRACK_B_MEDIA_PROCESSING | not_accepted_for_execution | private audio artifact manifest and processing boundary notes | real media/audio processing requirements, cleanup/separation/analysis boundaries, fixture media policy | Track B media/audio processing acceptance evidence | no Track B execution, no FFmpeg, no model inference, no media processing | TRACK-B-SOUND-0: sound fixture media processing acceptance audit |

## SOUND_MUSIC_AUDIO

Acceptance status: not_accepted_for_execution.

SOUND has prepared dry-run contracts, a dry-run evidence card, a generated/local fixture plan, a deterministic fixture spec, a handoff packet, and this owner checklist. These prove that SOUND can describe the future handoff shape in mock/reference-only metadata.

SOUND must not create fixture artifacts, call providers, dispatch workers, mutate Supabase, create public artifacts, create signed URLs, create credits or approvals, mark Track A ready, accept Track B execution, or claim generated_local_fixture_passed.

## SUPABASE_RLS_STORAGE_DATABASE

Acceptance status: not_accepted_for_execution.

The Supabase owner must accept the approved plan snapshot row strategy, fixture-only approved snapshot scope, storage object records, private path expectations, checksum fields, RLS/storage policies, signed URL audit-only treatment, public artifact block, migration/ledger consistency, and workspace isolation.

Forbidden bypasses: no live rows, no storage objects, no storage bucket creation, no SQL, no migrations, no signed URL source-of-truth, and no public artifact publishing from SOUND.

Next recommended owner prompt: `SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution`.

## WORKER_RUNTIME_JOBS

Acceptance status: not_accepted_for_execution.

The Worker Runtime owner must accept future payload shape, idempotency, claim/lease behavior, event logging, retry behavior, raw prompt rejection, signed URL input rejection, provider credential rejection, privileged key rejection, and no production dispatch.

Forbidden bypasses: no worker dispatch, no production job, no prompt-to-worker shortcut, no Cloud Run dispatch, and no runtime config creation from SOUND.

Next recommended owner prompt: `WORKER-RUNTIME-SOUND-0: audio worker dry-run/local-fixture acceptance audit`.

## PROVIDER_GATEWAY_MODELS

Acceptance status: not_accepted_for_execution.

The Provider Gateway owner must accept provider transport, provider secret policy, fallback behavior, cost/error semantics, license/commercial evidence, Lyria music/song/soundtrack-only planning, and separate SFX/ambient provider boundaries.

Google Lyria remains music, song, and soundtrack planning metadata only. Lyria must not be used for SFX, foley, transition sounds, whooshes, hits, risers, ambience, room tone, everyday soundscape, field recording replacement, or generated/local fixture audio creation.

Forbidden bypasses: no provider calls, no provider credentials, no fallback transport, no Lyria generation, and no SFX/ambient provider execution from SOUND.

Next recommended owner prompt: `PROVIDER-GATEWAY-SOUND-0: provider/license local-fixture acceptance audit`.

## OBSERVABILITY_AUDIT_COST

Acceptance status: not_accepted_for_execution.

The Observability/Audit/Cost owner must accept audio QA evidence format, audit event format, abuse controls, cost placeholders, readiness reporting, speech/ducking QA, no-random-SFX policy, loudness/sync/naturalness metadata, and beta/production blocker evidence.

Forbidden bypasses: no silent acceptance, no untracked readiness, no beta unlock, no production unlock, and no cost path that bypasses audit evidence.

Next recommended owner prompt: `OBSERVABILITY-SOUND-0: QA/audit/cost local-fixture acceptance audit`.

## BILLING_STRIPE_CREDITS

Acceptance status: not_accepted_for_execution.

The Billing/Stripe/Credits owner must accept future estimate, approval, reservation, spend, refund, release, and ledger semantics before any fixture execution can imply cost behavior.

Forbidden bypasses: no credit rows, no credit approvals, no credit reservations, no spend, no refund, no release, no Stripe calls, and no payment operation from SOUND.

Next recommended owner prompt: `BILLING-SOUND-0: sound credit local-fixture acceptance audit`.

## TRACK_A_RENDER_EXPORT

Acceptance status: not_accepted_for_execution.

Track A must accept timing/private manifest consumption, final composition handoff, final mux/export validation, audio sync QA, private artifact reference handling, and final delivery blockers.

Forbidden bypasses: no final mux, no render/export, no delivery, no public artifact, no final asset, and no Track A readiness claim from SOUND.

Next recommended owner prompt: `TRACK-A-SOUND-0: sound fixture final composition handoff audit`.

## TRACK_B_MEDIA_PROCESSING

Acceptance status: not_accepted_for_execution.

Track B must accept real media/audio processing requirements, local fixture processing boundaries, cleanup/separation/analysis rules, FFmpeg policy, model policy, source immutability, and private artifact outputs.

Forbidden bypasses: no Track B execution, no FFmpeg, no model inference, no media processing, no source overwrite, and no cleanup/separation/analysis claim from SOUND.

Next recommended owner prompt: `TRACK-B-SOUND-0: sound fixture media processing acceptance audit`.

## Execution Blockers

- generated_local_fixture_passed is not claimed.
- Approved snapshot rows are not created.
- Supabase mutation is blocked.
- SQL and migrations are blocked.
- Storage bucket and storage object creation are blocked.
- Signed URLs are audit-only policy text and not source of truth.
- Public artifacts are blocked.
- Provider calls and provider credentials are blocked.
- Lyria generation is blocked and Lyria remains music/song/soundtrack planning metadata only.
- Worker dispatch and production jobs are blocked.
- Raw prompt worker execution is blocked.
- GCP, Docker, Cloud Run, FFmpeg, media processing, model downloads, and model inference are blocked.
- Generated assets and fixture audio files are blocked.
- Credit estimates, approvals, reservations, spend, refund, and release are blocked.
- Track A final export is blocked.
- Track B execution is not accepted.
- Staging, internal beta, external beta, paid production, and production unlock are blocked.

## Recommended Prompt Sequence

Immediate next prompt:

`SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution`

Rationale: SOUND has defined the fixture plan, deterministic spec, handoff packet, and owner checklist. The next hard acceptance gate before any future local fixture execution is Supabase/RLS/Storage acceptance of approved snapshot rows, private path, manifest, checksum, storage object record shape, signed URL audit-only policy, RLS/storage policy, and workspace isolation. This next prompt must remain planning-only and no-execution.

Later prompts may include Worker Runtime, Provider Gateway, Observability/Audit/Cost, Billing/Stripe/Credits, Track A, Track B, and a future SOUND local fixture execution prompt only after the required owners accept their boundaries.

## Exit Criteria Before generated_local_fixture_passed Can Ever Be Claimed

- All required owner acceptances are recorded by their owning workstreams.
- The approved snapshot source-of-truth path is accepted.
- The private path, manifest, checksum, and storage record shape are accepted.
- Signed URLs remain non-source-of-truth.
- Public artifacts remain blocked unless a later delivery policy is accepted.
- Raw prompt execution remains blocked.
- Provider Gateway accepts provider/license/secret/fallback boundaries before any provider transport.
- Worker Runtime accepts payload/idempotency/claim/lease/event boundaries before any dispatch.
- Supabase owner accepts any row/storage mutation path before live mutation.
- Observability/Audit/Cost accepts QA, audit, abuse, cost, and readiness evidence.
- Billing owner accepts any credit estimate, approval, reservation, spend, refund, or release semantics.
- Track A accepts final composition handoff before mux/render/export.
- Track B accepts any real media/audio processing before execution.
- No staging, beta, external beta, paid production, public artifact, signed URL, raw prompt execution, or production unlock is implied by this checklist.
