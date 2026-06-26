# Qwen2.5-VL 7B Private Loader Import Gate

## Status

Decision: `qwen2_5_vl_7b_private_loader_gate_blocked_missing_runtime_dependencies_no_inference`

This packet verifies the controlled private cache for `Qwen/Qwen2.5-VL-7B-Instruct` can be checked by a local loader gate without auto-download, provider calls, worker dispatch, CUDA startup, model inference, generated assets, public artifacts, signed URLs, Supabase mutation, SQL, GCP mutation, Docker, credits, beta, or production unlock.

The current local machine has the private cache, but it does not have the required runtime dependencies for a metadata loader import. Therefore this gate is intentionally blocked before import. This is a useful and honest beta-readiness step: the model weights are present and checksum-safe, but the runtime dependency layer is not installed yet.

## Source And Cache

- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Source revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- License tag: `license:apache-2.0`
- Pipeline tag: `image-text-to-text`
- Private cache path: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Runtime mount target: `/opt/reeditpro/model-weights/vlm/qwen2.5-vl-7b-instruct/`
- Cache inside repo: false
- File count: `16`
- Weight shard count: `5`
- Total size bytes: `16595981281`
- Checksum algorithm: `sha256`
- Checksum manifest aggregate SHA-256: `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`
- Private cache verified by this gate: true
- Local checksum verified by this gate: true

## Loader Gate Result

- Gate script: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`
- Diagnostics script: `scripts/validation/qwen2-5-vl-7b-private-loader-import-gate-diagnostics.mjs`
- Loader import attempted: false
- Loader import ready: false
- Model inference run: false
- CUDA initialized: false
- vLLM started: false
- SGLang started: false
- API server started: false
- Auto-download allowed: false

The loader import is blocked because the current local Python environment is missing:

- `transformers`
- `torch`
- `qwen_vl_utils`

The future runtime layer is also missing:

- `vllm`
- `sglang`

## Required Offline Guards

The diagnostics run the loader gate with these fail-closed settings:

- `HF_HUB_OFFLINE=1`
- `TRANSFORMERS_OFFLINE=1`
- `MODEL_DOWNLOADS_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`

Any mismatch blocks the gate. The gate does not use a model ID as the runtime source of truth and does not allow model hub auto-download. The only valid source is the already verified private cache path.

## GPU And Runtime Envelope

The cost-friendly first target remains NVIDIA L4 on Google Cloud G2:

- First GPU target: `nvidia_l4_google_cloud_g2_first`
- Recommended initial VM shape: `g2-standard-8`
- Minimum import-smoke VM shape: `g2-standard-4`
- Initial `max_model_len`: `2048`
- Initial `max_num_seqs`: `1`
- Image/frame input cap: `384px`, with `256px` or `224px` fallback if memory pressure appears

CPU-only execution remains blocked for Qwen2.5-VL 7B. A100/H100-class instances are not the first choice because L4 should be proven or disproven before moving to higher-cost GPU classes.

## ReEditPro Tool Role

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool. It is ranked for:

1. Visual scene understanding and source-frame description when deterministic tools are insufficient.
2. Caption/safe-zone and visual QA reasoning as advisory metadata.
3. Product/demo/tutorial visual step recognition as planning metadata.
4. Fallback support for OCR/OpenCV/Remotion QA, not replacement of exact tools.

Qwen2.5-VL is not an AI-video generation route. Wan remains the primary generated B-roll route, LTX remains the fast preview/keyframe route, Mochi remains fallback/research, and Hunyuan remains premium gated/blocked pending legal and GPU review.

## Runtime Gates

- `privateCacheVerified=true`
- `localChecksumVerified=true`
- `autoDownloadAllowed=false`
- `loaderImportAttempted=false`
- `loaderImportReady=false`
- `modelInferenceRun=false`
- `cudaInitialized=false`
- `vllmStarted=false`
- `sglangStarted=false`
- `apiServerStarted=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `gcpMutationCreated=false`
- `dockerRun=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Remaining Blockers

- Install plan and owner acceptance are still needed for `transformers`, `torch`, and `qwen_vl_utils`.
- A controlled worker/runtime install plan is still needed for `vllm` or `sglang`.
- No model loader metadata import has passed.
- No inference, generated fixture, user-media fixture, beta route, or production route is approved.
- Worker execution still needs approved snapshot, runtime owner, QA, billing, and GCP/GPU gate evidence.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_4: controlled Qwen2.5-VL runtime dependency install plan, no inference`
