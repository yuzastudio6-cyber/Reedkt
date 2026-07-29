# Living Frame selected-scene generated alpha work-chain reconciliation

Status: controlled, namespaced, read-only candidate. It does not register an
operation, dispatch work, persist an artifact, mutate an asset manifest, approve
QA, render, bill, or promote production readiness.

## Purpose

An isolated Living Frame component generated through the selected-scene ComfyUI
path is intentionally an opaque 1024x1024 source. It is not a final transparent
component. Before Remotion may use it, the approved branch must remain:

```text
exact selected generated output
→ canonical rembg mask work item
→ canonical Sharp straight-alpha RGBA work item
→ component and alpha QA
→ asset-manifest reconciliation
→ private review
→ Remotion final composition
```

Full-frame source/background plates use the exact confirmed output-frame
dimensions and must not enter this alpha branch.

The reconciliation contract proves whether one selected output already has this
exact canonical chain. It never creates the missing work itself.

## Current shared-interface conflict

The current selected-scene fixture has one controlled-illustration generation
work item with two exact outputs:

- one confirmed-ratio full-frame plate;
- one isolated 1024x1024 component.

The selected-scene prompt materializer correctly creates one private
materialization unit for each exact output intent. The canonical work graph also
already supports generated opaque source → rembg → Sharp when generation has
one output.

However, `compileRembgGpuMaskWorkItem` currently rejects a generated source
whenever the parent generation work item has more than one expected output,
even after it has found the exact output index, output key, and asset-intent ID.
The current selected-scene fixture also omits `generate_mask_asset` and
`process_image_asset` from its named work inputs.

The reconciliation therefore emits:

```text
blocked_by_missing_canonical_generated_alpha_work_chain
```

with:

```text
canonical_multi_output_generation_not_admitted_to_rembg
canonical_rembg_work_item_missing
canonical_rembg_mask_output_missing
canonical_sharp_work_item_missing
canonical_sharp_rgba_output_missing
```

This is a canonical-owner conflict, not permission to create a parallel mask
worker.

## Required canonical-owner resolution

At the canonical work-graph boundary:

1. Project `generate_mask_asset` and `process_image_asset` for every selected
   generated component whose approved transparency expectation requires still
   alpha.
2. Admit exactly one generated output from a multi-output generation item by
   matching all of:
   - scene;
   - generation work-item key;
   - generated asset-intent ID;
   - expected output key;
   - expected artifact type;
   - content type.
3. Reject duplicate matches and cross-output, cross-component,
   cross-work-item, and cross-scene substitution.
4. Preserve the existing rembg and Sharp operations, their distinct cost
   owners, their QA gates, and their dependency keys.
5. Keep the single ComfyUI supervised GPU attempt and cost event. Do not charge
   the five in-process controlled-generation capabilities independently.
6. Keep Remotion as final canvas owner.

Once that canonical projection is present, this reconciliation can resolve to:

```text
exact_canonical_generated_alpha_work_chain_reconciled
```

That state remains observational. It still does not dispatch rembg or Sharp.

## Registry policy

The observed tool count is not a product cap. Registry expansion is permitted
for genuinely distinct released executable identities with complete
runtime/security/cost/QA/fallback evidence. Model weights, adapters, libraries,
preprocessors, and capabilities inside one supervised ComfyUI attempt do not
become separate tool identities or charges.

## Fixed boundaries preserved

- fixed supervised ComfyUI process entrypoint;
- exact confinement digest lineage;
- top-level `sam2` import denial;
- exact five-model atomic read-only mount lifetime;
- one request unit / one image / one attempt semantics;
- server-derived seed, dimensions, graph family, and model roles;
- no prompt, bytes, paths, URLs, credentials, commands, or environment in the
  reconciliation receipt;
- no benchmark substitution;
- no final-canvas claim;
- no operation, dispatch, completion, cost, persistence, approval, render,
  billing, or production authority.

## Files

- `src/types/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation.ts`
- `server/living-frame/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation.ts`
- `server/smoke/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation-smoke.ts`
