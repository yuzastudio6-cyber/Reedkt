# Phase 36H DeepFilter Binary Verification

The Phase 36H Linux job verifies the approved DeepFilterNet artifacts before any generated or controlled audio execution:

- `deep-filter-0.5.6-x86_64-unknown-linux-musl`
- `DeepFilterNet3_onnx.tar.gz`
- `model_tree_manifest.json`

The job records checksum status, `deep-filter --version`, `deep-filter --help`, ffmpeg/ffprobe versions, and linux/amd64 platform evidence in safe JSON reports. Token output, credential file contents, media payloads, raw audio, enhanced audio, and private transcripts are never committed.
