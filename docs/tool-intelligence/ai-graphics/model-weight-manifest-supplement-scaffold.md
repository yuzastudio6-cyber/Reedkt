# AI Graphics Model-Weight Manifest Supplement Scaffold

Decision: `ai_graphics_model_weight_manifest_supplement_scaffold_prepared_for_local_private_records`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This packet adds a local-only scaffold for the manifest review supplement
records needed by the model-weight manifest authoring bridge.

It does not approve private manifests, download model weights, load models, run
inference, start GPU runtime, run Tool Routes, run Workers, call providers,
process media, create signed URLs, create public artifacts, or unlock runtime,
internal beta, external beta, or production.

## Scope

- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

The scaffold writes invalid-by-default supplement templates:

- `sam2/manifest-review-supplement.json`
- `birefnet/manifest-review-supplement.json`
- `real-esrgan/manifest-review-supplement.json`
- `rembg/manifest-review-supplement.json`
- `transparent-background/manifest-review-supplement.json`

It also writes local-only support files:

- `manifest-supplement-authoring-checklist.json`
- `MANIFEST_SUPPLEMENT_AUTHORING_CHECKLIST.md`

## Required Supplement Fields

Each local/private supplement must include:

- `supplementId`
- `toolId`
- `sourceCandidateId`
- `sourceLicenseRef`
- `modelCardRef`
- `commercialUseReviewed`
- `redistributionReviewed`
- `provenanceReviewed`
- `qualityReviewed`
- `securityReviewed`
- `approvedForInternalBeta`

The scaffold uses rejected `public://replace-with-reviewed-...` placeholders
for `sourceLicenseRef` and `modelCardRef`, and all review booleans are `false`.
This keeps the templates invalid until an owner-reviewed private record replaces
them.

## Command

Use a local-only path, preferably under `.local-artifacts`, and do not commit
the generated files:

```bash
npm run --silent ai-graphics:model-weight-manifest-supplement-scaffold -- \
  --out-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements
```

Use `--force` only when intentionally replacing local scaffold files:

```bash
npm run --silent ai-graphics:model-weight-manifest-supplement-scaffold -- \
  --out-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements \
  --force
```

## Validation Flow

After filling the local private supplement records and checksum evidence,
generate private manifest drafts:

```bash
npm run --silent ai-graphics:model-weight-manifest-authoring -- \
  --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence \
  --supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements \
  --out-dir .local-artifacts/ai-graphics/model-weight-manifests
```

Then validate the generated manifests:

```bash
npm run --silent ai-graphics:model-weight-manifest-review:validate -- \
  --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
```

Only after manifest validation passes should native GPU proof command planning
be considered.

## Current Result

- AI graphics tools covered: 21.
- Manifest supplement scaffold tools: 5.
- Supplement templates prepared: 5.
- Committed manifest supplements approved: 0.
- Local private manifest drafts ready from committed docs: 0.
- Private evidence refs logged: 0.
- Runtime-ready tools: 0.

## Runtime Boundary

The supplement scaffold prepares review input only. GPU runtime remains
on-demand only for a future approved Worker or Tool Route job, and no idle GPU
runtime is approved.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no model
weights were downloaded or loaded, no inference ran, no media was processed, no
Docker/GPU runtime ran, no Tool Route or Worker executed, no provider/model call
ran, no Supabase/GCS mutation occurred, no signed URL or public artifact was
created, and no runtime/beta/production gate was unlocked.
