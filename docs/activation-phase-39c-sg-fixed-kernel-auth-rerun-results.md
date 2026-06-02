# Phase 39C-SG Fixed Kernel Auth Rerun Results

Current implementation state:

- Noninteractive auth preflight code and CLIs are present.
- The preflight redacts token and credential material.
- The auth-rerun runner delegates to PR #110 fixed-kernel Cloud Build/import-smoke/runtime only after auth and permission preflight pass.
- Service-account keys, browser login inside Codex, broad IAM, provider calls, real media, public output, beta, production, new Qwen downloads, non-Qwen candidates, unapproved GPU types, and Track A remain blocked.

Executed rerun:

- Run id: `phase39c-sg-auth-rerun-20260602T151556`.
- Noninteractive auth passed with the existing active gcloud account `aiediting@reeditpro.com`; token output was suppressed and no service-account key was used or created.
- Permission preflight passed for Cloud Build, Artifact Registry, Cloud Run Jobs, generated-assets bucket describe, QA-artifacts bucket describe, and QA-artifacts IAM policy read.
- Scoped QA artifact IAM was applied only for `roles/storage.objectCreator` on the fixed-kernel QA prefix. Readback was skipped as not needed. Broad IAM and public access were not changed.
- Cloud Build succeeded for F1, F2, and F3 fixed-kernel profiles:
  - F1 `f1-minimal-fixed-sgl-kernel`: build `ec36e22c-0e21-4eaf-ae91-540a881da630`, image digest `sha256:33acdb9e074c76bdbafa4b47f4443a9f832e2d80bdfad1f2629ef19e3f55de5b`.
  - F2 `f2-current-stable-sglang`: build `2e6ef43e-2bd9-4eae-9811-4c57a7ddc82c`, image digest `sha256:f39e6fac1763eecc13149a940cdf6c9377aaf4b460ddb6e2befd872da97bc380`.
  - F3 `f3-latest-kernel-overlay`: build `e42544da-10f9-4564-b71c-ad8a1b78daa0`, image digest `sha256:da802500850790838347993aaeced030dfb01b982451022cc4591152b20f6da5`.
- Import smoke remained blocked for all tested profiles:
  - F1 failed the required `sglang.srt.layers.rotary_embedding` import.
  - F2 failed `sglang`, `sglang.srt.layers.rotary_embedding`, and reported `torch_cuda_not_available_on_l4_job`.
  - F3 failed the required `sglang.srt.layers.rotary_embedding` import.
- No fixed-kernel profile passed import smoke, so generated runtime was not run and no PR #87 model payload was copied.
- Private import-smoke artifacts were uploaded under `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-sglang-fixed-kernel/phase39c-sg-auth-rerun-20260602T151556/`.
- VLM tool-family beta status remains `blocked`.

Runtime decision policy:

- If auth fails, Phase 39C-SG-AUTH-RERUN remains blocked by noninteractive GCP auth.
- If auth passes but Cloud Build, Artifact Registry, Cloud Run, or GCS permissions fail, Phase 39C-SG-AUTH-RERUN remains blocked by scoped access.
- If import smoke fails, generated runtime is not run.
- If import smoke passes but generated fixture QA fails for all PR #87 candidates, VLM remains blocked.
- Only a generated fixture QA pass for one already staged PR #87 official Qwen candidate can move the VLM status to `phase-complete but tool-family incomplete`.

Phase 39D controlled real-frame VLM and Phase 39E planning integration remain blocked regardless of auth-rerun implementation until their separate gates are explicitly approved.
