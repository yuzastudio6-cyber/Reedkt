# Track B Status Update

Decision: `trackb_media_oss_milestone4_color_image_pipeline_qa_passed_ready_for_trackb_final_rollup`

```json
{
  "generatedAt": "2026-06-24T00:00:00.000Z",
  "decision": "trackb_media_oss_milestone4_color_image_pipeline_qa_passed_ready_for_trackb_final_rollup",
  "ownerId": "TRACK_B_MEDIA_OSS_STEWARD",
  "sourceSha": "9a96e4ceb3d7bc0a05fdcea4b1c2527920e51c36",
  "sourceEvidenceSha": "957e8f96900e9a374a8cd7990f00e761222ebb64",
  "ownedTools": 16,
  "acceptedProvenBoundedBeforeQa": 14,
  "newlyAcceptedProvenBoundedInQa": 2,
  "acceptedProvenBoundedTotalAfterQa": 16,
  "stillBlockedNotInstalledProvenCount": 0,
  "acceptedProvenBoundedAfterQa": [
    {
      "id": "ffmpeg",
      "name": "FFmpeg",
      "version": "5.1.9-0+deb12u1",
      "proofBoundary": "tracka_container_version_only_no_media_processing"
    },
    {
      "id": "ffprobe",
      "name": "FFprobe",
      "version": "5.1.9-0+deb12u1",
      "proofBoundary": "tracka_container_version_only_no_media_file_probe"
    },
    {
      "id": "sharp_libvips",
      "name": "Sharp/libvips",
      "version": "0.34.5",
      "proofBoundary": "import_version_only_no_image_processing"
    },
    {
      "id": "duckdb",
      "name": "DuckDB",
      "version": "1.4.4",
      "proofBoundary": "native_rebuild_import_api_shape_in_memory_query"
    },
    {
      "id": "polars_nodejs_polars",
      "name": "Polars / nodejs-polars",
      "version": "0.25.1",
      "proofBoundary": "import_version_in_memory_dataframe_metadata"
    },
    {
      "id": "exiftool",
      "name": "ExifTool",
      "sourcePr": 557,
      "version": "12.57",
      "versionProven": true,
      "fixtureProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "proofBoundary": "container_version_and_synthetic_text_metadata_fixture_no_real_media_processing"
    },
    {
      "id": "mediainfo",
      "name": "MediaInfo",
      "sourcePr": 557,
      "version": "23.04",
      "versionProven": true,
      "fixtureProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "proofBoundary": "container_version_and_tiny_synthetic_wav_header_fixture_no_real_user_media"
    },
    {
      "id": "tesseract",
      "name": "Tesseract",
      "sourcePr": 559,
      "version": "5.3.0",
      "versionEvidenceSourcePr": 557,
      "versionProven": true,
      "fixtureProven": true,
      "acceptedVariant": "dejavu_sans_bold_large_psm7",
      "expectedNormalizedOutput": "REEDITPRO",
      "observedNormalizedOutput": "REEDITPRO",
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "proofBoundary": "container_version_from_pr557_and_exact_synthetic_ocr_fixture_from_pr559"
    },
    {
      "id": "imagemagick",
      "name": "ImageMagick",
      "sourcePr": 557,
      "followupFixtureSourcePr": 559,
      "version": "6.9.11-60",
      "versionProven": true,
      "fixtureProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "graphicsMagickCounted": false,
      "proofBoundary": "imagemagick_only_container_version_and_synthetic_fixture_no_graphicsmagick_default"
    },
    {
      "id": "opencv",
      "name": "OpenCV",
      "packageName": "opencv-python-headless",
      "sourcePr": 571,
      "importVersionProven": true,
      "syntheticFixtureProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "proofBoundary": "trackb_cpu_worker_container_import_version_and_synthetic_fixture_only_no_real_media_processing"
    },
    {
      "id": "pyav",
      "name": "PyAV",
      "packageName": "av",
      "sourcePr": 571,
      "importVersionProven": true,
      "syntheticFixtureProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "proofBoundary": "trackb_cpu_worker_container_import_version_and_synthetic_fixture_only_no_real_media_processing"
    },
    {
      "id": "pyscenedetect",
      "name": "PySceneDetect",
      "packageName": "scenedetect",
      "sourcePr": 571,
      "importVersionProven": true,
      "syntheticFixtureProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "proofBoundary": "trackb_cpu_worker_container_import_version_and_synthetic_fixture_only_no_real_media_processing"
    },
    {
      "id": "paddlepaddle",
      "name": "PaddlePaddle",
      "packageName": "paddlepaddle",
      "version": "3.0.0",
      "sourcePr": 635,
      "importVersionProven": true,
      "apiShapeOrTensorProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "cpuOnly": true,
      "gpuUsed": false,
      "ocrInferenceRun": false,
      "modelAssetsUsed": false,
      "fontAssetsUsed": false,
      "endToEndProductReady": false,
      "proofBoundary": "ocr_runtime_container_cpu_import_version_model_free_tensor_device_no_model_assets"
    },
    {
      "id": "paddleocr",
      "name": "PaddleOCR",
      "packageName": "paddleocr",
      "version": "3.0.0",
      "sourcePr": 635,
      "importVersionProven": true,
      "apiShapeOrTensorProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "cpuOnly": true,
      "gpuUsed": false,
      "ocrInferenceRun": false,
      "modelAssetsUsed": false,
      "fontAssetsUsed": false,
      "endToEndProductReady": false,
      "proofBoundary": "ocr_runtime_container_cpu_import_version_api_shape_local_noto_font_config_no_instantiation_no_inference_no_model_assets"
    },
    {
      "id": "opencolorio",
      "name": "OpenColorIO",
      "packageName": "OpenColorIO",
      "importName": "PyOpenColorIO",
      "version": "2.5.2",
      "sourcePr": 648,
      "requirementsPatched": true,
      "importVersionProven": true,
      "apiShapeProven": true,
      "rawConfigCreated": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "cpuOnly": true,
      "gpuUsed": false,
      "realMediaUsed": false,
      "imageProcessingRun": false,
      "endToEndProductReady": false,
      "proofBoundary": "cpu_worker_container_import_version_raw_config_api_shape_no_media_processing"
    },
    {
      "id": "openimageio",
      "name": "OpenImageIO",
      "packageName": "OpenImageIO",
      "importName": "OpenImageIO",
      "version": "3.1.14.1",
      "sourcePr": 648,
      "requirementsPatched": true,
      "importVersionProven": true,
      "apiShapeProven": true,
      "imageSpecImageBufApiShapeProven": true,
      "acceptedProvenBounded": true,
      "rerunInQaPhase": false,
      "cpuOnly": true,
      "gpuUsed": false,
      "realMediaUsed": false,
      "fileIoUsed": false,
      "imageProcessingRun": false,
      "endToEndProductReady": false,
      "proofBoundary": "cpu_worker_container_import_version_imagespec_imagebuf_api_shape_no_file_io_no_media_processing"
    }
  ],
  "stillBlockedNotInstalledProven": [],
  "endToEndProductReadyTools": 0,
  "fortyPlusEndToEndClaimAllowed": false,
  "nextPrompt": "TRACKB_MEDIA_OSS_FINAL_ROLLUP"
}
```
