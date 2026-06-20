# OCR Runtime Target Review

The future execution target is `docker/prod/ocr-runtime/Dockerfile`, preserving the existing OCR runtime library patches `libgomp1`, `libgl1`, and `libglib2.0-0`.

The approved future patch scope is limited to adding `fonts-noto-cjk` to the OCR runtime apt install list. This approval phase does not mutate Dockerfiles, requirements, lockfiles, `.dockerignore`, worker code, providers, or runtime behavior.
