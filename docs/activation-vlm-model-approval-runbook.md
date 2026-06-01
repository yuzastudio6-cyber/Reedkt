# Phase 39A VLM Model Approval Runbook

Phase 39A is a Track B metadata approval workflow for Qwen3-VL/vLLM planning. It records candidate, source, license, runtime-support, private-storage, GPU/cost, privacy, and future handoff evidence without downloading or executing anything.

Use these scripts:

- `npm run activation:vlm-model-approval:plan`
- `npm run activation:vlm-model-approval`
- `npm run activation:vlm-model-approval:report`
- `npm run activation:vlm-model-approval:iam-plan`
- `npm run activation:vlm-model-weight:summary`
- `npm run smoke:activation-vlm-model-approval-workflow`

`activation:vlm-model-approval` prints the combined report by default. Passing `--write-artifacts` emits local JSON metadata reports only under `/tmp/reeditpro-vlm-model-approval/phase39a/<run-id>/`; it does not upload to GCS and does not create model, media, credential, or signed URL artifacts.

Phase 39A must not set any future confirmation env vars. Those confirmations belong to later phases only:

- Phase 39B: current-shell VLM model download and private GCS upload confirmations
- Phase 39C: `REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ=true`, `REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true`, `REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD=true`
- Phase 39D: `REEDITPRO_CONFIRM_CONTROLLED_REAL_FRAME_VLM_EXECUTE=true`, `REEDITPRO_CONFIRM_CONTROLLED_REAL_FRAME_VLM_ARTIFACT_UPLOAD=true`, `REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ=true`, `REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true`

Before Phase 39B, recheck the model card, exact revision, file manifest, source/license metadata, and any gated/disclaimer terms. Before Phase 39C, pin vLLM/CUDA/Torch/Transformers/qwen-vl-utils versions and prove that runtime local paths prevent external model downloads.
