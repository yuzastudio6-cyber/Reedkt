# Source Target Check

Target Dockerfile: `docker/prod/ocr-runtime/Dockerfile`.
Target requirements file: `docker/prod/ocr-runtime/requirements.ocr.txt`.
The OCR runtime uses `python:3.12-slim` and an apt package layer.
Generated build context is not required because the Dockerfile copies committed OCR runtime paths.
Package-lock and requirements files remained unchanged.
