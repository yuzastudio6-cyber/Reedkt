# SOUND_MUSIC_AUDIO Generated/Local Fixture Handoff Packet

## Status

Current unlock stage: dry_run_passed.

Target future stage: generated_local_fixture_passed.

This packet is handoff-only. It makes the SOUND-3B generated/local fixture spec easier for other owners to review, but it does not create artifacts, execute providers, dispatch workers, mutate Supabase, run SQL, write storage, deploy or modify GCP, run FFmpeg, run Docker, run Cloud Run, download models, create signed URLs, create public artifacts, create generated assets, create approval records, create credit records, or unlock staging, beta, external beta, paid production, production, broad media, public artifacts, signed URLs, or raw prompt execution.

This packet does not claim generated_local_fixture_passed.

## Source Documents And Specs

- `docs/sound-music-audio-generated-local-fixture-plan.md`
- `src/backend/mock/mock-sound-music-audio-generated-local-fixture-spec.ts`
- `server/smoke/sound-music-audio-generated-local-fixture-spec-smoke.ts`
- SUPABASE-SOUND-0 acceptance audit result: plan-only and mock/reference local fixture planning accepted; live rows and storage execution blocked.
- SOUND-2B dry-run contract evidence and SOUND-2C dry-run evidence card data remain relevant as prior mock-only evidence.

## Correct Source-Of-Truth Path

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Current packet status:

- mock/reference-only IDs are used;
- signed URLs are not source of truth;
- public URLs are not allowed;
- storage writes are blocked;
- Supabase mutation is blocked.

## Correct Execution Path

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution is blocked. This packet does not create a worker payload and does not dispatch a worker.

## What The Spec Proves

- deterministic fixture spec exists;
- checksum expectation exists;
- private path expectation exists;
- source-of-truth requirements are defined;
- approved snapshot requirements are defined;
- timing-aware cue manifest requirements are defined;
- private audio artifact manifest requirements are defined;
- Lyria boundary is preserved for music, song, and soundtrack planning only;
- provider calls are blocked;
- worker dispatch is blocked;
- Supabase mutation is blocked;
- SQL is blocked;
- GCP, Docker, Cloud Run, and FFmpeg are blocked;
- generated assets are blocked;
- public artifacts and signed URLs are blocked;
- credits, approvals, reservations, spend, refund, and release are blocked;
- Track A final export is blocked;
- Track B execution is not accepted.

## What The Spec Does Not Prove

- it does not create fixture audio;
- it does not create generated assets;
- it does not verify a real checksum against a real file;
- it does not create private GCS objects;
- it does not create Supabase rows;
- it does not create approved snapshots;
- it does not validate worker dispatch;
- it does not validate provider transport;
- it does not validate Track A mux, render, export, or delivery;
- it does not validate Track B processing;
- it does not validate billing or credit records;
- it does not validate staging, beta, external beta, paid production, or production.

## Owner Acceptance Required Before Fixture Execution

### SOUND_MUSIC_AUDIO

Can prepare:

- fixture spec;
- timing and private manifest expectations;
- cue and source reasoning expectations;
- QA metadata expectations.

Must not:

- execute providers;
- dispatch workers;
- mutate Supabase;
- create artifacts.

### SUPABASE_RLS_STORAGE_DATABASE

Must accept before execution:

- approved snapshot row strategy;
- storage object record strategy;
- private path strategy;
- checksum fields;
- RLS policies;
- storage policies;
- signed URL audit-only policy;
- public artifact block;
- migration and ledger consistency.

SUPABASE_RLS_STORAGE_DATABASE must not be bypassed.

### WORKER_RUNTIME_JOBS

Must accept before execution:

- local fixture worker payload shape, if any;
- idempotency key rules;
- no raw prompt worker execution;
- no signed URL input;
- no secrets, service-role values, or provider keys;
- no production dispatch until a later accepted phase.

### PROVIDER_GATEWAY_MODELS

Must accept before any provider fixture:

- Lyria transport boundary;
- SFX and ambient provider boundary;
- provider license and commercial evidence;
- provider secrets policy;
- fallback policy.

For the current local spec, no provider calls are allowed.

### OBSERVABILITY_AUDIT_COST

Must accept:

- fixture QA evidence format;
- audit evidence format;
- cost evidence placeholder;
- abuse and cost guardrails before later phases.

### BILLING_STRIPE_CREDITS

Must accept:

- credit placeholder policy;
- no spend or reservation claim;
- future estimate, approval, and reservation boundary.

### TRACK_A_RENDER_EXPORT

Must accept:

- final audio composition handoff later;
- timing and private manifest consumption later.

For the current spec, final export remains false.

### TRACK_B_MEDIA_PROCESSING

Must accept:

- any real media or audio processing later.

For the current spec, Track B execution is not accepted.

## Fixture Execution Blockers

- no real approved snapshot rows;
- no storage bucket or object records;
- no generated asset rows;
- no jobs or job events;
- no worker runtime configs;
- no credit rows;
- no provider or license execution acceptance;
- no worker payload or dispatch acceptance;
- no observability or billing acceptance;
- no Track A or Track B execution acceptance;
- RLS, security, and performance review pending;
- migration ledger and local sync review pending.

## Next Accepted Phase Candidate

Exactly one immediate next prompt is recommended:

`SOUND-3D: fixture handoff packet UI surfacing / owner checklist smoke, no artifact creation`

The next step may continue making the fixture handoff packet easier to review, but it must not create artifacts, execute providers, dispatch workers, mutate Supabase, write storage, create signed URLs, create public artifacts, create generated assets, create credit or approval records, run media processing, or unlock any environment.

## Exit Criteria Before generated_local_fixture_passed Can Ever Be Claimed

- deterministic local fixture artifact actually created by a later approved prompt;
- checksum verified against the artifact;
- private path or local-private equivalent verified;
- manifest links verified;
- approved snapshot reference verified;
- no raw prompt worker execution;
- no signed or public URLs;
- provider calls blocked or explicitly owner-accepted for a later provider fixture;
- worker dispatch blocked or explicitly owner-accepted for a later local fixture mode;
- Supabase mutation blocked or explicitly owner-accepted;
- QA metadata produced;
- owner handoff evidence updated;
- targeted smoke passes;
- no public artifact;
- no staging, beta, external beta, paid production, or production claim.
