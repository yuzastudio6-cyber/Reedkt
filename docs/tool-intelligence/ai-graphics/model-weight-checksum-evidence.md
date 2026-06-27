# AI Graphics Model-Weight Checksum Evidence

Decision: `ai_graphics_model_weight_checksum_evidence_prepared_with_no_private_records`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This packet defines the private checksum-evidence input that must exist before
the five model-weight tools can author reviewed private manifests for native GPU
proof.

It is a preparation and validation contract only. It does not download model
weights, load checkpoints, run inference, start GPU runtime, queue Workers,
execute Tool Routes, process media, create signed URLs, create public artifacts,
or unlock internal beta, external beta, paid production, or production
readiness.

## Tools Covered

| Tool | Source candidate | Current checksum result |
| --- | --- | --- |
| `sam2` | `facebook_sam2_1_hiera_tiny_existing_staging_evidence` | missing private checksum evidence record |
| `birefnet` | `zhengpeng7_birefnet_official_weights_review_candidate` | missing private checksum evidence record |
| `real_esrgan` | `xinntao_real_esrgan_x4plus` | missing private checksum evidence record |
| `rembg` | `danielgatis_rembg_isnet_general_use_review_candidate` | missing private checksum evidence record |
| `transparent_background` | `plemeri_transparent_background_base_ckpt_review_candidate` | missing private checksum evidence record |

## Required Fields

Every local/private checksum evidence record must include:

- `evidenceId`
- `toolId`
- `sourceCandidateId`
- `artifactFileName`
- `artifactSha256`
- `checksumEvidenceRef`
- `sourceArtifactRef`
- `hashCommand`
- `checksumEvidenceReviewed`
- `sourceArtifactReviewed`
- `provenanceReviewed`
- `qualityReviewed`
- `securityReviewed`
- `approvedForManifestAuthoring`

`sourceArtifactRef` may be supplied as `privateArtifactRef` by older local
packets, but the validator emits only redacted status fields. Raw private refs
are never printed in public evidence. `checksumEvidenceRef` and
`sourceArtifactRef` must use reviewed private namespaces such as
`private://`, `reeditpro-private://`, or `reeditpro-private-artifact-ref-`.
HTTP(S), signed URLs, public URLs, raw `gs://`, and arbitrary placeholders are
rejected.

## Checksum Rules

| Tool | SHA-256 rule |
| --- | --- |
| `sam2` | must match the reviewed source-catalog aggregate SHA-256 |
| `birefnet` | must match the reviewed source-catalog aggregate SHA-256 |
| `real_esrgan` | must match the reviewed source-catalog release asset SHA-256 |
| `rembg` | owner-reviewed private artifact SHA-256 is still required |
| `transparent_background` | owner-reviewed private artifact SHA-256 is still required |

## Local Validation Command

If the local checksum evidence layout does not exist yet, create invalid-by-default
templates first:

```sh
npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
```

Use this command only with local/private checksum evidence files. Do not commit
the files or paste private refs into public docs:

```sh
npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
```

The command accepts `--evidence`, `--evidence-file`, and `--evidence-dir`.
It reads local JSON records or envelopes with `records` or `checksumEvidence`
arrays. If any local evidence is supplied, all five required tools must pass
before the command exits successfully.

After checksum evidence passes, use the manifest-authoring bridge with
reviewed local/private source-license and model-card supplements:

```sh
npm run --silent ai-graphics:model-weight-manifest-authoring -- \
  --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence \
  --supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements \
  --out-dir .local-artifacts/ai-graphics/model-weight-manifests
```

The authoring bridge writes private manifest drafts only to the local output
directory and then those files must still pass
`ai-graphics:model-weight-manifest-review:validate`.

## Current Result

- AI graphics tools covered: 21.
- GPU runtime-targeted tools: 8.
- Model-weight checksum evidence tools: 5.
- Checksum evidence records provided in committed docs: 0.
- Accepted checksum evidence records: 0.
- Manifest-authoring eligible records: 0.
- Private artifact refs logged: 0.
- Beta-ready model-weight tools: 0.

## Runtime Boundary

Checksum evidence is only an input to later local/private manifest authoring.
Reviewed private manifests and native NVIDIA L4 proof are still required before
model download, model load, inference, or any GPU runtime can be approved.

GPU runtime remains on-demand only: it may start only inside an approved future
worker or tool-call job and should not idle when no approved job is using it.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no
package-lock mutation was performed, no model weights were downloaded or loaded,
no inference ran, no media was processed, no Tool Route or Worker executed, no
provider/model call ran, no browser/WebGL/canvas runtime ran, no Supabase/GCS
mutation occurred, no signed URL or public artifact was created, and no runtime,
beta, or production gate was unlocked.
