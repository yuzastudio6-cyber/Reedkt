# AI Video B-roll Generation Weight Source Manifest Plan

Status: `ai_video_broll_gen_2_weight_source_manifest_plan_no_execution`

This document defines the future manifest shape for model weight source planning. It is metadata only; no weights are downloaded, no checksums are computed, and no runtime is created.

## Manifest Shape

Each future model weight manifest row must include:

- `modelFamily`
- `modelRole`
- `modelIdentifier`
- `sourceUrl`
- `sourceOwner`
- `licenseUrl`
- `modelCardUrl`
- `plannedChecksumAlgorithm`
- `plannedPrivateCacheScope`
- `plannedRuntimeTier`
- `downloadApproved`
- `downloadCompleted`
- `checksumVerified`
- `dependenciesInstalled`
- `inferenceRun`
- `generatedVideoCreated`
- `betaApproved`
- `productionApproved`

## Planned Rows

| modelFamily | modelRole | modelIdentifier | sourceUrl | plannedChecksumAlgorithm | plannedRuntimeTier | downloadApproved |
| --- | --- | --- | --- | --- | --- | --- |
| Wan / Wan2.1 | primary-small | `Wan-AI/Wan2.1-T2V-1.3B` | https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B | sha256 | small-preview-gpu-review-required | false |
| Wan / Wan2.1 | primary-high-quality | `Wan-AI/Wan2.1-T2V-14B` | https://huggingface.co/Wan-AI/Wan2.1-T2V-14B | sha256 | high-vram-gpu-review-required | false |
| LTX / LTX-Video | secondary-fast-preview | `Lightricks/LTX-Video` | https://huggingface.co/Lightricks/LTX-Video | sha256 | small-preview-gpu-review-required | false |
| LTX / LTX-2 | secondary-version-split | `Lightricks/LTX-2` | https://huggingface.co/Lightricks/LTX-2 | sha256 | version-split-gpu-review-required | false |
| LTX / LTX-2.3 | secondary-version-split | `Lightricks/LTX-2.3` | https://huggingface.co/Lightricks/LTX-2.3 | sha256 | version-split-gpu-review-required | false |
| Mochi 1 | fallback-research | `genmo/mochi-1-preview` | https://huggingface.co/genmo/mochi-1-preview | sha256 | high-vram-research-review-required | false |
| HunyuanVideo | optional-premium-gated | blocked | blocked | sha256 | blocked-pending-legal-territory-review | false |

## Runtime Flags

All planned rows must keep:

- `downloadApproved: false`
- `downloadCompleted: false`
- `checksumVerified: false`
- `dependenciesInstalled: false`
- `inferenceRun: false`
- `generatedVideoCreated: false`
- `betaApproved: false`
- `productionApproved: false`

Gate 2 may only create this manifest plan as text. A future gate may create machine-readable manifests only after owner acceptance.
