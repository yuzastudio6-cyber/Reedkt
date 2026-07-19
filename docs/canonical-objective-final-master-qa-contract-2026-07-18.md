# Canonical Objective Final-Master QA Contract

Status: bounded server-only contract and synthetic smoke evidence. This increment does not read or decode media, execute FFmpeg/FFprobe, dispatch Google Cloud work, persist QA, modify the canonical queue, create a render, call a provider, run Supabase, calculate a new customer estimate, charge credits, mutate a wallet, unlock public delivery, or make ReEditPro production-ready.

## Why This Layer Exists

The existing canonical final-QA path performs real independent FFprobe inspection for bounded private test masters. It verifies MP4, H.264, AAC, frame size/rate/count, BT.709 tags, audio sample rate/channels, and duration drift. That is necessary technical evidence, but it is not a complete professional final-master inspection.

FFprobe metadata alone cannot prove that every frame decodes, timestamps remain monotonic, unexpected black/frozen/flash frames are absent, program audio meets the approved loudness/peak policy, clipping or unexplained silence is absent, A/V sync is within tolerance, every approved timing/layer is represented, every chunk boundary has color-continuity evidence, or the exact private artifact survived create-only persistence and readback.

This contract defines one objective-media evidence manifest over those concerns. It is designed to feed the existing private artifact QA authority later; it is not a second QA store, queue, tool registry, render system, or commercial authority.

## Exact Authority

Every evaluation binds:

- owner, workspace, project, and exact edit session;
- immutable approved plan and snapshot hashes;
- immutable approved execution-package hash;
- original approved estimate, active reservation, and approved deliverable;
- exact 1080p, 2K/1440p, or 4K export frame already covered by the original 4K estimate;
- one private final-master artifact ID, SHA-256, byte length, and opaque storage identity;
- exact Master Timing, source-sequence, required-layer, optional caption-track, and approved exception-manifest hashes;
- final-master work item, job, attempt, lease, single-use dispatch, runner, internal-cost, artifact-QA, and reconciliation hashes;
- six exact gate evidence identities and hashes.

Export-time re-estimation and customer charging are explicitly false. Selecting a 2K or 1080p deliverable remains covered by the original 4K estimate and reservation rather than creating a second credit prompt at export.

## Six Required Objective Gates

1. `technical_media_contract` consumes exact independent `final_export_v1` FFprobe evidence and checks MP4/H.264/AAC, approved dimensions, rational frame rate, exact frame count, BT.709 SDR tags, 48 kHz mono/stereo audio, and at most two frames of duration drift.
2. `decoded_video_integrity` requires full-frame decoded coverage, exact first/last/count identity, monotonic timestamps, zero decode errors, and zero unexpected black, freeze, or flash findings after applying only approved exception ranges.
3. `decoded_audio_quality_sync` requires full program-audio decode, approved sample rate/channels, an approved integrated-loudness window, true peak and loudness-range limits, at most two frames of A/V drift, no unexpected clipped samples or digital-silence ranges, and speech-clarity passage.
4. `master_timing_layer_reconciliation` binds the exact approved timing/source/layer/caption hashes and requires gap-free, overlap-free, placeholder-free, collision-free, full-frame coverage in the approved source order.
5. `cross_chunk_color_continuity` requires every expected chunk boundary to have a passed, hash-bound continuity result or approved exception. The top-level gate is an internal reconciliation over the existing pairwise evidence, not a duplicate FFmpeg operation.
6. `private_artifact_integrity` reopens the exact private object and requires matching SHA-256/length/storage identity, create-only persistence, private readback, artifact-QA and reconciliation hashes, no overwrite, and no public URL.

Intentional black frames, still holds, silence, and color changes are not automatically treated as defects. They must appear in the immutable approved exception manifests. Anything unexpected fails or requires review.

## Honest Failure Semantics

A gate can produce `failed` or `needs_user_review` evidence and still be structurally valid. That evidence blocks objective QA but remains auditable. A gate that claims `passed` while its metrics violate policy is invalid authority, not merely a warning.

Evidence tampering, mixed artifacts, mixed snapshots/packages, duplicate gate/evidence/attempt identities, missing gates, invalid internal-cost evidence hashes, or any customer-price/credit/fee/charge/wallet/billing authority fails closed.

## Large And Long-Form Masters

The normalized contract admits private masters up to the existing 1 TiB professional media ceiling. The smoke proves only arithmetic and identity validation for a synthetic 512 GiB record; it does not allocate, render, persist, read, or decode such a file.

For multi-hour video, full decode QA should execute as bounded, independently leased chunks. Each chunk needs exact frame/sample ranges, create-only evidence, internal-cost records, QA, reconciliation, retry/recovery, and replay. A server-owned aggregator can pass the final gate only after every range and boundary is accounted for. One giant uncheckpointed process is not the intended runtime.

## Local And Private Google Cloud Evidence

Each gate records either `private_local_test` or `private_gcp_internal` execution provenance. Private-GCP evidence requires a hash of the exact Cloud execution resource. The evaluator itself never dispatches a job; its `googleCloudDispatchMade` boundary remains false even when it verifies evidence created by an earlier authorized private-GCP job.

External AI provider calls are not part of objective final-master media QA.

## Cost Boundary

Every gate binds an internal production-cost evidence-set hash. A set may cover one attempt or a bounded group of decoded chunks/boundaries, including failed attempts. It must remain separate from:

- customer price;
- customer credits;
- ReEditPro service fee;
- export-time charging;
- wallet mutation;
- billing or settlement.

The top-level final-master render attempt retains its own cost hash. QA cannot hide failed compute or add a second customer charge.

## Current Evidence And Current Gap

The focused smoke proves:

- complete synthetic 4K objective evidence passes;
- 2K passes under the same original 4K-approved estimate with no new estimate or charge;
- gate order cannot change the evidence-set or manifest hash;
- private-GCP provenance is representable without dispatching from the evaluator;
- valid failure and review evidence blocks without becoming a malformed record;
- missing gates, wrong resolution/reservation/artifact, duplicate identities, tampering, and a commercial-boundary violation fail closed;
- a synthetic 512 GiB private-master identity is accepted below the 1 TiB ceiling without reading bytes.

Run it with:

```bash
./node_modules/.bin/tsx server/smoke/objective-final-master-qa-smoke.ts
```

The current canonical FFprobe report alone intentionally fails this six-gate contract with five missing gates. Other repository slices contain separate Master Timing, continuous-program-audio, cross-chunk-color, artifact-QA, and reconciliation evidence, but those pieces have not yet been bound into one exact final-master objective manifest for the same completed artifact. No complete real-media objective-final-master run is claimed here.

## Deliberate V1 Limits

This version targets the current private SDR delivery contract: H.264, `yuv420p`, BT.709 limited range, AAC, and an audio-bearing master. It does not claim HEVC/AV1, 10-bit/HDR, ProRes/mezzanine delivery, approved silent masters, surround/immersive audio, arbitrary codecs, or public delivery. Those require versioned policies and representative runtime evidence rather than loosening this contract silently.

This objective layer also does not include:

- semantic match to user intent;
- story/editorial quality judgment;
- Edit Preference/Edit Reference compliance;
- adapted-not-copied or copy-safety QA;
- factual/safety review;
- human creative acceptance.

Those gates remain required for full ReEditPro product readiness. Edit Preference/Edit Reference semantics stay owned by the separate coordinated task; this backend slice does not create a competing contract.

## Next Safe Runtime Integration

After the Motion Studio FFmpeg shared-seam handoff is frozen, the backend can reconcile exact decoded-video and decoded-audio QA recipe profiles into the canonical media-binary runtime without concurrent edits. The safe sequence is:

1. add approved, confined, zero-network decoded-video and decoded-audio QA profiles under the existing FFmpeg operation;
2. compile server-owned objective-QA work items from the immutable approved package;
3. execute through the canonical reservation, lease, one-use dispatch, attempt-cost, private artifact, QA, reconciliation, recovery, and replay authority;
4. aggregate all long-form chunks and boundaries into this manifest;
5. consume the result through the existing private artifact QA/review assembly;
6. integrate the externally owned semantic Preference/reference/copy-safety evidence after its verified handoff;
7. keep public delivery, external beta, billing, and production blocked until their independent evidence gates pass.
