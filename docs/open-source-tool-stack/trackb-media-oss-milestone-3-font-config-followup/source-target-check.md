# Source Target Check

OCR runtime target remains `docker/prod/ocr-runtime/Dockerfile` plus `docker/prod/ocr-runtime/requirements.ocr.txt`.
`fonts-noto-cjk` is present; `fonts-noto-cjk-extra` is not present.
The only OCR runtime Dockerfile change is the supported `PADDLE_PDX_LOCAL_FONT_FILE_PATH` env var.
