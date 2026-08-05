# Track All architecture

## Public boundary

Track All is `track_all@1.0.0` on `track_all.skill_contract.v1`. The future
head orchestra resolves it through the generic edit-skill plugin registry and
uses only `planAssignment`, `compileApprovedWorkGraph`,
`acceptDependencyArtifact`, `validateWorkItemResult`, and
`finalizeSkillResult`. This implementation does not add the head orchestra.

The public boundary carries model-neutral manifests, assignments, dependency
requests, work items, artifact references, QA lineage, and receipts. It does
not expose prompt builders, SAM sessions, checkpoints, GPU choices, commands,
paths, URLs, OpenCV internals, FFmpeg arguments, or Remotion internals.

## Private planning pipeline

The current pure planning pipeline is:

1. Validate the generic and Track All assignments plus all exact input roles.
2. Interpret the bounded target and decide no-action, dependency, review,
   blocked, deterministic, or SAM-backed work.
3. Derive shot-aware chunks from the qualified frame ceiling, shot boundaries,
   privacy risk, motion, occlusion, target size, and object count.
4. Select an initialization frame from visibility, target size, sharpness,
   blur, occlusion, ambiguity, edge truncation, stability, and optional text
   readability.
5. Allocate explicit 16-object multiplex buckets and exact chunk/session
   counts.
6. Compile a bounded prompt strategy containing no raw chat or caller-selected
   model/path authority.
7. Compile one-writer, mandatory-close, no-unknown-retry session authority.
8. Estimate all selected deterministic, GPU, overlap, treatment, preview, QA,
   and repair work without customer markup.
9. Apply time and credit ceilings before freezing the plan; a ceiling fallback
   removes chunks, sessions, initialization, propagation, visible work, time,
   and cost.
10. Derive 24 hashed planning QA findings from a strict evidence input and
    content-address the aggregate report.

The private modules are not exported from the Track All package index and are
not orchestra-callable skills.

## Deterministic geometry pipeline

The implemented deterministic route uses FFprobe source truth, an approved
FFmpeg bounded-proxy contract, PySceneDetect shot candidates, and two fixed
OpenCV profiles for camera motion and planar homography. OpenCV execution is
confined to the existing pinned no-network, read-only, non-root structured
Python image. It accepts exact source bytes, range, initialization, feature,
RANSAC, and approved planar-corner authority; it accepts no caller executable,
code, environment, path, URL, or derived-pixel output.

The structured Python runner loads only the native package set required by the
single authorized operation in that container. All 19 pinned imports and exact
versions remain image-build requirements, while unrelated native libraries no
longer share one process. This removes the x86 CPU-dispatch collision observed
in GitHub Actions without skipping an operation or weakening confinement.

Camera output contains frame-to-frame and stabilized transforms, motion class,
confidence, discontinuity, and shot-reset evidence. Planar output propagates
four-corner geometry forward and backward from the selected initialization
frame with homography, reprojection, visibility, occlusion, stability, and
confidence evidence. Both strict artifacts reject reordered or out-of-range
frames. See `deterministic-geometry.md`.

## SAM 3.1 operation authority

The immutable V1 operation remains
`tool.sam3_1.segment_and_track_subject.v1`. Track All-grade planning uses the
separate forward-only `tool.sam3_1.track_masklets.v2` authority. V2 accepts
only server-compiled text concepts, positive/negative points, bounding boxes,
anonymous object IDs, bounded ranges, and content-addressed authorities. It
supports a non-zero initialization frame and forward, backward, or
bidirectional propagation. Direct mask prompting remains unqualified and is
rejected.

The V2 session contract enforces one writer, an explicit reset before changing
concept stages, one approved refinement, no automatic retry or alternate
model, and `close_session` in a mandatory terminal handler after success,
failure, cancellation, timeout, reconciliation, or partial output. A separate
attempt-evidence contract prevents injected masklets from being represented as
real checkpoint/CUDA inference. No checkpoint bytes, runner, GPU, or production
binding was activated by TRACK-07.

## Privacy redaction route

The deterministic privacy route compiles exact Track Graph V2 geometry and
FFprobe source truth into the fixed
`approved_track_all_privacy_redaction_matroska_v1` FFmpeg recipe. Reliable
regions are dilated; partial occlusion receives wider coverage; and any lost,
missing, low-confidence, fully occluded, or identity-uncertain span becomes a
full-frame solid cover. Explicit reflection regions are covered separately.

The confined FFmpeg authority accepts numeric regions and fixed treatment
enums only. It cannot accept a filter graph, command, path, URL, destination,
retry, fallback, or public-output choice. Independently derived decoded-pixel
evidence validates the exact flattened private preview before a result can be
projected. See `privacy-redaction.md`.

## Focus and reframe route

TRACK-12 adds deterministic focus handoffs and reframe trajectories backed by
exact Track Graph V2 and box-sequence authority. The fixed private Remotion
profile renders real source media with one canonical trajectory sample per
frame, exact source/range/zoom/safe-zone authority, captions above Track All,
audio removed, and public output forbidden. Integration QA is derived from the
actual Remotion attestation and frame-golden evidence. Color and Render retain
final ownership. See `focus-and-reframe.md`.

## Cross-skill geometry boundary

TRACK-13 adds one strict content-addressed handoff compiler for B-Roll,
Captions, Graphic Design, Living Frame, 3D, Color, Sound, Transition, and
Render. It validates exact Track Graph V2 and box/mask/anchor/camera/planar
lineage before producing consumer-specific discriminated geometry payloads.
B-Roll also receives the frozen Track Graph V1 compatibility projection.

The artifacts contain references and geometry policy only: private mask bytes
remain private, peer skills retain final design ownership, and Track All does
not dispatch any peer skill. See `cross-skill-handoffs.md`.

## Independent QA and bounded repair

TRACK-14 derives target, temporal, mask, chunk-seam, identity, camera/planar,
privacy, and integration findings from strict measurement artifacts. Report
schemas derive their aggregate disposition from the findings, so a raw boolean
or inconsistent rehashed report cannot approve output.

The repair director selects a bounded response from the failed evidence. One
automatic repair is allowed, a second needs exact manual authority, and a
third is rejected. Post-repair acceptance requires fresh independently passed
QA. See `qa-and-repair.md`.

## Canonical work graph and runtime bindings

TRACK-15 persists the exact `track_all_work_graph_v1` artifact and binds its
reference into the generic approved public graph. This exposes the atomic
route dependencies to the future orchestra without exposing private runtime
modules. Every supported manifest job has one exact internal-fixture binding;
canonical-private bindings require an injected executor and durable private
authority, while production bindings remain absent. See
`canonical-work-graph-and-bindings.md`.

TRACK-16 proves the public-only lifecycle across the complete required scenario
matrix and rejects stale graph, dependency, work-result, QA, tenant, and range
lineage. It also reuses the canonical `caption_reserved_zones_v1` contract
instead of maintaining a competing Track All shape. See `public-plugin-e2e.md`.

## Qualification boundary

The generated TRACK-27 V2 artifact is the only runtime-loadable qualification
authority. It binds the exact tested commit, relevant source tree, manifest,
26 ordered dependency authorities, 33 actual command results, 24 fixture
results, all ten route receipts, current B-Roll consumer acceptance, the
canonical-private public E2E, and the blocked SAM canary preflight. Runtime
startup rejects bootstrap, stale, forged, reordered, or overclaimed evidence.

Track All is therefore honestly `planning_qualified` at the top level.
Deterministic geometry, planar tracking, bounded repair, privacy, focus,
reframe, and the public canonical-private lifecycle are independently
`internal_execution_qualified`. The SAM masklet and production-worker routes
remain blocked on real checkpoint, image, GPU, quality, cost, private-store,
security, and release evidence. Injected masklets never promote either route.
