# Phase 39C-SG-FIXED Profile Matrix

The fixed-kernel matrix stops after the first Cloud Run L4 import-smoke pass.

| Profile | Status Before Execution | Purpose |
| --- | --- | --- |
| F0 PR #107 baseline | Carry-forward evidence | Preserve the expected `cuGreenCtxDestroy` failure without rebuilding. |
| F1 minimal fixed `sgl-kernel==0.3.6.post1` | Allowed | Smallest upstream-evidence-driven wheel change over the PR #104 base image. |
| F2 current stable `sglang[all]==0.5.12.post1` | Allowed | Test the current stable SGLang dependency set, including current SGLang kernel packages. |
| F3 latest kernel overlay | Allowed | Overlay current `sgl-kernel==0.3.21` and `sglang-kernel==0.4.3` on the PR #104 base image. |
| F4 forward-compat base | Blocked | Requires exact Cloud Run/NVIDIA evidence after wheel profiles fail. |
| F5 official SGLang image overlay | Blocked | Requires an exact official image tag verified by upstream release metadata. |
| F6 source build after #9021/#9231 | Blocked | Requires human review because bounded Cloud Build risk is high. |

Import-smoke-only profiles do not copy model files, do not run inference, do not process media, and do not alter VLM beta status.
