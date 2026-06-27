# AI Graphics Model-Weight Manifest Supplement

Decision: `ai_graphics_model_weight_manifest_supplement_prepared_with_no_private_records`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This packet defines the local/private source-license and model-card supplement
records that must be reviewed before the five model-weight tools can author
private manifests for native GPU proof.

It is a validation contract only. It does not download model weights, load
checkpoints, run inference, start GPU runtime, queue Workers, execute Tool
Routes, process media, create signed URLs, create public artifacts, or unlock
internal beta, external beta, paid production, or production readiness.

## Tools Covered

| Tool | Source candidate | Current supplement result |
| --- | --- | --- |
| `sam2` | `facebook_sam2_1_hiera_tiny_existing_staging_evidence` | missing private manifest supplement record |
| `birefnet` | `zhengpeng7_birefnet_official_weights_review_candidate` | missing private manifest supplement record |
| `real_esrgan` | `xinntao_real_esrgan_x4plus` | missing private manifest supplement record |
| `rembg` | `danielgatis_rembg_isnet_general_use_review_candidate` | missing private manifest supplement record |
| `transparent_background` | `plemeri_transparent_background_base_ckpt_review_candidate` | missing private manifest supplement record |

## Required Fields

Every local/private manifest supplement record must include:

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

`sourceLicenseRef` and `modelCardRef` must use reviewed private namespaces
such as `private://`, `reeditpro-private://`, or
`reeditpro-private-artifact-ref-`. HTTP(S), signed URLs, public URLs, raw
`gs://`, and arbitrary placeholders are rejected.

## Local Validation Command

If the local supplement layout does not exist yet, create invalid-by-default
templates first:

```sh
npm run --silent ai-graphics:model-weight-manifest-supplement-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements
```

Use this command only with local/private supplement files. Do not commit the
files or paste private refs into public docs:

```sh
npm run --silent ai-graphics:model-weight-manifest-supplement:validate -- --supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements
```

The command accepts `--supplement`, `--supplement-file`, and
`--supplement-dir`. It reads local JSON records or envelopes with `records`,
`manifestSupplements`, or `supplements` arrays. If any local supplement is
supplied, all five required tools must pass before the command exits
successfully.

After supplement records and checksum evidence both pass, use the
manifest-authoring bridge:

```sh
npm run --silent ai-graphics:model-weight-manifest-authoring -- \
  --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence \
  --supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements \
  --out-dir .local-artifacts/ai-graphics/model-weight-manifests
```

The authoring bridge writes private manifest drafts only to the local output
directory. Those files must still pass
`ai-graphics:model-weight-manifest-review:validate` before native GPU proof
input can be considered.

## Current Result

- AI graphics tools covered: 21.
- GPU runtime-targeted tools: 8.
- Model-weight manifest supplement tools: 5.
- Manifest supplement records provided in committed docs: 0.
- Accepted supplement records: 0.
- Manifest-authoring eligible supplement records: 0.
- Private artifact refs logged: 0.
- Beta-ready model-weight tools: 0.

## Runtime Boundary

Manifest supplements are only source-license and model-card review inputs for
later local/private manifest authoring. Reviewed private checksum evidence,
reviewed private manifests, and native NVIDIA L4 proof are still required
before model download, model load, inference, or any GPU runtime can be
approved.

GPU runtime remains on-demand only: it may start only inside an approved future
worker or tool-call job and should not idle when no approved job is using it.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no
package-lock mutation was performed, no model weights were downloaded or loaded,
no inference ran, no media was processed, no Tool Route or Worker executed, no
provider/model call ran, no browser/WebGL/canvas runtime ran, no Supabase/GCS
mutation occurred, no signed URL or public artifact was created, and no runtime,
beta, or production gate was unlocked.
