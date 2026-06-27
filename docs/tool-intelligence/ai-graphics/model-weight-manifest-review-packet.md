# AI Graphics Model-Weight Manifest Review Packet

Decision: `ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This packet defines the server-side review input shape for the five AI graphics tools that need private model or checkpoint manifests before native GPU proof can start.

It does not expose private artifact refs, download model weights, load checkpoints, run inference, process media, queue workers, execute Tool Routes, create signed URLs, create public artifacts, or unlock runtime, beta, or production.

## Manifest-Required Tools

| Tool | Template ID | Current review result |
| --- | --- | --- |
| `sam2` | `sam2_checkpoint` | missing private manifest record |
| `birefnet` | `birefnet_model` | missing private manifest record |
| `real_esrgan` | `real_esrgan_model` | missing private manifest record |
| `rembg` | `rembg_model` | missing private manifest record |
| `transparent_background` | `transparent_background_model` | missing private manifest record |

## Required Fields

Every private manifest evidence record must include:

- `manifestId`
- `toolId`
- `templateId`
- `sourceCandidateId`
- `privateArtifactRef`
- `checksumSha256`
- `checksumEvidenceRef`
- `sourceLicenseRef`
- `modelCardRef`
- `checksumEvidenceReviewed`
- `commercialUseReviewed`
- `redistributionReviewed`
- `qualityReviewed`
- `securityReviewed`
- `provenanceReviewed`
- `approvedForInternalBeta`

The review validator requires a 64-character SHA-256 digest, a private checksum evidence ref, exact `toolId`, `templateId`, and `sourceCandidateId`, non-empty license/provenance refs, and all review booleans set to true. `sourceCandidateId` must match the selected ReeditPro source-catalog candidate for the tool before native GPU proof input can be eligible. When the source catalog includes reviewed checksum guidance, `checksumSha256` must match that value before native GPU proof input can be eligible. `privateArtifactRef` and `checksumEvidenceRef` must use reviewed private namespaces: `private://`, `reeditpro-private://`, or `reeditpro-private-artifact-ref-`. It rejects HTTP(S), public, signed URL, raw `gs://`, or arbitrary placeholder refs. Diagnostics report only `present_private_ref_not_logged` when a private ref exists.

The checksum evidence ref should be produced by the local/private checksum
evidence validator before manifest review:

```sh
npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
```

That validator accepts owner-reviewed private SHA evidence for `sam2`,
`birefnet`, `real_esrgan`, `rembg`, and `transparent_background`, emits only
redacted private-ref statuses, and does not approve runtime or beta execution.

## Source-Catalog Checksum Guidance

| Tool | Checksum guidance |
| --- | --- |
| `sam2` | must match the reviewed source-catalog aggregate SHA-256 |
| `birefnet` | must match the reviewed source-catalog aggregate SHA-256 |
| `real_esrgan` | must match the reviewed source-catalog release asset SHA-256 |
| `rembg` | private artifact SHA-256 still required before manifest review |
| `transparent_background` | private artifact SHA-256 still required before manifest review |

## Current Result

- AI graphics tools covered: 21.
- GPU runtime-targeted tools: 8.
- Manifest-required model tools: 5.
- Manifest records provided: 0.
- Schema-valid manifest records: 0.
- Review-accepted manifest records: 0.
- Native GPU proof input eligible records: 0.
- Private artifact refs logged: 0.
- Beta-ready model-weight tools: 0.

## Local Private Manifest Validation Command

Use this command only with local/private manifest files. Do not commit the files
or paste private refs into public docs:

```sh
npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
```

If the local runtime mount layout does not exist yet, create invalid-by-default
templates first:

```sh
npm run --silent ai-graphics:model-weight-manifest-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-manifests
```

The command reads local JSON manifests and emits a redacted review packet. It
reports only `privateArtifactRefStatus`, never the raw `privateArtifactRef`.
It exits non-zero when supplied manifests are incomplete, duplicated, mismatched,
or not fully owner-reviewed.

## Runtime Boundary

Reviewed private manifests are only inputs to later native GPU proof. They do not approve model downloads, model loads, inference, Tool Routes, Workers, public artifacts, signed URLs, internal beta, external beta, or production.

`torch_torchvision`, `transformers`, and `kornia` remain GPU foundation tools without standalone model manifests. They still require native GPU runtime proof before execution.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no package-lock mutation was performed, no model weights were downloaded or loaded, no inference ran, no media was processed, no Tool Route or Worker executed, no provider/model call ran, no browser/WebGL/canvas runtime ran, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no runtime, beta, or production gate was unlocked.
