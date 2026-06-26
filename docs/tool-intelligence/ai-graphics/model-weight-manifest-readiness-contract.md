# AI Graphics Model-Weight Manifest Readiness Contract

Decision: `ai_graphics_model_weight_manifest_readiness_contract_prepared_with_review_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This contract defines the private model/checkpoint manifest gate for the AI graphics tools that need model weights before runtime or beta execution.

It does not download model weights, load model weights, run inference, execute workers, execute Tool Routes, process media, mutate storage, create signed URLs, create public artifacts, or unlock beta/production.

## Covered Tools

The manifest-required AI graphics tools are:

- `sam2` -> `sam2_checkpoint`
- `birefnet` -> `birefnet_model`
- `real_esrgan` -> `real_esrgan_model`
- `rembg` -> `rembg_model`
- `transparent_background` -> `transparent_background_model`

GPU foundation tools without standalone model manifests remain covered by the GPU runtime gate:

- `torch_torchvision`
- `transformers`
- `kornia`

## Required Manifest Fields

Each approved private manifest must include:

- `manifestId`
- `toolId`
- `templateId`
- `privateArtifactRef`
- `checksumSha256`
- `sourceLicenseRef`
- `modelCardRef`
- `commercialUseReviewed`
- `redistributionReviewed`
- `qualityReviewed`
- `securityReviewed`
- `provenanceReviewed`
- `approvedForInternalBeta`

## Current Result

- AI graphics tools covered: 21.
- GPU runtime-targeted tools: 8.
- Manifest-required model tools: 5.
- Manifest template IDs covered: 5.
- Manifest records provided: 0.
- Manifest records approved: 0.
- Beta-ready model-weight tools: 0.

## Runtime Boundary

All five model-weight tools still require reviewed private manifests and native linux/amd64 NVIDIA L4 runtime proof before any model load or inference can be considered.

The generic model-weight readiness registry still reports 10 needs-review model/checkpoint templates across the broader production registry.

Tool Route, Worker, approved snapshot, credit reservation, private artifact, idempotency, artifact boundary, and owner beta gates remain blocked.

## No CPU Fallback For Heavy Tools

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background` remain GPU-runtime targeted. This contract does not introduce CPU fallback for heavy tools.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no package-lock mutation was performed, no model weights were downloaded or loaded, no model inference ran, no media was processed, no worker was queued, no tool/route/worker/provider executed, no browser/WebGL/canvas runtime ran, no GPU/model runtime ran, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no beta or production gate was unlocked.
