# Tool Call Use Case Ranking Closeout

Ranking policy: `least_risky_matching_tool_first_with_metadata_and_probe_routes_before_heavier_analysis_or_transform_routes`.
Global dry-run order: `ffprobe -> mediainfo -> exiftool -> duckdb -> polars_nodejs_polars -> sharp_libvips -> opencolorio -> openimageio -> imagemagick -> opencv -> pyav -> pyscenedetect -> tesseract -> paddlepaddle -> paddleocr -> ffmpeg`.
Metadata analysis order: `ffprobe -> mediainfo -> exiftool -> duckdb -> polars_nodejs_polars`.
Video analysis order: `ffprobe -> mediainfo -> pyav -> opencv -> pyscenedetect`.
Image/color order: `sharp_libvips -> opencolorio -> openimageio -> imagemagick -> opencv`.
OCR order: `tesseract -> paddlepaddle -> paddleocr`.
`ffmpeg` remains the deferred high-risk transform tool until separate product beta runtime approval.
All ranking entries remain dry-run/source-truth routing metadata only with execution disabled.
