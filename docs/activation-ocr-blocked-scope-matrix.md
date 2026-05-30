# OCR Blocked Scope Matrix

| Scope | Phase 37D State | Reason |
| --- | --- | --- |
| Real media OCR | Blocked | Phase 37D is metadata-only and does not execute OCR. |
| Real video OCR | Blocked | Phase 37D selects one future sample but does not extract frames or run OCR. |
| Caption/render integration | Blocked | Requires a later controlled OCR execution/collision QA pass before Phase 37E. |
| Frame extraction | Blocked | Phase 37D defines future offsets only. |
| Artifact upload | Blocked | Phase 37D defines future private schemas only. |
| Runtime model auto-download | Blocked | All model assets must come from verified private Phase 37B evidence. |
| Textline orientation classifier | Deferred/blocked | `PP-LCNet_x1_0_textline_ori` was not selected for safe-zone v1. |
| Provider calls | Blocked | OCR safe-zone planning is deterministic and local metadata-only. |
| Cloud Run deploy | Blocked | No service or job deployment is part of Phase 37D. |
| Docker build/push | Blocked | No Docker fallback is part of Phase 37D. |
| GPU job | Blocked | Phase 37D does not execute runtime jobs. |
| Public artifacts | Blocked | Artifacts are private QA-only. |
| Track A | Blocked | Phase 37D is Track B OCR only; prior Track A phase IDs may appear only as inert metadata. |
| Internal/external beta | Blocked | OCR evidence does not unlock beta. |
| Paid production | Blocked | OCR evidence does not unlock production. |
| Broad real-user media | Blocked | Requires later explicit controlled and beta gates. |
