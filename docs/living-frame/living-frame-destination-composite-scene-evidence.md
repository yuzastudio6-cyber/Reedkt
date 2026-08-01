# Living Frame Destination-Composite Scene Evidence

Status: server-side integration adapter; non-promotable

## Purpose

The destination-composite measurement is useful only if the exact measured
RGBA component reaches the existing scene-evidence and private-review chain.
This adapter converts one clear measurement into the existing
`LivingFrameSceneComponentEvidenceInput`; it does not create a second QA,
renderer, worker, approval, timing, or credit system.

## Required lineage

The adapter revalidates:

- the destination-composite measurement digest and clear measurement state;
- the deterministic motion and component-geometry digests;
- the exact scene, component, output frame, and MasterTiming identity;
- that the measured frame lies inside the scene frame range;
- that the component requires a still-alpha artifact;
- the exact RGBA artifact ID, content digest, and decoded-pixel digest;
- optional alpha-edge decontamination lineage; and
- optional visual-continuity reference and candidate lineage.

The returned component evidence retains the complete five-background alpha
report, including the destination-raster measurement. The existing scene
evidence compiler then derives measurement blockers and keeps canonical
artifact QA and approved-snapshot revalidation open.

## Closed authority

This adapter does not approve an artifact, update the asset manifest, select a
scene, alter MasterTiming, calculate a price, reserve or spend credits, create
work, dispatch a tool, authorize Remotion, or mark an edit production-ready.
