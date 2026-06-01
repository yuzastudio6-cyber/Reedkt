# Phase 39C Generated Qwen3-VL/vLLM Runtime Verification

Status: `blocked_l4_vllm_cuda_oom_after_tuning`

Latest guarded run: `phase39c-20260531T214216`

Latest private artifact prefix: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T214216/`

Latest uploaded JSON artifacts verified: `13`

Phase 39C is the Track B generated-fixture VLM runtime verification gate for `Qwen/Qwen3-VL-8B-Instruct`. It consumes Phase 39A approval evidence and Phase 39B private model staging evidence only.

## Candidate

- Model id: `Qwen/Qwen3-VL-8B-Instruct`
- Pinned revision: `0c351dd01ed87e9c1b53cbc748cba10e6187ff3b`
- Private model prefix: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/`
- Phase 39B aggregate SHA-256: `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`
- Required runtime: `vLLM`
- Fallback runtime: local Transformers fallback may be reported only as fallback and must not be called a vLLM pass.

## Scope

Phase 39C may run only deterministic generated synthetic fixtures:

- `generated-object-layout`
- `generated-ui-safe-zone`
- `generated-ocr-vlm-comparison`
- `generated-ambiguous-scene`
- `generated-spatial-reasoning`

Runtime commands must copy only verified Phase 39B private GCS assets, verify SHA-256 before use, and start vLLM with a local model directory. Passing the Hugging Face model id as the runtime model path is blocked because it can trigger runtime auto-download.

## Execution

Safe commands:

```bash
npm run smoke:activation-vlm-runtime
npm run activation:vlm-runtime:plan
npm run activation:vlm-runtime:report
npm run activation:vlm-runtime:iam-plan
npm run activation:vlm-runtime:cost-summary
```

Guarded execution requires current-shell confirmations only:

```bash
REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ=true \
REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true \
REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD=true \
npm run activation:vlm-runtime -- --execute --keep-temp
```

The staging L4 path additionally requires Docker build, Docker push, staging Cloud Run Job, and L4 GPU confirmations. Scoped IAM updates are guarded separately by `REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE=true`, default to non-mutating plan/report mode, and must remain prefix-scoped. Phase 39C does not create public endpoints or deploy production services.

## Blocked Scope

Phase 39C blocks real frames, real video, arbitrary images/video, raw prompts, provider calls, public output, beta, production, broad media, unapproved GPU types, Track A, Phase 39D controlled real-frame VLM, and Phase 39E planning integration.

## Scoped IAM Evidence

After the first guarded L4 failure, Phase 39C recorded a scoped IAM plan/apply evidence set:

- `phase_39c_vlm_runtime_scoped_iam_plan.json`
- `phase_39c_vlm_runtime_iam_before.json`
- `phase_39c_vlm_runtime_iam_after.json`
- `phase_39c_vlm_runtime_iam_delta_report.json`

The delta report records two applied conditional bindings for `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`: `roles/storage.objectViewer` limited to the exact Phase 39B model prefix and `roles/storage.objectCreator` limited to the Phase 39C generated VLM runtime QA prefix. `missingRequiredBindings` is empty, `broadAccessGranted` is `false`, and `publicAccessGranted` is `false`, meaning this Phase 39C update did not grant broad or public access. The delta report also preserves warnings for a pre-existing unconditioned storage binding for the Phase 39C member that was detected and left unchanged. The plan still rejects `storage.objects.list`, public principals, project-wide storage roles, unconditioned bucket-wide Phase 39C roles, and broad admin/editor roles. QA artifact readback remains optional/deferred and skipped by default. The latest guarded rerun used exact Phase 39B object names from the manifest and did not require broad prefix listing.

## Current Blocker

The L4 tuning follow-up added a bounded `l4-oom-remediation-v1` profile matrix and reran the staging Cloud Run Job without changing model revision, model files, GPU class, prompt scope, or media scope.

Attempted profiles:

- `conservative-eager-short-context`: blocked during vLLM engine initialization with CUDA OOM before fixture inference.
- `conservative-cuda-graph-lower-reservation`: blocked during vLLM engine initialization with CUDA OOM before fixture inference.
- `auto-fit-context`: skipped because vLLM `0.11.0` does not expose a safe auto-fit `max_model_len` value for this worker path.
- `cpu-offload-short-context`: not executed because Cloud Run rejected both `48Gi` and `64Gi` for the approved `8` CPU L4 job shape; the current platform limit reported by gcloud is `4Gi` to `32Gi`.
- `minimal-smoke-one-fixture`: executed as diagnostic-only run `phase39c-20260531T214216` and still blocked during vLLM engine initialization with CUDA OOM before a single generated fixture could run.

The latest diagnostic run built and pushed the staging image `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c:phase39c-20260531t214216`, deployed job `reeditpro-stg-vlm-runtime-phase39c` with one `nvidia-l4`, `8` CPU, `32Gi` memory, max retries `0`, and no public endpoint, then executed Cloud Run execution `reeditpro-stg-vlm-runtime-phase39c-xcz4t`.

The worker copied the exact Phase 39B private model objects, verified every per-file SHA-256, recomputed the Phase 39B aggregate SHA-256 `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`, prepared the local model directory, and uploaded 13 private JSON QA artifacts to the approved Phase 39C QA prefix. Runtime auto-download remained blocked because vLLM was invoked with the verified local model directory only.

The safe log summary for the minimal profile reported `OutOfMemoryError: CUDA out of memory. Tried to allocate 4.62 GiB. GPU 0 has a total capacity of 21.96 GiB of which 4.56 GiB is free. Process 3093 has 17.40 GiB memory in use. Of the allocated memory 17.11 GiB is allocated by PyTorch, and 39.77 MiB is reserved by PyTorch but unallocated.` The stack failed inside vLLM `LLM(...)` / `EngineCoreClient.make_client` / `wait_for_engine_startup`, so fixture inference was never reached.

Because vLLM initialization failed for the L4-safe profiles, structured output validation, object-region QA, safe-zone QA, hallucination/safety QA, and generated fixture inference remain blocked. VLM tool-family beta status is `blocked`. Phase 39D remains blocked until a later approved path changes the blocker, such as official quantized Qwen3-VL approval/private staging, smaller VLM candidate approval/private staging, a different GPU-class approval, or a deeper vLLM configuration follow-up only if new logs identify a specific fix. Phase 39C does not approve those changes by itself.
