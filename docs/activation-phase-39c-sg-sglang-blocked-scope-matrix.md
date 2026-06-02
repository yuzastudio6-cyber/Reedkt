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
