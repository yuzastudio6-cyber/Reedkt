# Living Frame selected-scene Visual Continuity Pack binding

Status: controlled, namespaced, read-only binding candidate. It validates and
binds the complete Visual Continuity Pack payload to the exact canonical
selected scene without mutating the selected-scene schema, persisting an
artifact, executing QA, changing prompt materialization, registering an
operation, dispatching work, billing, or promoting production readiness.

## Purpose

The canonical selected-scene binding carries the Visual Continuity Pack
digest, while the earlier semantic proposal binding carries the complete,
validated pack payload. A digest alone is insufficient for downstream
semantic style-continuity planning. Copying the raw pack into later request or
worker receipts would expose subject-specific summaries and would invite
parallel ownership.

This candidate closes the controlled read-only gap:

```text
validated semantic proposal binding with complete pack
+ canonical semantic plan projection
+ selected-scene admission
+ canonical selected-scene binding
+ current canonical plan components
→ exact selected scene / semantic decision / scene design sheet mapping
→ digest-only, subject-neutral pack binding receipt
```

The receipt proves that the complete pack payload was available and fully
revalidated during compilation. It does not embed that payload or claim that
the canonical selected-scene interface has already been changed.

## Full source revalidation

The compiler revalidates:

- the semantic proposal binding and complete Visual Continuity Pack;
- the semantic plan projection;
- the selected-scene admission;
- the canonical selected-scene binding against the current canonical plan
  components;
- workspace, project, edit session, handoff, deferred parent, planning
  evidence, compiled intent, source sequence, output-frame, and MasterTiming
  lineage;
- semantic request, semantic result, projection, admission, selector decision,
  selected-scene, and pack digests;
- each selected scene ID against exactly one semantic scene proposal;
- each scene proposal against exactly one semantic decision;
- each selected scene against exactly one matching scene design sheet by
  semantic decision, Living Frame mode, and source-truth mode; and
- every required style, character, object, environment, scene-design, motion,
  sound, alpha, and continuity-ledger expectation.

Cross-project, cross-handoff, cross-pack, cross-scene, and cross-decision
substitution fail closed.

## Digest-only scene binding

For each selected scene, the receipt contains:

- opaque scene, semantic-decision, and scene-design-sheet lineage digests;
- the Living Frame mode and source-truth mode;
- required and resolved continuity expectation kinds;
- digests for the referenced style bible, character sheets, object sheets,
  environment sheets, motion language, sound language, alpha rules, and
  continuity ledger; and
- the count of controlled reference-view expectations.

It deliberately excludes:

- style or subject summaries;
- display labels;
- reference-view IDs;
- continuity-ledger asset expectation IDs;
- raw pack JSON;
- prompts, model choices, seeds, paths, URLs, bytes, credentials, commands,
  or environment values; and
- prices, credits, service fees, reservations, wallets, or ledger data.

## Reference and fact boundaries

A Visual Continuity Pack reference view remains:

```text
controlled_unverified_reference_expectation
```

It is not a persisted reference artifact, asset-manifest entry, aligned-view
registration, QA-approved image, or deterministic continuity measurement.
Downstream reference-conditioned generation still requires the canonical
private artifact owner to bind the exact snapshot, scene, component, view,
manifest version, crop, dimensions, and registration.

Exact geography, data, or documentary source-truth modes are marked as
requiring a canonical documentary fact-safety binding. The candidate does not
execute or approve documentary QA. Illustrative output must not be presented
as authentic archival evidence.

## Remaining canonical-owner bridge

This candidate makes the validated payload available for a controlled
read-only downstream binding, but it intentionally leaves these gates open:

- canonical selected-scene schema integration or an immutable private pack
  artifact binding;
- canonical semantic style-continuity QA ownership;
- canonical reference-artifact binding when downstream reference conditioning
  is actually enabled;
- documentary fact-safety binding when the source-truth mode requires it;
- approved prompt-materialization source binding;
- private artifact persistence and QA;
- Living Frame scene evidence packaging;
- asset-manifest reconciliation;
- private review; and
- Remotion final composition.

The canonical backend owner can adopt this candidate at its clean one-writer
boundary without creating a second selected-scene, QA, fact, asset, or render
owner.

## Runtime and registry invariants

The candidate preserves:

- one `comfyui` /
  `tool.comfyui.generate_controlled_image.v1` supervised GPU identity;
- the fixed supervised process entrypoint and confinement digest;
- top-level `sam2` import denial;
- the exact five-model, 11,700,367,157-byte atomic read-only mount;
- one request unit, one image, one future GPU attempt, and one GPU cost event;
- AuraFace outside that GPU attempt as optional CPU QA;
- semantic registry expansion for genuinely distinct released executables;
- no fake identities for weights, adapters, libraries, preprocessors, or
  in-process capabilities; and
- Remotion as the final-canvas owner.

Every operation, dispatch, runtime, persistence, QA, manifest, review, render,
billing, and production authority remains literal `false`.

## Adversarial coverage

The smoke rejects:

- caller-added raw prompt data;
- a forged pack digest;
- a valid pack substituted from another canonical scope;
- controlled reference expectations promoted into artifact evidence;
- invented documentary fact approval;
- a claimed canonical selected-scene schema mutation;
- embedded raw pack payload;
- relaxed `sam2`, confinement, or model-mount policy; and
- ComfyUI final-canvas or production claims.

## Files

- `src/types/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding.ts`
- `server/living-frame/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding.ts`
- `server/smoke/fixtures/living-frame-selected-scene-visual-continuity-pack-binding-fixture.ts`
- `server/smoke/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding-smoke.ts`
