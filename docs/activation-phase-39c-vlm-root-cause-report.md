# Phase 39C VLM Root Cause Report

The current VLM failure is not a single defect.

## Proven Working

- Private GCS model staging and exact object references.
- SHA-256 per-file and aggregate verification.
- Scoped IAM for approved private artifact prefixes.
- Cloud Build and Artifact Registry push for SGLang images.
- Cloud Run Job wiring for the approved L4 shape.
- Noninteractive GCP auth preflight.
- Private metadata/report artifact upload paths.

## vLLM/Qwen Blockers

- `Qwen/Qwen3-VL-8B-Instruct` BF16 fails on Cloud Run L4 with CUDA OOM before generated fixture inference.
- Official smaller/FP8 Qwen candidates can reach output generation under vLLM but fail JSON/schema and semantic generated-image QA.
- Structured output can enforce shape for text-only cases, but it does not make generated image labels, regions, or safe-zone decisions correct.
- Perception canaries failed the required label recall and coarse-region gates.

## SGLang/Qwen Blockers

- Local Docker buildx was bypassed by Cloud Build.
- Cloud Build and Artifact Registry are not the active blocker.
- SGLang fails before inference on Cloud Run L4 because `sgl_kernel/common_ops.abi3.so` requires unresolved CUDA green-context symbols such as `cuGreenCtxDestroy`.
- Fixed-kernel profiles built and pushed after auth was fixed, but no Cloud Run L4 import-smoke profile passed.
- SGLang generated fixture inference has not been reached.

## Product Implication

The current Qwen/vLLM/SGLang/Cloud Run L4 route is not ready for generated VLM runtime verification. Phase 39D and Phase 39E remain blocked. Product momentum should move to deterministic media/data readiness unless a human explicitly approves a VLM recovery path.
