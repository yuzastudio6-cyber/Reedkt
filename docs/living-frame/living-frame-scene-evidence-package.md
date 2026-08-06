# Living Frame Scene Evidence Package

## Status

This is a controlled, non-promotable server-side evidence binder. It joins
Living Frame motion, component geometry, alpha, temporal-mask,
decontamination, and continuity measurements into one subject-agnostic scene
package. It is not a selected scene, approved asset manifest, QA decision,
renderer plan, work graph, or production runtime.

## Why this exists

Individual media checks are not enough. A scene can have a valid alpha report
that belongs to the wrong component, a stable temporal mask for the wrong
frame range, a continuity comparison against the wrong reference, or motion
tracks whose component geometry is stale.

The scene evidence package fails closed across those boundaries. It binds:

- the deterministic-motion bundle;
- the component-geometry bundle;
- the exact scene and output-frame lineage;
- one evidence entry for every visual component;
- alpha measurement for still-RGBA components;
- temporal-mask measurement for temporally masked components;
- optional edge-decontamination lineage;
- continuity comparison when the planning expectation requires it; and
- unresolved procedural or additive primitive QA expectations.

## Component rules

### Opaque components

Opaque plates use an opaque-raster artifact and no alpha or mask report.

### Still alpha

A still-alpha component requires an RGBA artifact and a valid alpha
measurement whose artifact ID and digest match. If edge decontamination is
present, its measured output digest must equal the final alpha measurement's
measured RGBA digest.

### Temporal masks

A temporally masked component requires a source artifact plus a mask-sequence
artifact. The sequence ID and frame-set digest must match, and its first and
last frames must exactly cover the scene's current motion expectation.

### Procedural and additive layers

Procedural alpha and additive effects remain blocked on a future canonical
primitive-QA reference. The reference is an expectation only and never proves
that a renderer primitive is installed, qualified, approved, or executable.

### Continuity

When continuity is required, the report's candidate artifact must match the
component artifact and its reference artifact must match the expected
reference. The measurement does not prove identity, likeness safety,
historical truth, or final visual QA.

## Finding disposition

The binder does not silently turn measurements into production approval.
Known structural or visual concern codes produce a blocked controlled
package. Clean measurements produce
`evidence_bound_pending_canonical_qa`, which still requires:

- current server re-read;
- source, identity, likeness, and documentary review as applicable;
- canonical artifact QA;
- exact MasterTiming and output-frame revalidation;
- estimate and user approval;
- immutable approved snapshot projection;
- existing work graph and asset manifest admission; and
- private Remotion review.

## Generic scope

Component and artifact IDs are opaque subject-independent identifiers. The
package applies equally to illustrated people, mechanisms, maps, products,
archives, diagrams, scientific elements, speaker footage, and future visual
subjects. Example stories are test coverage, never dispatch logic.

## Authority boundary

Selected-scene, source-truth, identity, likeness, documentary, artifact-QA,
continuity-QA, alpha-QA, temporal-mask-QA, fallback, MasterTiming,
exact-frame, SoundSync, estimate, cost, approval, snapshot, provider,
tool-route, work-graph, queue, asset-manifest, renderer, render-execution,
runtime-promotion, and production authority remain literal false.
