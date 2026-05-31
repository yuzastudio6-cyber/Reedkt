# OCR Blocked Scope Matrix

| Scope | Phase 37D State | Reason |
| --- | --- | --- |
| Controlled real-video OCR | Passed for one sample only | `phase37d-20260531T002046` processed only the approved Phase 32 sample window `6.9s`-`8.9s` at six offsets. |
| Arbitrary real media OCR | Blocked | Phase 37D does not allow user media, broad media, or any unapproved source/window. |
| Broad real video OCR | Blocked | Full-video and multi-window OCR require later explicit phases. |
| Caption/render integration | Blocked until Phase 37E | Phase 37D output is ready only for controlled Phase 37E planning; it is not integrated into caption/render QA yet. |
| Frame extraction | Passed for 6 temp frames only | OpenCV extracted exactly six local temp frames; raw frames were not uploaded or committed. |
| Artifact upload | Passed for private JSON only | Run `phase37d-20260531T002046` uploaded 10 JSON QA objects and no frames/overlays. |
| Runtime model auto-download | Blocked | All model assets must come from verified private Phase 37B evidence. |
| Textline orientation classifier | Deferred/blocked | `PP-LCNet_x1_0_textline_ori` was not selected for safe-zone v1. |
| Provider calls | Blocked | OCR safe-zone execution is deterministic and local CPU-only. |
| Cloud Run deploy | Blocked | No service or job deployment is part of Phase 37D. |
| Docker build/push | Blocked | No Docker fallback is part of Phase 37D. |
| GPU job | Blocked | Phase 37D uses local CPU-only PaddleOCR. |
| Public artifacts | Blocked | Artifacts are private QA-only. |
| Track A | Blocked | Phase 37D is Track B OCR only; prior Track A phase IDs may appear only as inert metadata. |
| Internal/external beta | Blocked | OCR evidence does not unlock beta. |
| Paid production | Blocked | OCR evidence does not unlock production. |
| Broad real-user media | Blocked | Requires later explicit controlled and beta gates. |
