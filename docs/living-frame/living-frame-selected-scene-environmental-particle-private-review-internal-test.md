# Living Frame Selected-Scene Particle Private Review Test

Status:
`selected_scene_particle_private_review_evidence_green_canonical_reconciliation_pending`

Contract:
`living-frame-selected-scene-environmental-particle-private-review-internal-test-v1`

## Purpose

This private internal test compiles one review-evidence receipt for the exact
persisted and QA-passed `scene.helicopter-motion` /
`helicopter.downwash` render.

It closes the selected environmental-particle slice privately end to end:

```text
selected scene and MasterTiming
→ real 105-frame PixiJS procedural-alpha sequence
→ seven real Remotion compositions
→ exact 105-frame private MP4
→ canonical create-only private persistence
→ independent persisted-media and scene QA
→ process-private review evidence
```

Customer production readiness is not required for this internal proof.

## Review artifact verification

The test consumes a process-bound, single-use private-review artifact lease.
It re-opens the exact canonical private stream and independently recomputes:

- the complete byte length; and
- the complete SHA-256 digest.

The byte-free review receipt then binds:

- selected-scene identity;
- MasterTiming lineage;
- confirmed output-frame lineage;
- exact 105-frame H.264 media QA;
- procedural-alpha QA;
- destination-composite QA;
- source-plane preservation;
- caption-plane priority; and
- Remotion final-canvas ownership.

The lease rejects reuse. No media bytes, storage path, URL, credential,
command, or environment value enters the receipt.

## Canonical review conflict

The existing `compileCanonicalLivingFramePrivateReviewEvidence` compiler is
correct for its current static component route:

```text
generated opaque still
→ rembg
→ Sharp RGBA component
→ static Remotion layer manifest
→ final composition
```

It does not yet represent a time-sampled procedural-alpha component sequence.
Its overlay validation requires the static Sharp component work item and layer
manifest.

The namespaced report records:

`canonical_private_review_v1_requires_static_sharp_rgba_component_and_has_no_procedural_timeline_artifact_contract`

The report does not alter that compiler or create a parallel review owner.
The canonical backend owner must add an approved procedural-timeline artifact
and manifest contract before the generic review evidence can consume this
slice.

## Authority boundary

The test proves:

- `privateReviewEvidenceCompiled: true`;
- `privateInternalReviewEvidencePassed: true`; and
- `privateInternalParticleSliceEndToEndPassed: true`.

It keeps false:

- canonical QA approval;
- private-review approval;
- work-graph or asset-manifest mutation;
- further rendering;
- cost or billing;
- public delivery;
- external beta; and
- production readiness.

These false fields preserve canonical ownership; they do not reduce the
strength of the private internal execution proof.

## Validation

Run:

`npm run smoke:living-frame-selected-scene-environmental-particle-internal-test`

The smoke includes forged scene-QA lineage rejection and review-lease replay
rejection.

## Files

- `src/types/living-frame-selected-scene-environmental-particle-private-review-internal-test.ts`
- `server/living-frame/living-frame-selected-scene-environmental-particle-private-review-internal-test.ts`
- `server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts`
