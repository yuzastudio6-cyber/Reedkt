# OCR Model License Evidence Policy

Phase 37A records package, runtime, and model-family evidence separately. PaddleOCR and PaddlePaddle are recorded from official repositories with Apache-2.0 license claims. PP-OCRv5 is recorded as a model-family candidate.

Phase 37B selects only `PP-OCRv5_mobile_det_infer.tar`, `PP-OCRv5_mobile_rec_infer.tar`, and `ppocrv5_dict.txt` for `paddle3.0.0-mobile-safe-zone-v1`. It records official PaddleOCR docs/repository evidence, Apache-2.0 project evidence, exact source URLs, and the future checksum/private GCS artifact schemas. Project/package license evidence is not enough to permit production legal approval, runtime auto-download, OCR inference, public output, or unpinned model assets.

If asset-specific evidence cannot be tied back to official PaddleOCR/Paddle model sources during guarded execution, Phase 37B must report a blocker and Phase 37C remains blocked.
