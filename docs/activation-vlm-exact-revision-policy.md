# VLM Exact Revision Policy

Qwen3-VL model assets must use an immutable Hugging Face commit SHA as the asset identity. Floating branches such as `main` are not sufficient for download, checksum, private staging, or future runtime handoff evidence.

For Phase 39B, the approved model id is `Qwen/Qwen3-VL-8B-Instruct` and the expected revision is `0c351dd01ed87e9c1b53cbc748cba10e6187ff3b`. The workflow revalidates current Hugging Face API metadata with `blobs=true` before download. If the model id, revision, file list, license tag, disabled/gated status, or selected sizes differ from the approved shape, the workflow must block instead of partially staging files.

The exact revision manifest may be committed because it contains safe metadata only: file names, sizes, source URLs, tags, blob/LFS metadata, blockers, warnings, and source references. It must not contain credentials, signed URLs, model bytes, cache paths, or provider responses.
