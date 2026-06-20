# PaddleX Font Asset Blocker Review

Decision: `trackb_media_oss_milestone3_model_asset_approval_passed_ready_for_exact_asset_source_review`

- Requested asset: `PingFang-SC-Regular.ttf`.
- Observed source component: PaddleX font assets.
- PR #600 evidence shows PaddleOCR/PaddleX attempted an external font fetch under `--network none`.
- This phase classifies the issue as an asset governance blocker, not a system library blocker.
- No OCR inference, asset download, asset copy, or asset upload occurred.
