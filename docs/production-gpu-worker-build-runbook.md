# Production GPU Worker Build Runbook

Milestone 11 is declaration-only. Codex does not build, push, deploy, run GPU jobs, or download model weights.

Human-run future order:

1. Inspect `docker/prod/gpu-worker/Dockerfile`, requirements, and model-weight layout.
2. Choose a non-placeholder image tag.
3. Build the GPU image later in a controlled environment.
4. Run dry-run GPU readiness first.
5. Optionally run import checks in a controlled GPU-compatible environment.
6. Review model-weight manifests, licenses, provenance, and commercial use.
7. Deploy only in a later milestone after worker execution and model-weight gates are approved.

GPU readiness must remain L4-first unless a future premium/evaluation review approves RTX PRO 6000.
