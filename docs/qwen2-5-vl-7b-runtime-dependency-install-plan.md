# Qwen2.5-VL 7B Runtime Dependency Install Plan

## Status

Decision: `qwen2_5_vl_7b_runtime_dependency_install_plan_ready_no_install_no_inference`

This packet defines the controlled dependency install path for `Qwen/Qwen2.5-VL-7B-Instruct` after the private cache and loader gate evidence. It does not install packages, import model modules, start CUDA, start vLLM or SGLang, run inference, generate assets, call providers, dispatch workers, mutate GCP, mutate Supabase, execute SQL, run Docker, create public artifacts, create signed URLs, create credits, or unlock beta/production.

The current blocker is dependency readiness, not model-weight readiness:

- Private cache verified: true
- Local checksums verified: true
- Loader import attempted: false
- Loader import ready: false
- Missing local metadata-loader dependencies: `transformers`, `torch`, `qwen_vl_utils`
- Missing future runtime dependencies: `vllm`, `sglang`

## Sources

- Private cache evidence: `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Loader gate evidence: `docs/qwen2-5-vl-7b-private-loader-import-gate.md`
- Loader gate script: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`
- Existing VLM requirements: `server/workers/vlm-runtime/requirements.vlm.txt`
- Existing SGLang requirements: `server/workers/vlm-sglang-runtime/requirements.sglang.txt`
- Pinned model card in private cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/README.md`

## Dependency Decision

Use the existing ReEditPro VLM requirements as the controlled install source for the first dependency proof:

```text
vllm==0.11.0
transformers==4.57.1
qwen-vl-utils==0.0.11
Pillow==10.4.0
numpy==1.26.4
opencv-python-headless==4.11.0.86
google-cloud-storage==2.19.0
```

The first install target should be worker-only, not frontend, not API, and not the general developer environment. The install should happen in a private worker virtual environment or future container layer dedicated to VLM runtime proof. It must not modify browser code or frontend package surfaces.

## Staged Install Path

### Stage 1: Metadata Loader Dependency Install

Install only the packages needed to pass a no-inference metadata loader gate:

- `transformers==4.57.1`
- `torch` compatible with the selected worker image and CUDA runtime
- `qwen-vl-utils==0.0.11`
- `Pillow==10.4.0`
- `numpy==1.26.4`

This stage may run `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py --allow-metadata-import` only after the dependency environment is isolated, offline guards are set, and the private cache path is the only model source.

### Stage 2: Runtime Import Readiness

After metadata import passes, install or verify the runtime package selected for the first L4 proof:

- Preferred first runtime proof: vLLM with `vllm==0.11.0`, because the existing `server/workers/vlm-runtime` structured-output path is already vLLM-oriented.
- Secondary runtime proof: SGLang with `sglang[all]==0.4.10.post2`, only if vLLM cannot run the Qwen2.5-VL worker path on L4 within the memory envelope.

Do not run inference in this install-plan stage. A future import-only proof may check package imports and CUDA visibility without model generation.

### Stage 3: L4 Import Smoke

Run a future no-inference import smoke on NVIDIA L4 / Google Cloud G2 only after dependency install is approved. The import smoke must use the private cache or mounted runtime path only.

## GPU And CPU Selection

The cost-friendly first GPU target remains NVIDIA L4 on Google Cloud G2:

- First GPU target: `nvidia_l4_google_cloud_g2_first`
- Recommended initial VM shape: `g2-standard-8`
- Minimum import-smoke VM shape: `g2-standard-4`
- Initial `max_model_len`: `2048`
- Initial `max_num_seqs`: `1`
- Image/frame input cap: `384px`
- Fallback caps under memory pressure: `256px` or `224px`

CPU-only execution remains blocked for Qwen2.5-VL 7B. CPU may be used for package resolution or text-only diagnostics, but not for Qwen2.5-VL model loading, runtime proof, or beta route execution. A100/H100-class GPUs should not be the first target because L4 is the cost-friendly proof point; higher-cost GPUs require evidence that L4 cannot meet the bounded ReEditPro planning/QA use case.

## Tool-Call Ranking

Qwen2.5-VL remains ranked as a visual understanding, planning, and QA stack tool:

1. Source-frame visual scene understanding when deterministic tools are insufficient.
2. Caption safe-zone, visual collision, and layout QA reasoning as advisory metadata.
3. Product/demo/tutorial step recognition as planning metadata.
4. OCR/OpenCV/Remotion QA fallback support.

Qwen2.5-VL is not an AI-video generation route. Wan remains the primary generated B-roll route, LTX remains fast preview/keyframe support, Mochi remains fallback/research, and Hunyuan remains premium gated/blocked pending legal and GPU review.

## Required Guards

Every future install/import command must preserve:

- `HF_HUB_OFFLINE=1`
- `TRANSFORMERS_OFFLINE=1`
- `MODEL_DOWNLOADS_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- Runtime model source is a local private path, not a model ID or public URL
- Raw chat is not a worker execution plan
- Approved snapshot references are required before any future worker execution
- No public artifact or signed URL source of truth

## Runtime Gates

- `dependencyInstallRun=false`
- `metadataLoaderImportRun=false`
- `runtimeImportRun=false`
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

## Acceptance Criteria For The Next Install Step

- Install target is isolated to worker/VLM runtime.
- Package set is pinned and reviewed against `server/workers/vlm-runtime/requirements.vlm.txt`.
- Torch/CUDA compatibility is selected for L4/G2, not a CPU-only model path.
- Auto-download remains blocked.
- Private cache remains the only model source.
- No inference command is included.
- No generated asset or provider path is included.
- The next step exits with import readiness evidence or a clear dependency blocker.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_5: controlled Qwen2.5-VL dependency install in private worker environment, no inference`
