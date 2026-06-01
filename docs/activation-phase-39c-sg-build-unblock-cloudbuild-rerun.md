# Phase 39C-SG-BUILD SGLang Cloud Build Rerun

Phase 39C-SG-BUILD unblocks the PR #100 local Docker buildx failure by using a guarded Cloud Build path for the existing SGLang runtime image.

This phase remains Track B only. It uses only the already staged PR #87 official Qwen candidates and deterministic generated synthetic fixtures. It does not download new models, process real media, call providers, create public artifacts, or unlock beta/production.

## Run Result

Run `phase39c-sg-build-20260601T232400-overlay` used the guarded overlay Cloud Build path after the full remote rebuild stalled during publish/finalization. Cloud Build `7d2bf5c2-491b-4a6f-bf75-6e59b3c94610` succeeded in 217 seconds and pushed image digest `sha256:39cdb9bf6123c4d9568a9bfd55041b138ed0c03adad9f02a9c51482fec5adfa9`.

The staging Cloud Run L4 job executed all three PR #87 candidates in the required debug order. Private model payload copy/checksum/local model path setup passed, and each candidate uploaded private JSON QA artifacts. All candidates remain blocked before generated fixture inference because SGLang failed during engine import with:

`ImportError: /opt/conda/lib/python3.11/site-packages/sgl_kernel/common_ops.abi3.so: undefined symbol: cuGreenCtxDestroy`

This is a runtime CUDA driver/kernel compatibility blocker, not a model staging, checksum, IAM, local model path, or private artifact upload blocker.

## Required Outcome

Phase 39C remains blocked until all of these pass:

- Cloud Build builds the SGLang image and pushes it to Artifact Registry.
- The image digest is verified.
- The staging Cloud Run L4 job executes with the verified image.
- Candidate model files are copied from private GCS by exact PR #87 object paths.
- Per-file and aggregate SHA-256 checks pass.
- SGLang runs generated fixture canaries and decomposed QA.
- Object/label, coarse-region, safe-zone, hallucination/safety, and private artifact gates pass for one candidate.

## Current Safety Boundary

If any Cloud Build, Artifact Registry, Cloud Run, L4 quota, model-copy, checksum, SGLang runtime, perception QA, or private artifact upload step fails, VLM tool-family beta status remains `blocked`.
