# AI Graphics Model-Weight Manifest Authoring Bridge

Decision: `ai_graphics_model_weight_manifest_authoring_from_checksum_evidence_prepared_with_local_only_private_drafts`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This packet adds the local-only bridge from reviewed private checksum evidence
to reviewed private model-weight manifest drafts for the five AI graphics
model-weight tools.

It is not a runtime lane. It does not download weights, load checkpoints, run
inference, start GPU runtime, queue Workers, execute Tool Routes, process media,
create signed URLs, create public artifacts, or unlock internal beta, external
beta, paid production, or production readiness.

## Tools Covered

| Tool | Template | Local draft path |
| --- | --- | --- |
| `sam2` | `sam2_checkpoint` | `sam2/model_tree_manifest.json` |
| `birefnet` | `birefnet_model` | `birefnet/model_tree_manifest.json` |
| `real_esrgan` | `real_esrgan_model` | `real-esrgan/model_tree_manifest.json` |
| `rembg` | `rembg_model` | `rembg/model_tree_manifest.json` |
| `transparent_background` | `transparent_background_model` | `transparent-background/model_tree_manifest.json` |

## Required Inputs

Manifest authoring requires two local/private inputs per tool:

- a checksum evidence record accepted by
  `ai-graphics:model-weight-checksum-evidence:validate`
- a manifest review supplement containing `sourceLicenseRef`, `modelCardRef`,
  commercial-use review, redistribution review, provenance review, quality
  review, security review, and internal-beta manifest-review approval

The supplement fields are:

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

`sourceLicenseRef` and `modelCardRef` must use reviewed private namespaces:
`private://`, `reeditpro-private://`, or
`reeditpro-private-artifact-ref-`. HTTP(S), public URLs, raw `gs://`, signed
URLs, and arbitrary placeholders are rejected.

## Local Command

If the supplement layout does not exist yet, create invalid-by-default
templates first:

```sh
npm run --silent ai-graphics:model-weight-manifest-supplement-scaffold -- \
  --out-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements
```

The command reads only local/private files and emits redacted status JSON:

```sh
npm run --silent ai-graphics:model-weight-manifest-supplement:validate -- \
  --supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements

npm run --silent ai-graphics:model-weight-manifest-authoring -- \
  --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence \
  --supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements \
  --out-dir .local-artifacts/ai-graphics/model-weight-manifests
```

It writes the five local `model_tree_manifest.json` drafts only when all five
checksum evidence records and all five supplements are valid. Existing local
drafts are not overwritten unless `--force` is supplied.

Validate the result with the existing manifest-review validator:

```sh
npm run --silent ai-graphics:model-weight-manifest-review:validate -- \
  --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
```

## Current Public Result

- AI graphics tools covered: 21.
- Model-weight manifest-authoring tools: 5.
- Private checksum evidence records committed: 0.
- Manifest review supplements committed: 0.
- Local private manifest drafts ready from committed docs: 0.
- Manifest-review validator input ready from committed docs: 0.
- Private artifact refs logged: 0.

## Runtime Boundary

Local manifest authoring is input preparation for native GPU proof only. GPU
runtime remains on-demand: it may start only inside an approved future Worker or
Tool Route job when a GPU tool is actually called, then release when the job
finishes. Idle GPU runtime is not approved, and CPU fallback for heavy/model
paths remains blocked.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no
package-lock mutation was performed, no model weights were downloaded or loaded,
no inference ran, no media was processed, no Tool Route or Worker executed, no
provider/model call ran, no browser/WebGL/canvas runtime ran, no Supabase/GCS
mutation occurred, no signed URL or public artifact was created, and no runtime,
beta, or production gate was unlocked.
