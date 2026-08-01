# Living Frame Selected-Scene Particle Scene QA Test

Status:
`selected_scene_particle_private_scene_qa_green_private_review_compilation_pending`

Contract:
`living-frame-selected-scene-environmental-particle-scene-qa-internal-test-v1`

## Purpose

This private internal test re-opens the exact persisted 105-frame
`scene.helicopter-motion` / `helicopter.downwash` Remotion review and binds
artifact-integrity, media-identity, procedural-alpha, destination-composite,
caption-plane, and MasterTiming evidence into one byte-free scene-QA receipt.

It provides actual internal procedural-particle QA without creating a second
canonical scene-evidence owner. Customer production readiness is not required
for this evidence.

## Actual persisted-media QA

The test consumes a process-bound, single-use persisted-artifact lease. The
lease contains no path or bytes and resolves only through the existing
canonical private Remotion artifact-storage owner.

The existing private media runtime receives a server-injected private stream
and executes `tool.ffprobe.inspect_approved_media.v1`. It independently proves:

- H.264 video;
- 640×360 ratio-preserving private review dimensions;
- 30 FPS;
- exactly 105 decoded frames;
- the exact persisted SHA-256 and byte length; and
- no path, URL, credential, command, environment, or media bytes in the
  report.

## Procedural-alpha and destination QA

The report revalidates the full-timeline pixel evidence for:

- exact selected frame range and all 105 time samples;
- transparent first and last particle frames;
- every materially perceptible particle frame;
- smooth sub-perceptual fade preservation;
- temporal variation and alpha-centroid movement;
- source-plate visibility;
- captions above the particle plane;
- Remotion ownership of every final frame; and
- confirmed output-ratio preservation.

## Shared-interface conflict

`living-frame-scene-evidence-package-v1` carries a
`primitiveQaExpectationRef`, but its output always retains
`procedural_alpha_qa_required`. It has no field or downstream discharge
contract for actual time-sampled procedural QA evidence.

The namespaced report therefore records:

`scene_evidence_v1_has_primitive_expectation_only_no_actual_procedural_qa_discharge`

It does not alter the shared package, claim canonical QA approval, or create a
parallel scene-evidence owner. The canonical backend owner must add or approve
the procedural-QA discharge bridge before the generic scene package can become
green for this component.

## Authority boundary

The test proves `privateInternalSceneQaPassed: true`. It keeps false:

- canonical QA approval;
- selected-scene or MasterTiming ownership;
- work-graph or asset-manifest mutation;
- private-review approval;
- cost or billing;
- public delivery;
- external beta; and
- production readiness.

The adjacent private-review test now consumes a separate single-use lease,
re-hashes the complete stored artifact, and compiles a byte-free review
receipt for this exact lineage while preserving the existing canonical review
authority.

## Validation

Run:

`npm run smoke:living-frame-selected-scene-environmental-particle-internal-test`

The smoke includes forged persistence-lineage rejection and proves both the
persisted-artifact lease and final-render lease reject reuse.

## Files

- `src/types/living-frame-selected-scene-environmental-particle-scene-qa-internal-test.ts`
- `server/living-frame/living-frame-selected-scene-environmental-particle-scene-qa-internal-test.ts`
- `server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts`

See also
`docs/living-frame/living-frame-selected-scene-environmental-particle-private-review-internal-test.md`.
