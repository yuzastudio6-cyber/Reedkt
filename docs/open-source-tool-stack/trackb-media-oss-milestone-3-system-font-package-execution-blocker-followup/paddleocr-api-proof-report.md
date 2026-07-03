# PaddleOCR API Proof Report

PaddleOCR distribution metadata was available as version `3.0.0`, but importing `paddleocr` attempted to fetch `PingFang-SC-Regular.ttf` from PaddleX font assets under `--network none`.

The command failed with a network-disabled name-resolution error for the PaddleX font URL. No OCR object was instantiated, no OCR inference ran, and no font/model asset was downloaded, copied, uploaded, or staged.
