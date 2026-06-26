# Qwen2.5-VL 7B Wheelhouse Import Proof Result

## Status

Decision: `qwen2_5_vl_7b_wheelhouse_import_proof_ready_no_inference`

This packet records the isolated Python 3.12 Linux x86_64 runtime install and metadata loader proof for `Qwen/Qwen2.5-VL-7B-Instruct` using the private Linux L4 wheelhouse prepared for ReeditPro.

This result does not run model inference, load model weights for generation, initialize CUDA, start vLLM, start SGLang, start an API server, dispatch workers, call providers, touch Supabase, execute SQL, mutate GCP, generate video, generate assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Baseline Inputs

- Workstream: `AI_VIDEO_BROLL_GENERATION`
- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private model aggregate SHA-256: `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`
- Wheelhouse aggregate SHA-256: `d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c`
- Requirements source: `server/workers/vlm-runtime/requirements.vlm.txt`
- Loader gate: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`

The private model cache remains outside the repository. The wheelhouse remains outside the repository. The runtime environment created by this proof remains outside the repository.

## Runtime Environment

- Runtime OS family: Linux
- Runtime CPU architecture: `x86_64`
- Python version: `3.12`
- Python ABI: `cp312`
- First GPU target for future execution: NVIDIA L4 on Google Cloud G2
- Recommended initial VM shape: `g2-standard-8`
- Minimum no-inference import-smoke shape: `g2-standard-4`
- Runtime env path: `/private/tmp/reeditpro-qwen2-5-vl-runtime-envs/qwen2.5-vl-7b-python312-linux-x86_64-wheelhouse-import-proof-v2`
- Evidence report path: `/private/tmp/reeditpro-qwen2-5-vl-runtime-envs/qwen2.5-vl-7b-python312-linux-x86_64-wheelhouse-import-proof-v2/evidence/qwen2_5_vl_private_loader_gate_report_fixed.json`
- Isolated Docker container used for local install/import proof: true
- Worker runtime container started: false
- GCP VM created: false
- CUDA initialized: false

The first install attempt targeted the private backup volume and stopped with `No space left on device`. That failed partial runtime environment was deleted. The successful retry used `/private/tmp`, where sufficient space was available, while mounting the private model cache and private wheelhouse read-only.

## Offline Install Evidence

The successful proof installed from the private wheelhouse only:

- Package index/network install used: false
- `pip install --no-index --find-links` used: true
- Wheelhouse package source used: true
- Source builds run: false
- Runtime dependencies installed: true
- `torch` import present: true
- `transformers` import present: true
- `qwen_vl_utils` import present: true
- `vllm` import present: true
- `sglang` import present: false

Key installed pins include:

- `vllm==0.11.0`
- `transformers==4.57.1`
- `qwen-vl-utils==0.0.11`
- `torch==2.8.0`
- `torchvision==0.23.0`
- `torchaudio==2.8.0`
- `xformers==0.0.32.post1`
- `opencv-python-headless==4.11.0.86`
- `numpy==1.26.4`
- `google-cloud-storage==2.19.0`

`sglang` remains a future optional runtime path and is not required for the first vLLM import proof.

## Loader Gate Repair

The initial metadata loader run exposed a loader-gate import-order defect:

- Initial gate result: `metadata_import_blocked`
- Initial exception class: `TypeError`
- Initial exception message: `function() argument 'code' must be code, not str`
- Narrow traceback probe result: direct `AutoConfig.from_pretrained(..., local_files_only=True)` and `AutoProcessor.from_pretrained(..., local_files_only=True)` both passed.
- Root cause: the gate patched `socket.socket` before importing Transformers and Hugging Face modules, which can break import-time networking-library class setup even when no network call is made.

The loader gate was repaired so the heavyweight library imports happen before the network-blocking context. The network-blocking context still wraps the local `from_pretrained(..., local_files_only=True)` calls.

## Metadata Loader Proof

The fixed loader gate passed:

- `privateCacheVerified=true`
- `localChecksumVerified=true`
- `fileVerificationPassed=true`
- `sidecarFileCount=0`
- `loaderImportAttempted=true`
- `loaderImportReady=true`
- `metadataImport.status=passed_metadata_import_only`
- `metadataImport.configClass=Qwen2_5_VLConfig`
- `metadataImport.processorClass=Qwen2_5_VLProcessor`
- `metadataImport.localFilesOnly=true`
- `metadataImport.trustRemoteCode=true`
- `modelInferenceRun=false`
- `autoDownloadAllowed=false`

The loader emitted a Transformers warning that `Qwen2VLImageProcessor` is loaded as a fast processor by default. That is metadata-only evidence for the next runtime owner review and does not run inference.

The gate's historical `decision` string remains `qwen2_5_vl_7b_private_loader_gate_blocked_missing_runtime_dependencies_no_inference` for compatibility with the earlier dependency-missing checkpoint. The current outcome is determined by `status=ready_for_no_inference_metadata_import` and `loaderImportReady=true`.

## Runtime Gates

- `dependencyInstallRun=true`
- `metadataLoaderImportRun=true`
- `runtimeImportRun=true`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `cudaInitialized=false`
- `vllmStarted=false`
- `sglangStarted=false`
- `apiServerStarted=false`
- `gcpMutationCreated=false`
- `workerRuntimeContainerStarted=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Product Boundary

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool for ReeditPro:

1. Source-frame visual scene understanding when deterministic tools are insufficient.
2. Caption safe-zone, visual collision, and layout QA reasoning as advisory metadata.
3. Product/demo/tutorial step recognition as planning metadata.
4. OCR/OpenCV/Remotion QA fallback support.

Qwen2.5-VL is not an AI-video generation route. Wan remains the primary generated B-roll route. LTX remains fast preview/keyframe support. Mochi remains fallback/research. Hunyuan remains premium gated/blocked pending legal and GPU review.

## Remaining Blockers

- No CUDA visibility proof has run on NVIDIA L4.
- No vLLM runtime import proof has run on a real L4/G2 VM.
- No SGLang runtime import proof has run, and `sglang` remains absent from the installed vLLM-first env.
- No model inference, generated fixture, generated video, user-media fixture, worker dispatch, beta route, or production route is approved.
- No approved snapshot, credit approval, or worker runtime contract has been used for execution.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_9: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference`
