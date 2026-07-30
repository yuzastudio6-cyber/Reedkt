# Living Frame selected-scene full-frame continuity/fact reconciliation

Status: controlled, namespaced, read-only requirement candidate. It does not
resolve a reference artifact, execute continuity or documentary QA, persist an
artifact, mutate the asset manifest, approve private review, render, bill, or
promote production readiness.

## Purpose

The full-frame evidence-readiness contract correctly leaves visual continuity
and documentary truth as downstream gates. This reconciliation makes an
important distinction inside those gates:

```text
Visual Continuity Pack direction
≠ persisted raster reference evidence
≠ aligned-same-view deterministic measurement
≠ documentary fact approval
```

A full-frame source/background plate can require semantic style-continuity QA
because it belongs to a project Visual Continuity Pack while requiring no
raster reference at all. The aligned-same-view measurement is valid only when
a separately persisted reference artifact has the same registered view, crop,
dimensions, and component role.

## Current selected-scene interface gap

The selected-scene request carries the Visual Continuity Pack digest and the
exact generated output lineage. It does not currently carry:

- the validated pack payload or an immutable private pack-artifact binding;
- a canonical persisted reference-artifact record;
- snapshot, scene, component, reference-view, manifest-version, crop, and
  alignment registration for that reference;
- a canonical semantic style-continuity QA owner binding; or
- the approved `documentaryFactSafetyPlan` snapshot component.

The prompt materializer may use a process-private image alias. That alias is a
one-attempt input locator, not an artifact record, manifest entry, approved
reference, or QA result. A controlled reference-view expectation in the
Visual Continuity Pack is also not a persisted asset.

The follow-up
`living-frame-controlled-image-selected-scene-visual-continuity-pack-binding-v1`
now revalidates the complete pack payload from the semantic proposal binding
against the exact canonical selected scene and emits a subject-neutral,
digest-only read-only binding candidate. It does not mutate the canonical
selected-scene interface or persist an immutable pack artifact. The canonical
backend owner must adopt that candidate at its one-writer boundary before this
reconciliation can treat the interface gap as resolved.

## Correct continuity routing

For the current confirmed-ratio background plate:

```text
Visual Continuity Pack digest exists
→ semantic style-continuity QA is required

request unit is not reference-conditioned
→ persisted raster reference is not automatically required
→ aligned-same-view measurement is not applicable
```

For a future exact reference-conditioned unit:

```text
reference conditioning required
→ canonical persisted private reference artifact required
→ exact snapshot/scene/component/view/manifest lineage required
→ alignment registration required
→ aligned-same-view measurement may then become eligible
```

General style adherence must not be relabeled as the deterministic
`aligned_same_view_component` measurement. The existing measurement contract
does not prove style, identity, likeness, historical truth, or documentary
accuracy.

## Fact and provenance routing

The reconciliation classifies the source-truth requirement without claiming
that it is satisfied:

- exact geography, exact data, and documentary-source modes require a
  canonical documentary fact-safety snapshot or immutable claim/source
  binding;
- canonical illustrative and fictional/stylized modes require provenance
  guards and must not be presented as authentic archival evidence;
- controlled-source modes require canonical source revalidation; and
- unknown source truth remains blocked from promotion.

`documentaryFactSafetyPlan` remains the existing product owner. This
namespaced contract does not create a second fact system.

The separate
`living-frame-controlled-image-selected-scene-documentary-fact-safety-binding-v1`
now proves the process-private approved-snapshot and scene-claim binding
candidate and merges status-derived safety constraints into the existing
selected-scene prompt path. This reconciliation intentionally continues to
report the canonical selected-scene interface as unresolved until its owner
publishes that binding through the shared immutable snapshot boundary. A
passing namespaced candidate is not silently relabeled as canonical
integration.

## Preserved runtime and commercial boundaries

The reconciliation preserves:

- one `comfyui` /
  `tool.comfyui.generate_controlled_image.v1` GPU identity;
- the fixed supervised process entrypoint and confinement digest;
- top-level `sam2` import denial;
- the exact five-model, 11,700,367,157-byte atomic read-only mount;
- one request unit, one image, one future GPU attempt, and one GPU cost event;
- AuraFace outside that GPU attempt as optional CPU QA;
- semantic registry expansion for genuinely distinct released executables;
- no fake identities for weights, adapters, libraries, preprocessors, or
  in-process capabilities; and
- Remotion as the final-canvas owner.

Every operation, dispatch, persistence, QA, manifest, review, render, billing,
and production authority remains literal `false`.

## Adversarial coverage

The smoke rejects or preserves false for:

- a private prompt alias promoted into canonical artifact evidence;
- aligned measurement promoted without a registered aligned reference;
- documentary fact authority invented inside selected-scene components;
- a fabricated resolved reference;
- a ComfyUI final-canvas claim; and
- cross-output substitution.

The receipt is byte-free, path-free, URL-free, prompt-free, model-choice-free,
commercial-data-free, and subject-neutral.

## Files

- `src/types/living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation.ts`
- `server/living-frame/living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation.ts`
- `server/smoke/living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation-smoke.ts`
- `docs/living-frame/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding.md`
