# Living Frame Destination-Composite Measurement

Status: server-side byte measurement; non-promotable

Contract:
`living-frame-destination-composite-measurement-v1`

## Purpose

A transparent component can look clean over synthetic black, white, gray, and
red backgrounds while still disappearing or producing an obvious edge against
the actual destination frame. This measurement binds the exact generated-still
RGBA component to one exact output frame and reruns the existing alpha
measurement with that frame's server-owned RGB bytes.

It does not create another QA system. Its report is evidence for the existing
`asset_quality_gate`, scene-evidence package, render preflight, and private
review.

## Exact lineage

The server must independently bind:

- the generated-still artifact/QA projection;
- the original four-background alpha report;
- the same RGBA artifact ID, file digest, and decoded-pixel digest;
- the selected scene and component;
- the confirmed output-frame digest;
- the canonical MasterTiming digest and exact destination frame index; and
- the destination frame artifact and decoded RGB digest.

The component and destination rasters must have identical dimensions. Raw
pixels remain server-only and are never serialized in the measurement.

## Fixed behavior

The existing alpha engine measures:

1. black;
2. white;
3. mid-gray;
4. saturated red; and
5. the actual destination raster.

The destination report blocks on opaque/fake alpha, contaminated or invalid
edges, insufficient transparent margin, high edge discontinuity, or very low
destination-edge contrast. A clear measurement remains pending canonical QA;
it never marks the asset approved.

## Existing authorities reused

Canonical artifact reread, `asset_quality_gate` interpretation, continuity and
documentary-fact review, asset-manifest reconciliation, scene-evidence
reconciliation, private review, and Remotion readiness remain downstream
authorities. Timing still comes only from MasterTiming.

No timing, worker, queue, tool, provider, pricing, credit, approval, snapshot,
manifest, QA, private-review, renderer, runtime, or production authority is
created here.
