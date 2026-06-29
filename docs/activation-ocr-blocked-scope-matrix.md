# OCR Blocked Scope Matrix

| Scope | Phase 37C State | Reason |
| --- | --- | --- |
| Real media OCR | Blocked | Phase 37C is generated-fixture only. |
| Real video OCR | Blocked | Requires Phase 37C pass and a separate Phase 37D controlled-media gate. |
| Caption/render integration | Blocked | Requires controlled OCR safe-zone evidence first. |
| Runtime model auto-download | Blocked | All model assets must come from verified private Phase 37B evidence. |
| Textline orientation classifier | Deferred/blocked | `PP-LCNet_x1_0_textline_ori` was not selected for safe-zone v1. |
| Provider calls | Blocked | OCR runtime verification is local and deterministic. |
| Cloud Run deploy | Blocked | Phase 37C is local CPU-first. |
| Docker push | Blocked | Docker is local fallback only if macOS/Python blocks execution. |
| GPU job | Blocked | CPU-first verification is required before any later runtime decision. |
| Public artifacts | Blocked | Artifacts are private QA-only. |
| Track A | Blocked | Phase 37C is Track B OCR only. |
| Internal/external beta | Blocked | OCR evidence does not unlock beta. |
| Paid production | Blocked | OCR evidence does not unlock production. |
| Broad real-user media | Blocked | Requires later explicit controlled and beta gates. |
