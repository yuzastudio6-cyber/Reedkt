# Phase 39C Generated Qwen3-VL/vLLM Runtime Verification

Status: `blocked_l4_vllm_cuda_oom`

Guarded run: `phase39c-20260531T202358`

Private artifact prefix: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T202358/`

Uploaded JSON artifacts verified: `12`

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

The guarded L4 path reran as `phase39c-20260531T202358`, built and pushed the staging image `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c:phase39c-20260531t202358` with digest `sha256:cdc2b7361740cb33c04ed7b4615396242f4a1cd999591ef958a3441dab9b29c9`, deployed job `reeditpro-stg-vlm-runtime-phase39c` with one `nvidia-l4`, `8` CPU, `32Gi` memory, max retries `0`, and no public endpoint, then executed Cloud Run execution `reeditpro-stg-vlm-runtime-phase39c-fjdgw`.

The latest worker copied all 15 exact Phase 39B private model objects, verified every per-file SHA-256, recomputed the Phase 39B aggregate SHA-256 `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`, prepared the local model directory, and uploaded 12 private JSON QA artifacts to the approved Phase 39C QA prefix. Runtime auto-download remained blocked because vLLM was invoked with the verified local model directory only.

vLLM did not reach generated-fixture inference. Engine initialization on the L4 task failed with `torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 4.62 GiB. GPU 0 has a total capacity of 21.96 GiB of which 4.40 GiB is free. Process 3028 has 17.56 GiB memory in use. Of the allocated memory 17.23 GiB is allocated by PyTorch, and 78.55 MiB is reserved by PyTorch but unallocated.` Cloud Run marked the execution `Completed=False` with `NonZeroExitCode`.

Because vLLM initialization failed, structured output validation, object-region QA, safe-zone QA, hallucination/safety QA, and generated fixture inference remain blocked. VLM tool-family beta status is `blocked`. Phase 39D remains blocked until Phase 39C reruns with an approved remediation, starts vLLM successfully from the verified local model path, and passes generated-fixture QA. Approved remediation must stay within Phase 39C scope, such as L4 runtime configuration tuning or a later explicit approval for a smaller model, quantized variant, or different GPU class; Phase 39C does not approve those changes by itself.
