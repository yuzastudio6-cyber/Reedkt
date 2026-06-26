# Qwen2.5-VL 7B Linux L4 Wheelhouse Prep Result

## Status

Decision: `qwen2_5_vl_7b_linux_l4_wheelhouse_prepared_no_install_no_inference`

This packet records the Python 3.12 Linux x86_64 wheelhouse preparation for `Qwen/Qwen2.5-VL-7B-Instruct` on the NVIDIA L4 / Google Cloud G2 worker path.

This packet does not install packages into a runtime environment, import model modules, import `torch`, import `transformers`, import `qwen_vl_utils`, initialize CUDA, start vLLM, start SGLang, start an API server, create a VM, mutate GCP, call providers, dispatch workers, touch Supabase, run SQL, generate video, generate assets, create public artifacts, create signed URLs, mutate credits, or unlock beta/production.

## Baseline Evidence

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private cache evidence: `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Loader gate evidence: `docs/qwen2-5-vl-7b-private-loader-import-gate.md`
- Runtime dependency plan: `docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md`
- Controlled dependency result: `docs/qwen2-5-vl-7b-controlled-dependency-install-result.md`
- Python runtime alignment: `docs/qwen2-5-vl-7b-python-runtime-alignment.md`
- VLM requirements: `server/workers/vlm-runtime/requirements.vlm.txt`

The model weights remain checksum-verified in the private cache. This packet only prepares runtime package wheels for a future isolated worker proof.

## Target Runtime

- OS/runtime family: Linux worker runtime
- CPU architecture: `x86_64`
- Python version: `3.12`
- Python ABI: `cp312`
- GPU target: NVIDIA L4 on Google Cloud G2
- First proof shape: `g2-standard-8`
- Minimum import-smoke shape: `g2-standard-4`
- Runtime package source: `server/workers/vlm-runtime/requirements.vlm.txt`
- Preferred runtime import proof: vLLM `0.11.0`
- Secondary runtime import proof: SGLang `0.4.10.post2`

The cost-friendly first GPU target remains NVIDIA L4 on Google Cloud G2. CPU-only Qwen2.5-VL 7B execution remains blocked.

## Dependency Pin Repair

The first Linux resolver pass found a conflict between the committed OpenCV pin and vLLM:

- Previous pin: `opencv-python-headless==4.10.0.84`
- Repaired pin: `opencv-python-headless==4.11.0.86`
- Reason: `vllm==0.11.0` requires `opencv-python-headless>=4.11.0`, while the Qwen VLM runtime still preserves `numpy==1.26.4`.

The repair is intentionally narrow. No model/runtime pins were loosened, and the wheelhouse keeps the existing `vllm==0.11.0`, `transformers==4.57.1`, `qwen-vl-utils==0.0.11`, `Pillow==10.4.0`, `numpy==1.26.4`, and `google-cloud-storage==2.19.0` pins.

## Wheelhouse Evidence

Private wheelhouse path:

```text
/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64
```

Checksum manifest:

```text
/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64/SHA256SUMS.json
```

Result:

- Binary wheels resolved: true
- Wheelhouse created: true
- Dependency download run: true
- Dependency install run: false
- Package source build run: false
- Wheel count: `158`
- Aggregate bytes: `4960843100`
- Aggregate SHA-256: `d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c`
- AppleDouble sidecar metadata present: false
- Resolver/download environment: Docker `linux/amd64`, Python `3.12`
- Worker runtime container started: false

Required resolved wheels include:

- `vllm-0.11.0`
- `transformers-4.57.1`
- `qwen_vl_utils-0.0.11`
- `pillow-10.4.0`
- `numpy-1.26.4`
- `opencv_python_headless-4.11.0.86`
- `google_cloud_storage-2.19.0`
- `torch-2.8.0`
- `torchaudio-2.8.0`
- `torchvision-0.23.0`
- `xformers-0.0.32.post1`
- `xgrammar-0.1.25`
- `triton-3.4.0`
- `nvidia_cublas_cu12-12.8.4.1`
- `nvidia_cuda_runtime_cu12-12.8.90`
- `nvidia_cudnn_cu12-9.10.2.21`
- `nvidia_nccl_cu12-2.27.3`
- `cupy_cuda12x-13.6.0`

## Offline Install Intent

The future runtime proof should install only from this private wheelhouse using no-index/offline package resolution. The future proof must preserve:

- `HF_HUB_OFFLINE=1`
- `TRANSFORMERS_OFFLINE=1`
- `MODEL_DOWNLOADS_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- Private model cache as the only model source
- No model ID auto-download path
- No raw chat as a worker execution plan
- Approved snapshot references before future worker execution
- No public artifacts
- No signed URLs as source of truth
- No frontend imports of worker-heavy runtime modules

## Tool Boundary

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool:

1. Source-frame visual scene understanding when deterministic tools are insufficient.
2. Caption safe-zone, visual collision, and layout QA reasoning as advisory metadata.
3. Product/demo/tutorial step recognition as planning metadata.
4. OCR/OpenCV/Remotion QA fallback support.

Qwen2.5-VL is not an AI-video generation route. Wan remains the primary generated B-roll route. LTX remains fast preview/keyframe support. Mochi remains fallback/research. Hunyuan remains premium gated/blocked pending legal and GPU review.

## Runtime Gates

- `dependencyDownloadRun=true`
- `wheelhouseCreated=true`
- `dependencyInstallRun=false`
- `packageSourceBuildRun=false`
- `metadataLoaderImportRun=false`
- `runtimeImportRun=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `cudaInitialized=false`
- `vllmStarted=false`
- `sglangStarted=false`
- `apiServerStarted=false`
- `vmCreated=false`
- `workerRuntimeContainerStarted=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `gcpMutationCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Remaining Blockers

- No offline/no-index install from the wheelhouse has run in an isolated Linux worker runtime.
- No metadata loader import has passed in Python 3.12 Linux.
- No `torch`, `transformers`, `qwen_vl_utils`, vLLM, or SGLang import proof has passed.
- No CUDA visibility or L4/G2 import proof has passed.
- No model load, model import, inference, generated fixture, user-media fixture, beta route, or production route is approved.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_8: install Qwen2.5-VL Linux L4 wheelhouse in isolated worker runtime and run metadata loader import proof, no inference`
