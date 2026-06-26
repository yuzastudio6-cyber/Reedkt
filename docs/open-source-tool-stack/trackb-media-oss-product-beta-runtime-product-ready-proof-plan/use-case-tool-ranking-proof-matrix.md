# Use Case Tool Ranking Proof Matrix

Decision: `trackb_media_oss_product_beta_runtime_product_ready_proof_plan_passed_ready_for_bounded_live_product_runtime_proof_execution`.
Previous decision: `trackb_media_oss_product_beta_runtime_product_ready_review_blocked_pending_live_product_runtime_proof`.
Next prompt: `TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_EXECUTION`.

Track B totals: `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready`.
Supabase classification: no write / environment none / SQL none / migration no.

Proof-plan result: exact product-ready proof requirements are defined, but no product-ready local OSS status is granted in this phase. Product-ready local OSS count remains `0`.

Future product-ready proof matrix:
- metadata_probe: ffprobe > mediainfo > exiftool > duckdb > polars_nodejs_polars; fixture synthetic_metadata_probe_payload_no_user_media; proof product route selects ranked metadata tool, worker dispatch stays allowlisted, output is sanitized receipt only
- video_analysis: ffprobe > mediainfo > pyav > opencv > pyscenedetect; fixture synthetic_video_analysis_fixture_with_no_user_media_and_no_public_artifact; proof product route selects analysis-only worker path, validates no transform/export behavior, records bounded receipt
- image_color_pipeline: sharp_libvips > opencolorio > openimageio > imagemagick > opencv; fixture tiny_synthetic_image_or_config_fixture_private_temp_only; proof product route selects color/image worker path, validates no public artifact and no signed URL, records bounded receipt
- ocr_text_extraction: tesseract > paddlepaddle > paddleocr; fixture synthetic_ocr_fixture_private_temp_only_no_model_download; proof product route selects OCR worker path, verifies local font/model boundaries, records sanitized receipt without user text leakage
- high_risk_media_transform: ffmpeg; fixture explicitly_bounded_synthetic_transform_fixture_only_if_transform_policy_allows; proof product route requires explicit transform policy, approved snapshot, credit gate, and rollback; no default user-media transform

```json
{
  "ownerId": "TRACK_B_MEDIA_OSS_STEWARD",
  "decision": "trackb_media_oss_product_beta_runtime_product_ready_proof_plan_passed_ready_for_bounded_live_product_runtime_proof_execution",
  "previousDecision": "trackb_media_oss_product_beta_runtime_product_ready_review_blocked_pending_live_product_runtime_proof",
  "reportDirectory": "docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-plan",
  "sourceSha": "d521ed20d8e4368cce7365f2678b2206c3affcb4",
  "sourceBranch": "codex/rp-github-merge-hygiene-open-pr-stack-audit",
  "sourcePr": 918,
  "sourceHead": "81f2056a96d52515257146cb4a0a39016fc2223f",
  "trackBTotals": {
    "owned": 16,
    "boundedAcceptedProven": 16,
    "blockedNotInstalledProven": 0,
    "productReady": 0
  },
  "productReadyCount": 0,
  "supabaseClassification": "no write / environment none / SQL none / migration no",
  "nextPrompt": "TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_READY_PROOF_EXECUTION",
  "coveredToolCount": 16,
  "deterministicRankingPreserved": true,
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
      "futureProofFixture": "synthetic_metadata_probe_payload_no_user_media",
      "requiredProductProof": "product route selects ranked metadata tool, worker dispatch stays allowlisted, output is sanitized receipt only"
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
      "futureProofFixture": "synthetic_video_analysis_fixture_with_no_user_media_and_no_public_artifact",
      "requiredProductProof": "product route selects analysis-only worker path, validates no transform/export behavior, records bounded receipt"
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
      "futureProofFixture": "tiny_synthetic_image_or_config_fixture_private_temp_only",
      "requiredProductProof": "product route selects color/image worker path, validates no public artifact and no signed URL, records bounded receipt"
    },
    {
      "useCase": "ocr_text_extraction",
      "order": [
        "tesseract",
        "paddlepaddle",
        "paddleocr"
      ],
      "futureProofFixture": "synthetic_ocr_fixture_private_temp_only_no_model_download",
      "requiredProductProof": "product route selects OCR worker path, verifies local font/model boundaries, records sanitized receipt without user text leakage"
    },
    {
      "useCase": "high_risk_media_transform",
      "order": [
        "ffmpeg"
      ],
      "futureProofFixture": "explicitly_bounded_synthetic_transform_fixture_only_if_transform_policy_allows",
      "requiredProductProof": "product route requires explicit transform policy, approved snapshot, credit gate, and rollback; no default user-media transform"
    }
  ],
  "allToolsHaveFutureProofRequirement": true,
  "productReadyCountBeforeProofExecution": 0
}
```
