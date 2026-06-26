# Qwen2.5-VL 7B Python Runtime Alignment

## Status

Decision: `qwen2_5_vl_7b_python_runtime_alignment_ready_linux_l4_python312_no_inference`

This packet aligns the Qwen2.5-VL 7B dependency proof with the intended ReEditPro worker runtime after the controlled macOS arm64 Python 3.13 dependency preflight blocked on the pinned `numpy==1.26.4` wheel.

This packet does not install packages, build a wheelhouse, import model modules, import `torch`, import `transformers`, import `qwen_vl_utils`, initialize CUDA, start vLLM, start SGLang, start an API server, create a VM, mutate GCP, run Docker, call providers, dispatch workers, touch Supabase, run SQL, generate video, generate assets, create public artifacts, create signed URLs, mutate credits, or unlock beta/production.

## Baseline Evidence

- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private cache evidence: `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Loader gate evidence: `docs/qwen2-5-vl-7b-private-loader-import-gate.md`
- Runtime dependency plan: `docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md`
- Controlled dependency install result: `docs/qwen2-5-vl-7b-controlled-dependency-install-result.md`
- Existing VLM requirements: `server/workers/vlm-runtime/requirements.vlm.txt`
- Existing L4 tuning profile: `server/workers/vlm-runtime/l4_tuning_profiles.py`

The model weights remain checksum-verified in the private cache. The current blocker is runtime dependency alignment, not model-weight integrity.

## Runtime Alignment Decision

The next dependency proof should target:

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

Python 3.12 Linux x86_64 is the selected dependency-alignment target because it avoids the current macOS arm64 Python 3.13 wheel mismatch while matching the intended GPU worker direction. Python 3.11 remains a possible fallback only if the approved Linux worker image requires it, but it is not the selected first target.

The current macOS arm64 Python 3.13 environment must not be used to claim Qwen2.5-VL runtime readiness.

## GPU Selection

The cost-friendly first GPU target remains NVIDIA L4 on Google Cloud G2:

- L4 provides a 24 GB GPU memory envelope on single-GPU G2 shapes.
- G2 is the cost-optimized inference-oriented Google Cloud path already used by ReEditPro GPU worker planning.
- Qwen2.5-VL 7B should begin with bounded visual analysis prompts, one image per request, short context, and small image caps instead of jumping to A100/H100-class capacity.
- Higher-cost GPUs remain escalation-only if L4 cannot pass bounded import or later fixture evidence.

Initial runtime envelope:

- `max_model_len`: `2048`
- `max_num_seqs`: `1`
- `max_num_batched_tokens`: `1024`
- `limit_mm_per_prompt`: one image
- Image cap: `384px`
- Fallback image caps: `256px` or `224px`
- First profile: `conservative-eager-short-context`

CPU-only Qwen2.5-VL 7B execution remains blocked. CPU may be used for text diagnostics and resolver planning, but not for model loading, runtime proof, beta routing, or production routing.

## Package Alignment

The first Python 3.12 Linux wheelhouse or resolver proof must preserve the existing pinned VLM requirement set:

```text
vllm==0.11.0
transformers==4.57.1
qwen-vl-utils==0.0.11
Pillow==10.4.0
numpy==1.26.4
opencv-python-headless==4.11.0.86
google-cloud-storage==2.19.0
```

The future wheelhouse target should be private and outside the repository:

```text
/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64
```

The future proof must use binary wheels only, record a checksum manifest, and preserve offline/no-index install intent. It must not silently loosen pins, compile source packages, or install into the frontend, API, render, or general developer environment.

## Worker Boundary

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool:

1. Source-frame visual scene understanding when deterministic tools are insufficient.
2. Caption safe-zone, visual collision, and layout QA reasoning as advisory metadata.
3. Product/demo/tutorial step recognition as planning metadata.
4. OCR/OpenCV/Remotion QA fallback support.

Qwen2.5-VL is not an AI-video generation route. Wan remains the primary generated B-roll route. LTX remains fast preview/keyframe support. Mochi remains fallback/research. Hunyuan remains premium gated/blocked pending legal and GPU review.

## Required Guards

Every future dependency or import proof must preserve:

- `HF_HUB_OFFLINE=1`
- `TRANSFORMERS_OFFLINE=1`
- `MODEL_DOWNLOADS_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- Private local model cache as the only model source
- No model ID auto-download path
- No raw chat as a worker execution plan
- Approved snapshot references before future worker execution
- No public artifacts
- No signed URLs as source of truth
- No frontend imports of worker-heavy runtime modules

## Runtime Gates

- dependencyInstallRun=false
- wheelhouseCreated=false
- metadataLoaderImportRun=false
- runtimeImportRun=false
- modelInferenceRun=false
- cudaInitialized=false
- vllmStarted=false
- sglangStarted=false
- apiServerStarted=false
- vmCreated=false
- dockerRun=false
- generatedVideoCreated=false
- generatedAssetsCreated=false
- providerCallsMade=false
- workersDispatched=false
- supabaseTouched=false
- sqlExecuted=false
- gcpMutationCreated=false
- publicArtifactsCreated=false
- signedUrlsCreated=false
- creditMutationCreated=false
- betaUnlocked=false
- productionUnlocked=false
- dryRunPassedClaimed=false
- generatedLocalFixturePassedClaimed=false

## Acceptance Criteria For The Next Step

- Target runtime is Python 3.12 Linux x86_64 on the L4/G2 worker path.
- The dependency proof uses the committed VLM requirements without loosening pins.
- The future wheelhouse is private, checksum-manifested, and outside the repository.
- The proof remains no-inference and import-gate-oriented.
- The private cache remains the only model source.
- Qwen remains visual understanding/planning/QA only.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_7: prepare Qwen2.5-VL Python 3.12 Linux L4 wheelhouse, no inference`
