# Phase 46B Media/Data Runtime Policy

Phase 46B uses isolated temporary runtimes for generated fixtures:

- Python venv under OS temp storage.
- Node npm prefix under OS temp storage for Sharp.
- No global Python or global Node package mutation.
- No committed venv, npm prefix, cache, generated video, or generated image.

Pinned packages:

- `opencv-python-headless==4.13.0.92`
- `av==15.1.0`
- `scenedetect==0.6.7.1`
- `duckdb==1.4.4`
- `polars==1.36.1`
- `sharp==0.34.5`
