# TRACK-B-SOUND-0 Audio Fixture Media Processing Handoff Audit

## Status

- Workstream owner: TRACK_B_MEDIA_PROCESSING
- Requesting workstream: SOUND_MUSIC_AUDIO
- Related source workstreams: SUPABASE_RLS_STORAGE_DATABASE, WORKER_RUNTIME_JOBS, PROVIDER_GATEWAY_MODELS, OBSERVABILITY_AUDIT_COST, BILLING_STRIPE_CREDITS, TRACK_A_RENDER_EXPORT
- Current SOUND stage: dry_run_passed
- Target future stage: generated_local_fixture_passed
- Decision: conditional_track_b_acceptance_for_metadata_only_media_processing_handoff
- This document is audit-only.
- This document does not process media.
- This document does not run FFmpeg.
- This document does not run ffprobe.
- This document does not run audio cleanup, separation, analysis, or model inference.
- This document does not create processed media artifacts.
- This document does not create generated assets.
- This document does not create public artifacts.
- This document does not create signed URLs.
- This document does not mutate Supabase.
- This document does not call providers or dispatch workers.
- This document does not render, mux, or export.
- This document does not create credit rows.
- This document does not unlock generated_local_fixture_passed.

SUPABASE-SOUND-4 remains globally blocked because SOUND scope acceptance is still not explicitly complete.

## Source-of-truth rule

Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot

Signed URLs are not source of truth. Public URLs are blocked. Public artifacts are blocked. Track B later must consume source-of-truth records, private artifact references, manifests, checksums, and approved snapshots, not signed URLs or raw chat.

## Raw prompt rule

user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution

Raw prompt execution is blocked. Track B must not process media from raw chat, planning text, local mock fixture IDs, signed URLs, or provider output claims.

## Track B decision summary

TRACK_B_MEDIA_PROCESSING conditionally accepts future SOUND local fixture media/audio processing handoff evidence only as metadata/spec boundary expectations.

- trackBDecision: conditional_track_b_acceptance_for_metadata_only_media_processing_handoff.
- trackBAllowsMetadataOnlyMediaProcessingHandoff: true.
- trackBAllowsMediaProcessing: false.
- trackBAllowsFFmpeg: false.
- trackBAllowsModelInference: false.
- trackBAllowsProcessedMediaArtifact: false.
- trackBAllowsPublicArtifact: false.
- globalGoForSUPABASE_SOUND_4: false.

This decision does not approve FFmpeg execution, ffprobe execution, media processing, audio cleanup, audio separation, audio analysis, DeepFilterNet/RNNoise/Demucs inference, processed media artifact creation, generated asset creation, public artifact publishing, signed URL delivery, beta readiness claims, production readiness claims, or silent acceptance. This decision does not claim generated_local_fixture_passed. Track B approval alone does not make SUPABASE-SOUND-4 globally allowed because SOUND scope acceptance remains missing.

## Accepted by Track B Media Processing

- metadata-only media/audio processing boundary expectations;
- source media immutability expectation;
- timing-aware cue manifest expectation;
- private audio artifact manifest expectation;
- approved plan snapshot reference expectation;
- generated/local fixture spec reference expectation;
- checksum/private path expectation;
- audio QA evidence reference expectation;
- speech/ducking metadata expectation;
- music-over-voice metadata expectation;
- SFX timing metadata expectation;
- loudness expectation metadata;
- sync/timing expectation metadata;
- no FFmpeg execution;
- no ffprobe execution;
- no audio cleanup execution;
- no audio separation execution;
- no audio analysis execution;
- no model inference;
- no media processing execution;
- no processed media artifact;
- no generated asset;
- no public artifact;
- no signed URL;
- no storage write;
- no Track A final export;
- evidence must list what can be consumed later and what cannot be consumed yet.

## Rejected / still blocked by Track B Media Processing

- FFmpeg execution;
- ffprobe execution;
- audio cleanup execution;
- audio separation execution;
- audio analysis execution;
- DeepFilterNet/RNNoise/Demucs model inference;
- processed media creation;
- generated asset creation;
- storage writes;
- public artifact delivery;
- signed URL delivery;
- final export/mux claim;
- generated_local_fixture_passed claim;
- provider execution;
- worker dispatch;
- Supabase mutation;
- credit row creation.

## Media processing readiness table

| Handoff area | Current repo evidence | Metadata-only accepted now | Media processing execution allowed now | Missing evidence | Owner | Required before generated_local_fixture_passed |
| --- | --- | --- | --- | --- | --- | --- |
| source media immutability | Production audio artifact and fixture docs require immutable source media | yes | no | future Track B source media policy for this fixture path | TRACK_B_MEDIA_PROCESSING | yes |
| timing-aware cue manifest | SOUND dry-run and fixture evidence expose timing-aware cue manifest expectations | yes | no | accepted Track B consumption criteria | SOUND_MUSIC_AUDIO + TRACK_B_MEDIA_PROCESSING | yes |
| private audio artifact manifest | SOUND dry-run and fixture evidence expose private audio artifact manifest expectations | yes | no | accepted private artifact record and storage source-of-truth path | SOUND_MUSIC_AUDIO + SUPABASE_RLS_STORAGE_DATABASE + TRACK_B_MEDIA_PROCESSING | yes |
| approved snapshot reference | SOUND and Supabase packets require approved plan snapshots before worker execution | yes | no | future accepted approved snapshot row evidence | SUPABASE_RLS_STORAGE_DATABASE + TRACK_B_MEDIA_PROCESSING | yes |
| fixture spec reference | SOUND-3B fixture spec is deterministic and mock/reference-only | yes | no | future accepted fixture spec version and checksum linkage | SOUND_MUSIC_AUDIO + TRACK_B_MEDIA_PROCESSING | yes |
| checksum/private path expectation | SOUND and Supabase packets require checksum and private path expectations | yes | no | future accepted checksum/private path row evidence | SUPABASE_RLS_STORAGE_DATABASE + TRACK_B_MEDIA_PROCESSING | yes |
| QA evidence expectation | Observability accepts metadata-only QA evidence expectations | yes | no | future accepted QA evidence format and processing threshold | OBSERVABILITY_AUDIT_COST + TRACK_B_MEDIA_PROCESSING | yes |
| speech/ducking metadata | SOUND dry-run evidence tracks speech overlap and ducking warnings | yes | no | future Track B acceptance criteria for speech/ducking metadata consumption | SOUND_MUSIC_AUDIO + TRACK_B_MEDIA_PROCESSING | yes |
| music-over-voice metadata | SOUND and audio QA policies flag music-over-voice review and ducking | yes | no | future media processing QA criteria | SOUND_MUSIC_AUDIO + TRACK_B_MEDIA_PROCESSING | yes |
| SFX timing metadata | SOUND timing cue manifest tracks SFX timing and transition anchors | yes | no | future timing/sync tolerance acceptance | SOUND_MUSIC_AUDIO + TRACK_B_MEDIA_PROCESSING | yes |
| loudness expectation metadata | Audio QA policy and Observability evidence require loudness metadata | yes | no | future loudness threshold acceptance | OBSERVABILITY_AUDIT_COST + TRACK_B_MEDIA_PROCESSING | yes |
| sync/timing expectation metadata | SoundSync and final render QA policies require audio sync evidence | yes | no | future media processing sync validation evidence | TRACK_B_MEDIA_PROCESSING + OBSERVABILITY_AUDIT_COST | yes |
| audio cleanup | Real audio execution policy keeps cleanup model/tool execution gated | no | no | future cleanup execution policy and local fixture acceptance | TRACK_B_MEDIA_PROCESSING | yes |
| audio separation | Real audio execution policy keeps separated stems as future private artifacts | no | no | future separation execution policy and model readiness evidence | TRACK_B_MEDIA_PROCESSING | yes |
| audio analysis | Audio QA metadata exists, but no analysis execution is accepted here | no | no | future analysis execution policy and QA evidence format | TRACK_B_MEDIA_PROCESSING + OBSERVABILITY_AUDIT_COST | yes |
| FFmpeg/ffprobe | Real audio execution policy allows only future controlled local-dev FFmpeg plans | no | no | future no-production, local-only FFmpeg/ffprobe acceptance | TRACK_B_MEDIA_PROCESSING + WORKER_RUNTIME_JOBS | yes |
| DeepFilterNet/RNNoise/Demucs | Provider and audio docs mark cleanup/separation models review-gated | no | no | future model/license/readiness acceptance and model-weight manifest | TRACK_B_MEDIA_PROCESSING + PROVIDER_GATEWAY_MODELS | yes |
| processed media artifact | This path creates no cleaned audio, separated stem, or processed media artifact | no | no | future private processed-media artifact policy and checksum evidence | TRACK_B_MEDIA_PROCESSING + SUPABASE_RLS_STORAGE_DATABASE | yes |
| generated asset row | Supabase packets keep generated asset rows blocked | no | no | future accepted generated asset row policy | SUPABASE_RLS_STORAGE_DATABASE + TRACK_B_MEDIA_PROCESSING | yes |
| private storage row | Supabase owner decision allows only future local validation, not live storage writes | no | no | future private storage row and RLS/storage acceptance | SUPABASE_RLS_STORAGE_DATABASE + TRACK_B_MEDIA_PROCESSING | yes |
| public artifact | Public artifacts remain blocked by SOUND, Track A, and delivery policies | no | no | future approved delivery/share policy and owner acceptance | TRACK_A_RENDER_EXPORT + SUPABASE_RLS_STORAGE_DATABASE | yes |
| signed URL | Signed URLs are not source of truth and are not created by this path | no | no | future approved delivery/share policy only, if any | TRACK_A_RENDER_EXPORT + SUPABASE_RLS_STORAGE_DATABASE | yes |
| Track A final mux/export | Track A final composition handoff is metadata-only and final export remains blocked | no | no | future Track A render/export acceptance and final QA evidence | TRACK_A_RENDER_EXPORT | yes |

## Future media processing handoff format

Future metadata shape:

- trackBHandoffId: mock/reference-only now
- approvedPlanSnapshotId
- timingAwareCueManifestId
- privateAudioArtifactManifestId
- fixtureSpecId
- qaEvidenceRef
- trackAHandoffRef
- sourceMediaRef: future source-of-truth only
- storageObjectRecordRef: future only
- generatedAssetRef: future only
- expectedProcessingKind
- expectedInputScope
- expectedOutputScope
- expectedChecksumPolicy
- expectedSourceMediaImmutability
- expectedBlockedUses
- mediaProcessingReady: false
- ffmpegAllowed: false
- modelInferenceAllowed: false
- processedMediaArtifactCreated: false
- publicArtifactAllowed: false
- signedUrlDeliveryAllowed: false
- persistedNow: false

This prompt creates no Track B handoff row, no media processing request, no processed media artifact, no generated asset, no storage object, no public artifact, and no signed URL.

## Track A boundary

Track A final mux/export remains blocked. Track B cannot claim final composition or export readiness. Track B must not duplicate Track A render/export, final composition, final delivery, public visibility, or final QA ownership. Track A handoff remains metadata-only.

## Required before TRACK-B-SOUND-1

- metadata-only Track B handoff format approved;
- no-media-processing smoke;
- no-FFmpeg smoke;
- no-ffprobe smoke;
- no-model-inference smoke;
- no-processed-media-artifact smoke;
- no-public-artifact smoke;
- no-signed-URL smoke;
- source media immutability requirements approved;
- timing/private manifest consumption requirements approved;
- QA/loudness/sync evidence expectations accepted;
- Track A boundary accepted;
- Supabase source-of-truth rows accepted;
- processed media/private storage records accepted;
- media processing execution policy accepted later.

## Cross-owner status after Track B decision

### TRACK_B_MEDIA_PROCESSING

owner: TRACK_B_MEDIA_PROCESSING.
status: accepted_conditionally.
evidence: conditional metadata-only media/audio processing handoff acceptance; media processing, FFmpeg, ffprobe, model inference, processed media artifacts, public artifacts, and signed URLs blocked.
missingEvidence: future Track B handoff schema, source media immutability policy, controlled local fixture processing policy, model/tool readiness evidence, processed-media artifact policy, and processing QA threshold evidence.

### TRACK_A_RENDER_EXPORT

owner: TRACK_A_RENDER_EXPORT.
status: accepted_conditionally.
evidence: TRACK-A-SOUND-0 conditionally accepts metadata-only final composition handoff expectations.
missingEvidence: future final composition handoff schema, render/export execution acceptance, private final export policy acceptance for this fixture, and final QA threshold evidence.

### BILLING_STRIPE_CREDITS

owner: BILLING_STRIPE_CREDITS.
status: accepted_conditionally.
evidence: BILLING-SOUND-0 conditionally accepts metadata-only no-spend credit placeholder expectations.
missingEvidence: future estimate policy, approval policy, reservation policy, spend/refund/release policy, and paid-phase Stripe/payment policy.

### OBSERVABILITY_AUDIT_COST

owner: OBSERVABILITY_AUDIT_COST.
status: accepted_conditionally.
evidence: OBSERVABILITY-SOUND-0 conditionally accepts metadata-only QA/audit/cost evidence expectations.
missingEvidence: future persisted evidence schema owner decision, no-silent-acceptance smoke, no-beta/no-production claim smoke, and later advisor output capture approval.

### PROVIDER_GATEWAY_MODELS

owner: PROVIDER_GATEWAY_MODELS.
status: accepted_conditionally.
evidence: PROVIDER-GATEWAY-SOUND-0 conditionally accepts no-provider local fixture metadata/spec validation.
missingEvidence: provider route contract draft, license/compliance table approval, fallback policy approval, and cost/error/audit acceptance for any future execution.

### WORKER_RUNTIME_JOBS

owner: WORKER_RUNTIME_JOBS.
status: accepted_conditionally.
evidence: WORKER-RUNTIME-SOUND-0 conditionally accepts future payload-shape validation only.
missingEvidence: no-dispatch payload-shape validation smoke and owner acceptance for future worker-facing contract changes.

### SUPABASE_RLS_STORAGE_DATABASE

owner: SUPABASE_RLS_STORAGE_DATABASE.
status: accepted_conditionally.
evidence: SUPABASE-SOUND-3D conditionally accepts future local/throwaway/non-production SQL validation only.
missingEvidence: no live rows, no storage writes, no active migration, no generated asset/source-of-truth execution acceptance, and no SUPABASE-SOUND-4 authorization.

### SOUND_MUSIC_AUDIO

owner: SOUND_MUSIC_AUDIO.
status: missing.
evidence: SOUND dry-run, fixture spec, handoff packet, owner checklist, fixture planning docs, and audio cue/manifest metadata exist.
missingEvidence: explicit no-provider/no-worker/no-row fixture scope acceptance for the next phase.

## Go / no-go for SUPABASE-SOUND-4

Track B conditionally accepts metadata-only media/audio processing handoff expectations, but globalGoForSUPABASE_SOUND_4 remains false. SUPABASE-SOUND-4 cannot proceed until SOUND scope owner evidence is collected and no owner disputes the no-execution fixture boundary.

## Runtime / media-processing gate behavior

- media processing: false.
- FFmpeg: false.
- ffprobe: false.
- audio cleanup: false.
- audio separation: false.
- audio analysis: false.
- model inference: false.
- processed media artifacts: false.
- generated assets: false.
- public artifacts: false.
- signed URL creation: false.
- render: false.
- mux: false.
- export: false.
- provider calls: false.
- worker dispatch: false.
- Supabase mutation: false.
- SQL execution: false.
- migration deploy: false.
- storage buckets or objects: false.
- credit rows: false.
- feature gates changed: false.
- tool capabilities seeded: false.
- worker runtime configs created: false.
- Track A final mux/export accepted: false.
- Track B media processing ready: false.

## Supabase update classification

Supabase update required: no.
Supabase update status: Track B handoff audit only; no SQL; no mutation.
Supabase environment touched: no.
SQL executed: no.
Migration deployed: no.
Evidence docs: Supabase owner decision, Worker Runtime audit, Provider Gateway audit, Observability fixture evidence audit, Billing fixture credit placeholder audit, Track A final composition handoff audit, and this Track B media processing handoff audit.
Blockers: no media processing acceptance for execution, no approved snapshot rows, no storage rows, no generated assets, no jobs, no processed media artifact, no final export, no explicit SOUND scope acceptance, and no complete runtime owner acceptance for execution.
Next Supabase action: none in this prompt.

## Recommendation

SOUND-SUPABASE-ACCEPT-0: SOUND scope acceptance for local SQL validation, no execution
