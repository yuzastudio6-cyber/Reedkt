# Use Case Ranking Runtime Proof

Decision: `trackb_media_oss_product_beta_runtime_product_ready_proof_execution_blocked_by_product_route_disabled_backend_required`.
Previous decision: `trackb_media_oss_product_beta_runtime_product_ready_proof_plan_passed_ready_for_bounded_live_product_runtime_proof_execution`.
Next prompt: `TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_PLAN`.
Track B totals: `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready`.

```json
{
  "ownerId": "TRACK_B_MEDIA_OSS_STEWARD",
  "decision": "trackb_media_oss_product_beta_runtime_product_ready_proof_execution_blocked_by_product_route_disabled_backend_required",
  "previousDecision": "trackb_media_oss_product_beta_runtime_product_ready_proof_plan_passed_ready_for_bounded_live_product_runtime_proof_execution",
  "reportDirectory": "docs/open-source-tool-stack/trackb-media-oss-product-beta-runtime-product-ready-proof-execution",
  "sourceSha": "a86351111aebe5625631a0911da49009cb3bfdfa",
  "sourceBranch": "codex/rp-github-merge-hygiene-open-pr-stack-audit",
  "sourcePr": 922,
  "sourceHead": "6e25817533edb1cdd6e19e4138ce15f9330587e9",
  "trackBTotals": {
    "owned": 16,
    "boundedAcceptedProven": 16,
    "blockedNotInstalledProven": 0,
    "productReady": 0
  },
  "productReadyCount": 0,
  "supabaseClassification": "no write / environment none / SQL none / migration no",
  "nextPrompt": "TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_PLAN",
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
      "selectedFirstTool": "ffprobe",
      "productRouteResult": "blocked_route_disabled_backend_required"
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
      "selectedFirstTool": "ffprobe",
      "productRouteResult": "blocked_route_disabled_backend_required"
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
      "selectedFirstTool": "sharp_libvips",
      "productRouteResult": "blocked_route_disabled_backend_required"
    },
    {
      "useCase": "ocr_text_extraction",
      "order": [
        "tesseract",
        "paddlepaddle",
        "paddleocr"
      ],
      "selectedFirstTool": "tesseract",
      "productRouteResult": "blocked_route_disabled_backend_required"
    },
    {
      "useCase": "high_risk_media_transform",
      "order": [
        "ffmpeg"
      ],
      "selectedFirstTool": "ffmpeg",
      "productRouteResult": "blocked_route_disabled_backend_required"
    }
  ],
  "rankingCanSelectCandidate": true,
  "productRouteCanDispatchSelectedCandidate": false,
  "blockedReason": "selected candidates remain blocked by disabled product route/worker dispatch gate"
}
```
