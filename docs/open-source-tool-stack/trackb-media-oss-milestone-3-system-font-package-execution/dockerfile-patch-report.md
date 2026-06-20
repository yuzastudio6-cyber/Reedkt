# Dockerfile Patch Report

Only `docker/prod/ocr-runtime/Dockerfile` was patched.
`fonts-noto-cjk` was added to the existing apt layer while preserving `libgomp1 libgl1 libglib2.0-0`.
`fonts-noto-cjk-extra` was not added; exact PingFang was not used.
`requirements.ocr.txt`, `package-lock.json`, `.dockerignore`, and other Dockerfiles were not changed.
