# Living Frame Selected-Scene Particle Private Persistence Test

Status:
`selected_scene_particle_remotion_review_persisted_scene_qa_and_review_pending`

Contract:
`living-frame-selected-scene-environmental-particle-private-persistence-internal-test-v1`

## Purpose

This private internal test persists the exact verified 105-frame
`scene.helicopter-motion` / `helicopter.downwash` Remotion review through
ReeditPro's existing canonical private Remotion artifact-storage owner.

It proves that the full selected-scene output can cross the render-to-artifact
boundary without introducing a Living Frame-specific storage lane. It does not
mutate the canonical asset manifest, approve QA, approve private review, create
cost, charge a customer, publish an artifact, or promote a production route.

## Exact lineage

The test revalidates:

- the selected scene and component scope;
- selected-scene publication and component lineage;
- the canonical MasterTiming digest;
- the confirmed output-frame digest;
- the PixiJS runtime and exact 105-frame sequence digests;
- the full-timeline Remotion report digest;
- the final MP4 digest and byte length; and
- the single-use, process-bound final-output lease.

The final-output lease contains only a byte-free receipt. The rendered MP4
remains in a private server `WeakMap` until the existing persistence owner
consumes it. The lease cannot be serialized into a portable artifact
capability and rejects reuse after one consumption.

## Canonical persistence

The adapter invokes:

- `persistCanonicalPrivateRemotionArtifactStream`; and
- `inspectCanonicalPrivateRemotionArtifact`.

The existing storage owner enforces create-only persistence, MP4 signature
validation, exact stream length and SHA-256 commitment, private-local path
confinement, no-follow reads, and independent readback inspection.

The Living Frame adapter derives one opaque object identity from the approved
scope and exact render lineage. It never returns storage paths, URLs,
credentials, commands, environment values, or rendered bytes.

## Evidence

The smoke proves:

- the exact final MP4 digest and length survive persistence;
- a new private artifact is created rather than replayed;
- the persisted artifact independently reads back with the same digest and
  length;
- the final-output lease is consumed exactly once;
- a second lease consumption fails closed;
- no asset-manifest mutation is inferred;
- no QA or private-review approval is inferred; and
- customer charging, external beta, and production remain false.

## Internal-test boundary

Customer production readiness is intentionally not the acceptance target for
this stage. The target is a complete private internal Living Frame workflow
with real execution, persisted artifacts, scene QA, private review, and
representative mode tests.

The next internal milestone is canonical scene-evidence QA plus private review
for this exact persisted artifact. Public delivery, live billing, cloud
deployment, external beta, and production promotion remain later release
work.

## Validation

Run:

`npm run smoke:living-frame-selected-scene-environmental-particle-internal-test`

The smoke executes the full PixiJS and Remotion timeline before exercising the
canonical private persistence boundary and its adversarial single-use checks.

## Files

- `src/types/living-frame-selected-scene-environmental-particle-private-persistence-internal-test.ts`
- `server/living-frame/living-frame-selected-scene-environmental-particle-private-persistence-internal-test.ts`
- `server/living-frame/living-frame-environmental-particle-remotion-internal-composite.ts`
- `server/smoke/living-frame-selected-scene-environmental-particle-internal-test-smoke.ts`
