# Phase 39C Generated Qwen3-VL/vLLM Runtime Verification

Status: `blocked_runtime_gpu_unavailable`

Guarded run: `phase39c-20260531T111759`

Private artifact prefix: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T111759/`

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

The optional staging L4 path additionally requires Docker build, Docker push, staging Cloud Run Job, and L4 GPU confirmations. Phase 39C does not change IAM, create public endpoints, or deploy production services.

## Blocked Scope

Phase 39C blocks real frames, real video, arbitrary images/video, raw prompts, provider calls, public output, beta, production, broad media, unapproved GPU types, Track A, Phase 39D controlled real-frame VLM, and Phase 39E planning integration.

## Current Blocker

The guarded run verified Phase 39A/39B evidence, GCS metadata access, generated fixture/prompt schemas, and private JSON artifact upload, but did not copy the 17.5GB model payload or start vLLM because no local NVIDIA GPU was available and the optional staging L4 Cloud Run Job path was not fully confirmed. The recorded blockers are `phase39c_l4_or_local_gpu_runtime_unavailable` and `local_model_payload_checksum_verification_not_run`.

VLM tool-family beta status is `blocked`. Phase 39D remains blocked until Phase 39C can run on an approved local/staging L4 runtime, verify local payload checksums, start vLLM from the local model path, and pass generated-fixture QA.
