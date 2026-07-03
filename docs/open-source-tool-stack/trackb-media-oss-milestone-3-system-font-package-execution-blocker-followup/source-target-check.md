# Source Target Check

The OCR runtime target remains `docker/prod/ocr-runtime/Dockerfile` with `docker/prod/ocr-runtime/requirements.ocr.txt`.

The Dockerfile already preserves `libgomp1 libgl1 libglib2.0-0` and includes `fonts-noto-cjk`. No Dockerfile patch, requirements change, lockfile change, or generated build context was needed in this follow-up. `fonts-noto-cjk-extra` remains fallback-only and absent from the source target.
