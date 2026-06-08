# SOUND_MUSIC_AUDIO Generated/Local Fixture Plan

## Status

Current unlock stage: dry_run_passed.

Target future stage: generated_local_fixture_passed.

This document is planning-only. It defines the future generated/local fixture gate for SOUND_MUSIC_AUDIO, but it does not create a fixture artifact, execute media processing, mutate storage, or claim generated_local_fixture_passed.

This document does not create real approval records, credit records, generated assets, provider calls, worker jobs, Supabase rows, storage objects, signed URLs, public artifacts, GCP resources, Docker images, Cloud Run jobs, model downloads, FFmpeg executions, secrets, or environment unlocks.

## Scope

SOUND_MUSIC_AUDIO owns the creative sound, music, ambience, SFX, timing-aware cue, private audio manifest, and audio QA planning semantics for this gate.

This plan may define:

- deterministic local fixture artifact shape;
- approved plan snapshot metadata requirements;
- structured finding and edit intent references;
- timing-aware cue manifest requirements;
- private audio artifact manifest requirements;
- checksum and private path expectations;
- provider and model boundary rules;
- worker handoff expectations;
- Supabase/RLS/Storage acceptance requirements;
- QA, observability, and billing evidence requirements;
- Track A and Track B handoff blockers;
- owner acceptance and exit criteria.

This plan must not implement:

- a fixture artifact;
- FFmpeg, ffprobe, AudioFlux, Signalsmith Stretch, DeepFilterNet, RNNoise, Demucs, Lyria, Dasheng, Stable Audio, OpenMOSS, Meta AudioGen, Woosh, TangoFlux, MMAudio, Mirelo, or any model execution;
- provider transport, provider fallback, provider secrets, or SDK calls;
- worker dispatch, worker lease claims, runtime configs, Docker, GCP, Cloud Run, Pub/Sub, or Secret Manager access;
- Supabase mutation, SQL, migrations, storage bucket writes, storage object writes, signed URL creation, or public artifact publishing;
- Track A mux/render/export or Track B media/audio processing execution;
- billing, Stripe, credit approval, credit reservation, credit spend, refund, or release flows.

## Source-Of-Truth Path

The future generated/local fixture source-of-truth path must be:

```text
Supabase row + private GCS path + manifest + checksum + approved plan snapshot
```

For SOUND-3A, that path is a requirement only. No live row, GCS path, storage object, manifest row, checksum row, approved snapshot row, or signed access record is created.

Signed URLs must not be source-of-truth evidence. A future signed preview or download path may only exist after a separate approved delivery policy defines retention, deletion, user approval, abuse controls, visibility rules, access logging, owner acceptance, and QA evidence.

## Execution Path

The only acceptable future execution path is:

```text
user/chat request -> structured agent findings -> edit intents -> approved plan snapshot -> worker execution
```

Raw chat must never become direct worker execution. A local generated fixture may be planned only from structured findings, edit intents, approved snapshot metadata, timing-aware cue metadata, and private artifact manifest metadata.

## Fixture Goals

A future generated/local fixture should prove that SOUND can prepare a deterministic, local, private, non-provider, non-worker handoff bundle for the next owner gates.

The fixture should eventually include:

- a deterministic local fixture artifact or placeholder artifact allowed by owner acceptance;
- a checksum, preferably SHA-256, over the fixture artifact bytes or deterministic placeholder content;
- a private path expectation, not a public URL;
- a private artifact manifest shape;
- timing-aware cue manifest references;
- approved plan snapshot references;
- structured finding IDs and edit intent IDs;
- idempotency metadata;
- source media immutability notes;
- provenance summary;
- audio QA evidence metadata;
- observability and audit evidence metadata;
- billing and credit placeholder metadata without real spend;
- blocked-use and next-owner mapping.

## Fixture Non-Goals

Generated/local fixture planning does not allow:

- provider calls;
- model inference;
- model downloads;
- worker dispatch;
- production worker jobs;
- Docker or Cloud Run;
- FFmpeg or media processing in this prompt;
- Supabase mutation;
- storage writes;
- signed URLs as source of truth;
- public artifacts;
- generated assets;
- credit estimates, credit approvals, reservations, spends, refunds, or releases;
- approval records;
- final render, final mux, export, or delivery;
- staging, beta, external beta, paid production, or production unlocks.

## Deterministic Fixture Artifact Shape

A future local fixture artifact should be represented by structured metadata before any file exists:

| Field | Expected value |
| --- | --- |
| `fixtureArtifactId` | `mock-sound-local-fixture-{stable-seed}` |
| `fixtureKind` | `generated_local_audio_fixture` |
| `workstream` | `SOUND_MUSIC_AUDIO` |
| `currentStage` | `dry_run_passed` before execution |
| `targetStage` | `generated_local_fixture_passed` after accepted future execution |
| `artifactCreatedInSOUND3A` | `false` |
| `providerCallsAllowed` | `false` |
| `workerDispatchAllowed` | `false` |
| `supabaseMutationAllowed` | `false` |
| `publicArtifactAllowed` | `false` |
| `signedUrlSourceOfTruthAllowed` | `false` |
| `approvedPlanSnapshotId` | mock reference now, real accepted row later |
| `structuredFindingIds` | non-empty structured finding references |
| `editIntentIds` | non-empty edit intent references |
| `timingAwareCueManifestId` | deterministic manifest reference |
| `privateAudioArtifactManifestId` | deterministic private manifest reference |
| `expectedChecksumAlgorithm` | `sha256` |
| `expectedChecksumValue` | future deterministic checksum, not present in SOUND-3A |
| `expectedPrivatePath` | private path expectation, not public URL |
| `idempotencyKey` | future deterministic fixture idempotency key |
| `provenanceSummary` | mock/local fixture provenance and source inputs |

The artifact shape is an expectation only. SOUND-3A writes no audio file and creates no artifact record.

## Checksum And Private Path Expectations

A future generated/local fixture must include checksum/private path/source-of-truth expectations before it can claim generated_local_fixture_passed.

Required expectations:

- checksum algorithm is declared;
- checksum value is deterministic and tied to the fixture content;
- private storage path expectation is declared;
- storage scope is private;
- source media is immutable;
- artifact manifest references the approved plan snapshot;
- artifact manifest references the timing-aware cue manifest;
- artifact manifest references the private audio artifact manifest;
- no signed URLs as source of truth;
- no public URL;
- no public artifact;
- no live GCS write unless SUPABASE_RLS_STORAGE_DATABASE accepts the path;
- no storage bucket/object row unless SUPABASE_RLS_STORAGE_DATABASE accepts the mutation path.

## Approved Snapshot Requirements

The future fixture requires approved snapshot metadata, but SOUND-3A creates no approved snapshot.

Required approved snapshot fields:

- `approvedPlanSnapshotId`;
- approval status;
- immutable plan version;
- snapshot checksum or hash;
- source structured finding IDs;
- source edit intent IDs;
- revision ID when applicable;
- approval timestamp when present;
- fixture-only approval scope when applicable;
- no production approval claim;
- no credit spend claim;
- no raw prompt worker payload.

Supabase owner acceptance is required before this metadata becomes a live row or an execution source of truth.

## Timing-Aware Cue Manifest Requirements

The timing-aware cue manifest must remain metadata-only until accepted by downstream owners.

Required timing fields:

- cue IDs;
- cue type and family;
- start, end, and duration;
- timing anchors;
- speech overlap;
- ducking requirements;
- SoundSync coordination notes;
- visual or story reason;
- blocked reasons;
- Track A final render readiness set to false until Track A accepts it;
- worker execution readiness set to false until Worker Runtime accepts it;
- provider execution readiness set to false until Provider Gateway accepts it.

No beat detection, audio analysis, SoundSync final mix, SFX generation, music generation, or final mux/export is claimed by this plan.

## Private Audio Artifact Manifest Requirements

The private audio artifact manifest must remain metadata-only and private.

Required private manifest fields:

- manifest ID;
- artifact kind;
- storage scope `private`;
- public artifact allowed `false`;
- generated asset IDs empty before fixture execution;
- public URL absent;
- signed URL absent;
- provider secret absent;
- service-role value absent;
- provenance summary;
- source cue references;
- approved snapshot reference;
- checksum expectation;
- private path expectation;
- QA evidence references when available.

This plan creates no storage objects, no generated assets, no public artifacts, and no signed URLs.

## Provider And Model Rules

Google Lyria belongs to SOUND_MUSIC_AUDIO only for music, song, and soundtrack planning metadata.

Lyria must not be used for SFX, foley, transition sounds, whooshes, hits, risers, ambience, everyday soundscape, room tone, or field recording replacement.

Lyria generation remains disabled. Real Lyria transport belongs to PROVIDER_GATEWAY_MODELS, and Provider Gateway handoff is required before any future real transport.

SFX and ambience provider/model boundaries:

- Dasheng remains candidate planning metadata only until Provider Gateway and license review accept it;
- Stable Audio remains license-gated candidate planning metadata only;
- OpenMOSS remains pending verification;
- Meta AudioGen, Woosh, TangoFlux, and public/noncommercial MMAudio remain blocked;
- Mirelo and MMAudio real transports remain fail-closed and Provider Gateway-owned;
- AudioFlux and Signalsmith Stretch are analysis/processing-only candidates, not generation providers;
- DeepFilterNet, RNNoise, and Demucs remain model-weight/readiness-review gated;
- FFmpeg and ffprobe must not run from this plan.

Generated/local fixture planning can proceed without provider calls because the fixture is local, deterministic, and metadata-gated. Any provider fixture later requires Provider Gateway acceptance first.

## Worker Runtime Rules

Generated/local fixture planning must not dispatch production workers.

Worker Runtime owns:

- worker payload acceptance;
- job claim and lease behavior;
- worker runtime configs;
- idempotency persistence;
- Cloud Run, Docker, Pub/Sub, queue, and retry/release infrastructure;
- worker event logs;
- rejection of raw prompt execution;
- rejection of signed URLs, secrets, and service-role values in payloads.

SOUND may define worker payload expectations only as blocked handoff metadata. No `ProductionWorkerJobPayload` is created by this plan.

## Supabase/RLS/Storage Rules

Supabase/RLS/Storage owner acceptance is the next hard blocker before any generated/local fixture execution.

SOUND-3A does not:

- execute SQL;
- create migrations;
- mutate Supabase;
- create approved snapshot rows;
- create storage bucket rows;
- create storage object rows;
- create generated asset rows;
- create generation request rows;
- create job rows;
- create QA rows;
- create credit rows;
- create signed URLs;
- upload storage objects.

The future fixture can be planned locally without live Supabase mutation, but it cannot claim source-of-truth acceptance until SUPABASE_RLS_STORAGE_DATABASE accepts the approved snapshot row, private path, manifest, checksum, storage scope, and RLS/storage policy shape.

## QA, Observability, And Billing Rules

Generated/local fixture planning must include evidence expectations for:

- audio loudness metadata;
- audio sync metadata;
- naturalness/overprocessing risk;
- music-over-voice and ducking;
- no-random-SFX policy;
- speech safety;
- SFX usefulness;
- ambience subtle/background behavior under speech;
- QA required before Track A handoff;
- audit evidence metadata;
- cost placeholder metadata;
- billing placeholder metadata.

This plan creates no QA row, no audit event, no cost record, no credit estimate, no credit approval, no credit reservation, no credit spend, no refund, and no release.

OBSERVABILITY_AUDIT_COST owns audit/cost evidence acceptance. BILLING_STRIPE_CREDITS owns credit and Stripe acceptance.

## Track A And Track B Rules

Track A final composition handoff remains blocked.

Track A owns:

- final mux;
- final render;
- export;
- delivery;
- render/export QA;
- final use of audio layers in the composition.

Track B processing execution remains not accepted.

Track B owns:

- general media/audio processing internals;
- cleanup/separation execution when explicitly handed off;
- FFmpeg/local media execution acceptance;
- source media processing boundaries.

SOUND may provide timing-aware cue manifests, private audio artifact manifests, audio readiness status, blocked uses, and required validation evidence. SOUND must not implement Track A final export or Track B media/audio processing.

## Readiness Checklist

| Requirement | SOUND-3A status | Owner |
| --- | --- | --- |
| Structured findings referenced | planned from dry-run evidence | SOUND_MUSIC_AUDIO |
| Edit intents referenced | planned from dry-run evidence | SOUND_MUSIC_AUDIO |
| Approved snapshot metadata | mock/reference-only requirement | SOUND_MUSIC_AUDIO + SUPABASE_RLS_STORAGE_DATABASE |
| Approved snapshot live row | missing, owner acceptance required | SUPABASE_RLS_STORAGE_DATABASE |
| Timing-aware cue manifest | metadata-only, dry-run-ready | SOUND_MUSIC_AUDIO |
| Private audio artifact manifest | metadata-only, private, dry-run-ready | SOUND_MUSIC_AUDIO |
| Checksum expectation | plan-defined, no checksum created | SOUND_MUSIC_AUDIO |
| Private path expectation | plan-defined, no storage write | SOUND_MUSIC_AUDIO + SUPABASE_RLS_STORAGE_DATABASE |
| Source-of-truth record path | requirement defined | SUPABASE_RLS_STORAGE_DATABASE |
| Provider calls blocked | satisfied | PROVIDER_GATEWAY_MODELS |
| Lyria music-only boundary | satisfied as planning rule | SOUND_MUSIC_AUDIO + PROVIDER_GATEWAY_MODELS |
| Worker dispatch blocked | satisfied | WORKER_RUNTIME_JOBS |
| Worker payload acceptance | missing, owner acceptance required | WORKER_RUNTIME_JOBS |
| Supabase mutation blocked | satisfied | SUPABASE_RLS_STORAGE_DATABASE |
| Storage writes blocked | satisfied | SUPABASE_RLS_STORAGE_DATABASE |
| Signed URLs as source of truth blocked | satisfied | SUPABASE_RLS_STORAGE_DATABASE |
| Public artifacts blocked | satisfied | TRACK_A_RENDER_EXPORT + SUPABASE_RLS_STORAGE_DATABASE |
| QA evidence metadata | plan-defined, no QA row | SOUND_MUSIC_AUDIO + OBSERVABILITY_AUDIT_COST |
| Billing/credit placeholder | plan-defined, no credit row | BILLING_STRIPE_CREDITS |
| Track A final export | blocked | TRACK_A_RENDER_EXPORT |
| Track B processing execution | not accepted | TRACK_B_MEDIA_PROCESSING |
| generated_local_fixture_passed | not claimed | all owners listed above |

## Owner Acceptance Map

| Owner | Must accept before fixture execution | Evidence needed | SOUND may prepare | SOUND must not implement |
| --- | --- | --- | --- | --- |
| SOUND_MUSIC_AUDIO | Fixture plan shape, cue/manifests, audio QA expectations | structured findings, edit intents, cue manifest, private manifest, blocked uses | planning docs and text-only smokes | provider/worker/storage/execution |
| SUPABASE_RLS_STORAGE_DATABASE | source-of-truth row, private path, storage scope, checksum/manifest policy | approved snapshot row plan, storage record policy, RLS acceptance | handoff checklist | SQL, migrations, rows, buckets, objects |
| PROVIDER_GATEWAY_MODELS | provider/license acceptance before real transport | Lyria music-only, SFX provider gates, license states | provider boundary notes | transport, fallback, secrets, SDKs |
| WORKER_RUNTIME_JOBS | worker payload and idempotency acceptance | approved snapshot input shape, raw prompt rejection, private manifest references | blocked worker handoff metadata | dispatch, leases, configs, Cloud Run |
| OBSERVABILITY_AUDIT_COST | QA/audit/cost evidence acceptance | QA gates, audit metadata, cost placeholders | evidence requirements | audit infra, live events, cost systems |
| BILLING_STRIPE_CREDITS | credit placeholder acceptance | no spend/reservation/refund/release claims | blocked billing notes | Stripe, credit rows, ledger mutations |
| TRACK_A_RENDER_EXPORT | final composition handoff acceptance | audio readiness, timing manifest, QA status | handoff notes | mux, render, export, delivery |
| TRACK_B_MEDIA_PROCESSING | processing handoff acceptance when needed | private artifact manifest, source immutability, processing request shape | handoff notes | FFmpeg/media/audio execution |

## Future Prompt Sequence

Exactly one immediate next prompt is recommended:

`SUPABASE-SOUND-0: Supabase/RLS/Storage local fixture acceptance audit`

Rationale: after SOUND defines the generated/local fixture plan, the next hard blocker before any local fixture execution is source-of-truth row, private path, storage scope, manifest, checksum, and RLS/storage acceptance.

Later non-immediate prompts may include Worker Runtime, Provider Gateway, Observability, Billing, Track A, Track B, and a future SOUND generated/local fixture execution prompt, but none of those should run before Supabase/RLS/Storage acceptance is audited.

## Exit Criteria For The Future Generated/Local Fixture Gate

The future generated_local_fixture_passed gate may be claimed only when all of these are true in a later accepted prompt:

- source-of-truth conflicts are resolved;
- owner acceptance is recorded for required Supabase/RLS/Storage boundaries;
- structured findings and edit intents are referenced;
- approved snapshot metadata is accepted;
- raw chat is rejected as a worker execution plan;
- timing-aware cue manifest is present;
- private audio artifact manifest is present;
- checksum is deterministic and verified;
- private path expectation is accepted;
- no signed URL is source of truth;
- no public artifact is created;
- no provider call occurs;
- no worker dispatch occurs unless a later owner explicitly accepts a local fixture path;
- no production worker is dispatched;
- no Supabase live mutation occurs unless explicitly accepted by the Supabase owner;
- no GCP, Docker, Cloud Run, Secret Manager, or model download occurs;
- no FFmpeg or media processing occurs unless a later accepted local fixture prompt explicitly allows it;
- no generated asset row or storage object is created unless accepted by the relevant owners;
- no approval record or credit record is created unless accepted by the relevant owners;
- QA evidence metadata exists;
- observability/audit/cost placeholders are accepted;
- Track A final export remains blocked;
- Track B processing execution remains separately accepted or blocked;
- staging, beta, external beta, paid production, public artifact, signed URL, raw prompt execution, and production unlock remain blocked.

SOUND-3A satisfies only the planning-document and text-smoke layer. It does not claim generated_local_fixture_passed.
