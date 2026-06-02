# Phase 39C-SG cuGreenCtxDestroy Root Cause

Phase 39C-SG-BUILD reached Cloud Run L4 execution and verified PR #87 private Qwen model copy/checksum paths, but SGLang failed before generated fixture inference when `sgl_kernel/common_ops.abi3.so` imported an unresolved CUDA driver symbol: `cuGreenCtxDestroy`.

This failure is treated as a runtime CUDA driver/kernel compatibility blocker, not a model staging, checksum, GCS, IAM, local model path, or VLM perception blocker.

## Evidence Chain

- PR #100 recorded that SGLang source/license/runtime evidence and local code validation passed, but local Docker buildx blocked image creation.
- PR #104/Phase 39C-SG-BUILD used Cloud Build and Cloud Run L4, reached the SGLang runtime, and then failed during `sgl_kernel` import before inference.
- PR #107 preserved K0/K2 import-smoke evidence showing the same `cuGreenCtxDestroy` blocker before model copy or generated fixtures.
- SGLang issue #8432 and issue #8566 describe matching unresolved green-context symbol failures.
- SGLang PR #9021 and PR #9231 are the upstream fixed-kernel evidence for this follow-up.

## Phase 39C-SG-FIXED Policy

The fixed-kernel path must prove import success in a Cloud Run L4 smoke job before it may copy PR #87 model payloads or run generated synthetic fixtures. If every fixed profile fails import smoke, generated runtime remains blocked and no VLM beta status changes.
