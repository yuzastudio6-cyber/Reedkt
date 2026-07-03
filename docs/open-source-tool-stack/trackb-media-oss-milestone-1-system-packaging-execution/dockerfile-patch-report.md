# Dockerfile Patch Report

Target: `docker/prod/cpu-worker/Dockerfile`

Approved packages added: `libimage-exiftool-perl`, `mediainfo`, `tesseract-ocr`, `tesseract-ocr-eng`, `imagemagick`.

GraphicsMagick remains optional fallback and is not installed by default.
