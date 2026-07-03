# Use Case Tool Ranking Rerun Matrix

Decision: `trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_plan_passed_ready_for_product_ready_proof_rerun_execution`.

Previous decision: `trackb_media_oss_product_beta_runtime_product_route_enablement_closeout_passed_ready_for_product_ready_proof_rerun_plan`.

Next prompt: `TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_RERUN_EXECUTION`.

Track B totals: `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready`.

Supabase classification: no write / environment none / SQL none / migration no.

Product-ready local OSS count remains `0`.

This phase is metadata-only: no live product calls, route runtime, worker dispatch, real tools, Docker, installs, media processing, Supabase/GCS writes, public artifacts, signed URLs, external beta, production, or product-ready unlocks run or become approved.

```json
{
  "schema": "reeditpro.trackbMediaOss.productReadyProofRerunPlan.v1",
  "ownerId": "TRACK_B_MEDIA_OSS_STEWARD",
  "decision": "trackb_media_oss_product_beta_runtime_product_ready_proof_rerun_plan_passed_ready_for_product_ready_proof_rerun_execution",
  "previousDecision": "trackb_media_oss_product_beta_runtime_product_route_enablement_closeout_passed_ready_for_product_ready_proof_rerun_plan",
  "nextPrompt": "TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_RERUN_EXECUTION",
  "sourcePr": 947,
  "sourceSha": "019ad4061f96a302f02f89eaacbfec796a23f417",
  "sourceHead": "a73e0a738946d271d139f4139e1c90166b83646b",
  "sourceBranch": "codex/rp-github-merge-hygiene-open-pr-stack-audit",
  "reportDirectory": "docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-rerun-plan",
  "trackBTotals": {
    "owned": 16,
    "boundedAcceptedProven": 16,
    "blockedNotInstalledProven": 0,
    "productReady": 0
  },
  "productReadyCount": 0,
  "supabaseClassification": "no write / environment none / SQL none / migration no",
  "report": "use-case-tool-ranking-rerun-matrix",
  "coveredToolCount": 16,
  "deterministicRankingPreserved": true,
  "allToolsHaveFutureRerunProofRequirement": true,
  "useCaseMatrix": [
    {
      "useCase": "metadata_probe",
      "order": [
        "ffprobe",
        "mediainfo",
        "exiftool",
        "duckdb",
        "polars_nodejs_polars"
      ],
      "rerunFixture": "synthetic_metadata_probe_payload_no_user_media",
      "requiredProductProof": "product route selects the ranked metadata probe path, requires approved snapshot and credit gate, then records sanitized receipt without user media persistence"
    },
    {
      "useCase": "video_analysis",
      "order": [
        "ffprobe",
        "mediainfo",
        "pyav",
        "opencv",
        "pyscenedetect"
      ],
      "rerunFixture": "synthetic_video_analysis_fixture_private_temp_only_no_export",
      "requiredProductProof": "product route selects analysis-only worker intent, blocks transform/export behavior, and records bounded monitoring receipt"
    },
    {
      "useCase": "image_color_pipeline",
      "order": [
        "sharp_libvips",
        "opencolorio",
        "openimageio",
        "imagemagick",
        "opencv"
      ],
      "rerunFixture": "tiny_synthetic_image_or_config_fixture_private_temp_only",
      "requiredProductProof": "product route selects color/image worker intent, blocks public artifact and signed URL creation, and records bounded receipt"
    },
    {
      "useCase": "ocr_text_extraction",
      "order": [
        "tesseract",
        "paddlepaddle",
        "paddleocr"
      ],
      "rerunFixture": "synthetic_ocr_fixture_private_temp_only_no_model_or_font_download",
      "requiredProductProof": "product route selects OCR worker intent, preserves local font/model boundaries, and records sanitized receipt without text leakage"
    },
    {
      "useCase": "high_risk_media_transform",
      "order": [
        "ffmpeg"
      ],
      "rerunFixture": "explicitly_bounded_synthetic_transform_fixture_only_if_transform_policy_allows",
      "requiredProductProof": "product route requires explicit transform policy, approved snapshot, credit gate, rollback controls, and no default user-media transform"
    }
  ],
  "productReadyCountBeforeRerunExecution": 0
}
```
