# Phase 46C Controlled Real-Video Media/Data Suite

Phase 46C runs the Track B media/data tool family on one approved private
controlled real-video sample after Phase 46B generated fixtures passed.

Approved sample:

- Sample id: `phase37d-phase32-color-export-safe-zone-window-v1`
- Chain id: `controlled-real-video-chain-phase28-through-phase32-v1`
- Source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- SHA-256: `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa`
- Window: `6.9s` to `8.9s`
- Offsets: `6.9, 7.3, 7.7, 8.1, 8.5, 8.9`

The suite uses PyAV, OpenCV, PySceneDetect, Sharp/libvips, DuckDB, and Polars
through isolated temporary runtime installs. It does not change repo
dependencies or `package-lock.json`.

The suite does not accept arbitrary media paths, process broad user media, run
OCR/VLM, call providers, run Docker/Cloud Run/Cloud Build, mutate IAM, unlock
beta/production, create public output, or touch Track A.
