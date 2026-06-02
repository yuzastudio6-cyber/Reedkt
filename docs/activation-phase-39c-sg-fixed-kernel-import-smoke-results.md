# Phase 39C-SG-FIXED Import-Smoke Results

This file is updated by Phase 39C-SG-FIXED reports after execution. Before execution, the expected state is:

- F0 baseline: blocked by carry-forward PR #107 `cuGreenCtxDestroy` evidence.
- F1/F2/F3: pending Cloud Build and Cloud Run L4 import smoke.
- F4/F5/F6: blocked by policy until narrower profiles fail and required evidence or human approval exists.

An import-smoke pass requires SGLang package import, `sgl_kernel` import, SGLang launch-server import/help behavior, Torch CUDA availability, L4 GPU visibility, no model path, no inference, no media, no provider calls, and private artifact upload.

Generated fixture runtime must remain skipped until at least one profile passes this gate.
