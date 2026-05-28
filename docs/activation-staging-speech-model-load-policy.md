# Staging Speech Model Load Policy

The Phase 27A worker must load model files only from:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/`

The model is copied to:

`/tmp/reeditpro-model-weights/faster-whisper/tiny`

Required verification:

- `file_checksums_sha256.txt` must exist in the private GCS prefix.
- Each listed file must match its SHA-256.
- The aggregate checksum must equal
  `331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5`.
- `HF_HUB_OFFLINE=1` and `MODEL_DOWNLOADS_ENABLED=false` must be set.

The source-media bucket, signed URLs, public buckets, and Hugging Face runtime
downloads are not allowed as model sources.
