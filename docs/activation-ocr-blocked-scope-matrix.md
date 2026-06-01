# OCR Blocked Scope Matrix

| Scope | Phase 37E State | Reason |
| --- | --- | --- |
| Controlled real-video OCR | Passed for one sample only | `phase37d-20260531T002046` processed only the approved Phase 32 sample window `6.9s`-`8.9s` at six offsets. |
| OCR caption/render QA metadata integration | Passed | `phase37e-20260531T011259` integrated generated metadata fixtures and redacted Phase 37D safe-zone metadata into caption overlap QA and future render QA handoff reports. |
| Arbitrary real media OCR | Blocked | Phase 37E does not allow user media, broad media, or any unapproved source/window. |
| Broad real video OCR | Blocked | Full-video and multi-window OCR require later explicit phases. |
| Caption/render runtime execution | Blocked | Phase 37E emits metadata contracts only; it does not call render workers, burn captions, or touch Track A. |
| Frame extraction | Blocked in Phase 37E | Phase 37E reuses Phase 37D JSON metadata only and does not extract frames. |
| Artifact upload | Passed for private JSON only | Run `phase37e-20260531T011259` uploaded 10 JSON QA objects and no frames/overlays/render outputs. |
| Runtime model auto-download | Blocked | All model assets must come from verified private Phase 37B evidence. |
| Textline orientation classifier | Deferred/blocked | `PP-LCNet_x1_0_textline_ori` was not selected for safe-zone v1. |
| Provider calls | Blocked | OCR safe-zone execution is deterministic and local CPU-only. |
| Cloud Run deploy | Blocked | No service or job deployment is part of Phase 37E. |
| Docker build/push | Blocked | No Docker fallback is part of Phase 37E. |
| GPU job | Blocked | Phase 37E does not run OCR or render jobs. |
| Public artifacts | Blocked | Artifacts are private QA-only. |
| Track A | Blocked | Phase 37E is Track B OCR metadata only; Track A execution/runtime code remains untouched. |
| Internal/external beta | Blocked | OCR evidence does not unlock beta. |
| Paid production | Blocked | OCR evidence does not unlock production. |
| Broad real-user media | Blocked | Requires later explicit controlled and beta gates. |
