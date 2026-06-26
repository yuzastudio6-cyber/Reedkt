# AI Video B-roll Model Weight Evidence Alignment

## Status

Decision: `ai_video_broll_model_weight_evidence_alignment_wan_manifest_linked_runtime_blocked`

This packet aligns the production model-weight readiness template for Wan/Wan2.1 with the controlled cache evidence already recorded in `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`. It does not approve runtime mounting, production use, imports, inference, generated video, beta, or production.

## Wan Evidence Linked

- Model: `Wan-AI/Wan2.1-T2V-1.3B`
- Source revision: `37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Evidence doc: `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- Evidence status: controlled private cache outside the repo with file-level checksum records.
- Template status: still `needs_review`, still not commercial-use approved, still production-blocking.

## Deferred Models

- LTX-Video remains `needs_review` until exact version/source/checksum evidence is added.
- Mochi 1 remains fallback/research and `needs_review`.
- HunyuanVideo remains blocked pending legal, territory, commercial, GPU, billing, and owner review.

## Runtime Gates

- modelWeightsDownloadedNow: false
- dependencyInstalledNow: false
- modelImportsRun: false
- modelInferenceRun: false
- generatedVideoCreated: false
- generatedAssetsCreated: false
- providerCallsMade: false
- workersDispatched: false
- supabaseTouched: false
- sqlExecuted: false
- gcpMutationCreated: false
- dockerRun: false
- betaUnlocked: false
- productionUnlocked: false

## Next Prompt

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-3: plan approved Wan model mount path and runtime source install review, no inference`
