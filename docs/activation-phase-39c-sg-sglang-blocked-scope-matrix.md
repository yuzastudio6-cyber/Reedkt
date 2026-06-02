# Phase 39C-SG SGLang Blocked Scope Matrix

| Scope | Status | Reason |
| --- | --- | --- |
| Phase 39D controlled real-frame VLM | Blocked | Requires generated-runtime pass first. |
| Phase 39E planning integration | Blocked | Requires generated-runtime and controlled real-frame evidence first. |
| Provider calls | Blocked | This phase permits only local SGLang runtime inside a staging job. |
| Production and paid production | Blocked | Evaluation-only runtime evidence is insufficient. |
| Internal/external beta | Blocked | VLM beta readiness requires later phases and final decision. |
| Public output | Blocked | QA artifacts remain private. |
| Broad user media | Blocked | Only deterministic generated fixtures are allowed. |
| Arbitrary media paths | Blocked | Worker uses fixed generated fixtures only. |
| Non-Qwen candidates | Blocked | This phase only uses PR #87 official Qwen candidates. |
| New model downloads | Blocked | Private staged PR #87 assets are the only source of truth. |
| Community quantizations | Blocked | No third-party variants are allowed. |
| Track A | Blocked | No SAM2, BiRefNet, render, visual runtime, or Track A stack changes are in scope. |

## Phase 39C-SG-KERNEL Current Blockers

- SGLang kernel import remains blocked on Cloud Run L4 because `cuGreenCtxDestroy` is missing from the driver/libcuda symbol set.
- Private QA artifact upload for `generated-vlm-sglang-kernel-compat` is blocked until a scoped object-create/readback permission is added for the GPU worker service account.
- Generated fixture runtime, candidate selection, Phase 39D, Phase 39E, beta, production, public output, broad media, non-Qwen candidates, new model downloads, and Track A remain blocked.

## Phase 39C-SG-FIXED Current Gate

- Fixed-kernel profiles must pass an import-only Cloud Run L4 smoke job before any PR #87 model payload is copied or any generated fixture inference runs.
- Scoped object-create IAM for `generated-vlm-sglang-fixed-kernel` may be added only if missing and only with `REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE=true`.
- Generated fixture runtime, candidate selection, Phase 39D, Phase 39E, beta, production, public output, broad media, non-Qwen candidates, new model downloads, source-build profiles without human approval, and Track A remain blocked until the import smoke and generated fixture gates pass.

## Phase 39C-SG-AUTH-RERUN Current Gate

- Noninteractive gcloud auth must pass before Cloud Build, import smoke, model copy, or generated runtime can run.
- Supported auth paths are existing active auth, service-account impersonation, access-token file/env, Workload Identity Federation, and attached service account. Tokens and credential file contents must not be printed or committed.
- Service-account keys, browser login inside Codex, broad IAM, public principals, unapproved GPU types, provider calls, real media, arbitrary media, new Qwen downloads, non-Qwen candidates, beta, production, Phase 39D, Phase 39E, and Track A remain blocked.
