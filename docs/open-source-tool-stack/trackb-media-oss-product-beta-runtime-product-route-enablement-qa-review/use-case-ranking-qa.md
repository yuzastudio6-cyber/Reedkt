# use-case-ranking-qa

```json
{
  "schema": "reeditpro.trackbMediaOss.productRouteEnablementQaReview.v1",
  "ownerId": "TRACK_B_MEDIA_OSS_STEWARD",
  "decision": "trackb_media_oss_product_beta_runtime_product_route_enablement_qa_passed_ready_for_product_route_enablement_closeout",
  "previousDecision": "trackb_media_oss_product_beta_runtime_product_route_enablement_execution_passed_ready_for_product_route_enablement_qa_review",
  "nextPrompt": "TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_CLOSEOUT",
  "sourcePr": 939,
  "sourceSha": "cf355808b4f6f75cd96d84bffda2ae3f088ce0d1",
  "sourceHead": "93dfe24b68ce4f601fbf7228cfae531f179714d9",
  "trackBTotals": {
    "owned": 16,
    "boundedAcceptedProven": 16,
    "blockedNotInstalledProven": 0,
    "productReady": 0
  },
  "productReadyCount": 0,
  "supabaseClassification": "no write / environment none / SQL none / migration no",
  "report": "use-case-ranking-qa",
  "coveredToolCount": 16,
  "deterministicRankingAccepted": true,
  "useCaseRanking": {
    "metadata_probe": [
      "ffprobe",
      "mediainfo",
      "exiftool",
      "duckdb",
      "polars_nodejs_polars"
    ],
    "video_analysis": [
      "ffprobe",
      "mediainfo",
      "pyav",
      "opencv",
      "pyscenedetect"
    ],
    "image_color_pipeline": [
      "sharp_libvips",
      "opencolorio",
      "openimageio",
      "imagemagick",
      "opencv"
    ],
    "ocr_text_extraction": [
      "tesseract",
      "paddlepaddle",
      "paddleocr"
    ],
    "high_risk_media_transform": [
      "ffmpeg"
    ]
  },
  "selectedFirstCandidates": {
    "metadata_probe": "ffprobe",
    "video_analysis": "ffprobe",
    "image_color_pipeline": "sharp_libvips",
    "ocr_text_extraction": "tesseract",
    "high_risk_media_transform": "ffmpeg"
  },
  "allRankingEntriesExecutionDisabled": true,
  "productRouteCanDispatchSelectedCandidate": false,
  "rankingReadyForCloseout": true
}
```
