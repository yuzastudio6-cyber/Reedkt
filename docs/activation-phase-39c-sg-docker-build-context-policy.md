# Phase 39C-SG Docker Build Context Policy

The SGLang image uses repo root as Docker context because the Dockerfile copies worker files from `server/workers/vlm-sglang-runtime`.

The root `.dockerignore` and Dockerfile-specific ignore file must exclude:

- model weights and model snapshots
- Hugging Face caches
- Python virtualenvs and caches
- Node dependencies
- generated QA artifacts
- media files
- logs
- `.env` files
- secret or credential-named files

The smoke test validates the build-context guard before Cloud Build or runtime execution can be considered safe.
