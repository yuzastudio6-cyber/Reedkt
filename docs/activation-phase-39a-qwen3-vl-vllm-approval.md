# Phase 39A Qwen3-VL/vLLM Approval Workflow

Status: `staging_planning_approved`

Phase 39A records Track B metadata-only approval evidence for `Qwen/Qwen3-VL-8B-Instruct` with `vLLM` as the primary runtime candidate and local Transformers as fallback planning only.

## Evidence

- Qwen3-VL official repository: `https://github.com/QwenLM/Qwen3-VL`
- Qwen3-VL 8B Instruct model card: `https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct`
- vLLM supported models: `https://docs.vllm.ai/en/latest/models/supported_models/`
- Qwen vLLM docs: `https://qwen.readthedocs.io/en/latest/deployment/vllm.html`
- Transformers repository: `https://github.com/huggingface/transformers`
- qwen-vl-utils PyPI: `https://pypi.org/project/qwen-vl-utils/`

The evidence supports planning only. The model card identifies `Qwen/Qwen3-VL-8B-Instruct`, `Image-Text-to-Text`, `qwen3_vl`, and `apache-2.0` metadata. vLLM lists `qwen3_vl` support. The Qwen vLLM docs create a future local-path/no-runtime-download requirement because non-local model paths can trigger external downloads. Current Qwen3-VL deployment notes should be rechecked before Phase 39C because Qwen3-VL runtime docs mention a newer vLLM requirement than older general Qwen3 notes.

## Approved Planning Scope

- Exact Qwen3-VL 8B revision and file-manifest planning for Phase 39B.
- Private generated-assets storage planning under `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/<revision>/`.
- Generated-fixture VLM runtime planning for Phase 39C.
- One controlled private real-frame/sample VLM planning for Phase 39D.
- Structured VLM planning hints for Phase 39E.

## Blocked

- Model, tokenizer, and processor download.
- vLLM, Transformers, SGLang, or GPU execution.
- Runtime auto-download from Hugging Face, ModelScope, or any external source.
- Image, video, real media, controlled frame, or arbitrary file processing.
- GCS upload, IAM mutation, Cloud Run deploy, Docker build/push, or GPU job.
- Track A execution/runtime code.
- Provider calls, public output, signed URLs as source of truth, beta, production, and broad real user media.

## Future Handoffs

- Phase 39B may select exact revision/files, compute checksums, and upload model assets privately only with future current-shell confirmations.
- Phase 39C may run generated-fixture VLM runtime verification only after Phase 39B private assets pass checksum verification and runtime local-path guards are implemented.
- Phase 39D may run exactly one approved private controlled real-frame/sample only after Phase 39C passes.
- Phase 39E may integrate structured VLM planning hints only; no direct tool execution or raw prompt execution is approved.

## Validation

Run `npm run smoke:activation-vlm-model-approval-workflow`, the Phase 39A plan/report/IAM/weight summary scripts, production readiness summaries, lint, server typecheck, TypeScript build, app build, server build, and git diff checks.
