# VLM Private GCS Storage Policy

Phase 39B stores approved Qwen3-VL assets only under:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/<revision>/`

The target bucket must be private, use uniform bucket-level access, and enforce public access prevention. Phase 39B may upload only the selected model/tokenizer/processor/config/source-evidence files and safe JSON/text manifests. It must not upload temp caches, logs containing credentials, signed URLs, media, screenshots, arbitrary files, or public artifacts.

IAM changes are not part of Phase 39B. Future Phase 39C may request read access for a runtime service account only after private staged assets and checksums are verified.
