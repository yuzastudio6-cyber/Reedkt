# CAP-09 — Track All and SAM 3.1 Report

Status: `contract_and_runtime_admission_ready_private_track_all_runtime_gated`
Milestone: `CAP-09`
Media/GPU/runtime started: no
Real text-behind-subject fixture claimed: no
Runtime, asset, QA, billing, render, or production authority promoted: no

## Outcome

CAP-09 adds the Caption-owned Track All support boundary without importing a
Track All or SAM server implementation. The versioned payload travels inside
the neutral `SkillSupportRequest`, targets `track_all`, carries exact approved
snapshot/output/scene/range/source/phrase/occupancy lineage, and requests only
mask, track, and anchor artifacts needed for the approved depth intent.

Caption does not choose a GPU route, compile a model prompt, dispatch SAM 3.1,
create mask assets, or reinterpret private runtime internals. The inbound
packet keeps the canonical operation identity
`tool.sam3_1.segment_and_track_subject.v1` as opaque Track All lineage and
explicitly rejects historical SAM 2 for new work.

The post-CAP-20 specialist runtime now consumes this exact typed payload and
emits the same Track All support request. On resume it parses the complete
packet and matches the packet ref, producer, artifact type, and support-request
lineage before it can satisfy `track_all_mask_binding`. An artifact reference,
unbound packet, cross-scene payload, or `contract_fixture` packet cannot
complete the runtime job.

The backend one-writer public record
`canonical-caption-track-all-authenticated-evidence-record-v2` is also consumed
through an independent Caption parser. The copied public type is byte-identical
to backend commit `b4241b6023de986de634fd1a20b705dbedf811cb`
(SHA-256
`43c80e3ca576d4cd93eb6c2e0a96dc556d84f8f14c25c284f8c13b88254571db`).
Caption validates the exact request/payload, SAM 3.1 admission, independent
task-level scene-QA authority, independent scene evidence, packet, Caption
admission, and neutral owner projection without importing the backend service.
A source fixture proves the adapter; no actual persisted backend record or GPU
execution is claimed in this checkout.

## Evidence and QA

`caption-track-all-evidence-packet-v1` binds each requested subject to the
exact frame range, source-frame mapping, output-frame digest, mask sequence,
track manifest, optional anchor manifest, deterministic refinement evidence,
and temporal QA measurements.

The request freezes exact thresholds for:

- complete frame coverage and frame count;
- empty/full mask frames;
- minimum binary intersection-over-union;
- maximum centroid shift;
- maximum boundary disagreement;
- maximum alpha flicker;
- minimum edge quality and subject coverage;
- identity swaps and lost-anchor frames.

OpenCV owns deterministic mask QA. Kornia may perform an approved refinement
operation but cannot replace primary segmentation. CAP-09 treats both as
evidence-producing tools behind Track All; Caption does not execute them.

## Cache and fallback behavior

The cache identity binds purpose, tenant/snapshot/output/scene/range, source,
frame mapping, subject and phrase lineage, confirmed frame, QA thresholds, and
refinement policy. Cross-scene, cross-output, stale, or partial reuse fails
closed. An exact-cache-reuse packet must retain its original result ref and
still pass authenticated reread, artifact QA, and private visual review.

The fixed fallback ladder is:

1. retry Track All with the same approved input;
2. apply approved OpenCV/Kornia refinement;
3. move Caption to the safe top plane;
4. use stable libass Caption;
5. request user review.

Contract fixtures select the safe top plane. They cannot admit text behind a
subject or object anchoring, even when their synthetic measurements pass.

## Verification

`smoke:captions-specialist-cap-09` passes 31 positive and adversarial checks.
It covers the neutral Track All target, exact SAM 3.1 operation identity,
subject/phrase/source/frame lineage, deterministic QA thresholds, mask/track
and anchor requirements, cache separation/reuse, weak overlap/flicker
findings, safe fallback, wrong depth, missing phrase lineage, stale cache,
invalid cache reuse, historical SAM 2, fixture execution overclaims, missing
masks, disallowed payload/evidence combinations, unknown nested data, and
admission overclaims. The additional runtime checks freeze the exact typed
request and prove missing, unbound, crossed, and fixture-only evidence fails
closed.

The focused smoke, server typecheck, and focused ESLint pass. The real
SAM 3.1 + Track All + OpenCV/Kornia + Remotion text-behind-subject media
fixture remains an explicit private-runtime gate for later bounded execution.

`smoke:captions-specialist-canonical-track-all-evidence-read` adds 13 checks for
the frozen public-file hash, complete canonical record admission, strict runtime
consumption, crossed scene/projection rejection, ambiguous input rejection, and
non-resume refusal. It also binds the record to the canonical sequential-resume
ledger and requires a deterministic replay to match the persisted Caption
result digest; altered persisted results fail closed. Its v2 parser also rejects
records that omit the task-level scene-QA authority or confuse that authority
with the scene evidence or SAM result.

## Next milestone

CAP-10 implements semantic phrases, language-aware line breaking, typography
roles, multi-font fallback, optical/semantic size and color, adaptive
legibility, platform profiles, and calibration-preview contracts.
