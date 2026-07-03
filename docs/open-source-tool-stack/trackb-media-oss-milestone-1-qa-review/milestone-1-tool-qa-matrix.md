# Milestone 1 Tool QA Matrix

| Tool | Source PR | Accepted bounded proof | Boundary |
| --- | ---: | --- | --- |
| ExifTool | #557 | true | container_version_and_synthetic_text_metadata_fixture_no_real_media_processing |
| MediaInfo | #557 | true | container_version_and_tiny_synthetic_wav_header_fixture_no_real_user_media |
| Tesseract | #559 | true | container_version_from_pr557_and_exact_synthetic_ocr_fixture_from_pr559 |
| ImageMagick | #557 | true | imagemagick_only_container_version_and_synthetic_fixture_no_graphicsmagick_default |

GraphicsMagick remains optional fallback only and is not counted as accepted/proven.
