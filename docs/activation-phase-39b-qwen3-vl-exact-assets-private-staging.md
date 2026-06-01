# Phase 39B Qwen3-VL Exact Asset Private Staging

Status: `private_staging_verified`

Phase 39B is the Track B exact asset selection, checksum, and private GCS staging workflow for `Qwen/Qwen3-VL-8B-Instruct`. It stacks on Phase 39A approval evidence and may download only the approved pinned Hugging Face revision assets when the current shell sets both guarded confirmations.

Verified run: `phase39b-20260531T025648`

Aggregate SHA-256: `3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908`

Uploaded objects verified: `29`

## Approved Candidate

- Model id: `Qwen/Qwen3-VL-8B-Instruct`
- Pinned revision: `0c351dd01ed87e9c1b53cbc748cba10e6187ff3b`
- Selected files: 15
- Selected size: `17,545,914,364` bytes
- Private target: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/`

Selected files are `README.md`, `chat_template.json`, `config.json`, `generation_config.json`, `merges.txt`, four safetensors shards, `model.safetensors.index.json`, `preprocessor_config.json`, `tokenizer.json`, `tokenizer_config.json`, `video_preprocessor_config.json`, and `vocab.json`. `.gitattributes`, demos, examples, notebooks, alternate repos, adapters, images, quantized variants, and unrelated metadata are excluded.

## Execution

Safe plan/report/smoke commands do not download assets or mutate GCS:

```bash
npm run smoke:activation-vlm-model-download
npm run activation:vlm-model-download:plan
npm run activation:vlm-model-download:report
npm run activation:vlm-model-download:iam-plan
```

The guarded execution path requires current-shell VLM download and private GCS upload confirmations only. Set them in the same shell invocation as the execution command; do not persist or commit them:

```bash
npm run activation:vlm-model-download -- --execute --keep-temp
```

The runner streams files from Hugging Face `/resolve/<revision>/<file>` URLs, computes SHA256 while writing to `/tmp/reeditpro/activation/phase39b/qwen3-vl-8b-instruct/<run-id>/downloads/`, writes safe manifests, uploads verified files/manifests to the private prefix, and verifies every uploaded object by GCS metadata.

## Blocked Scope

Phase 39B does not run vLLM, Transformers inference, SGLang, GPU jobs, provider APIs, image/video/media processing, Docker, Cloud Run, IAM mutation, beta, production, public output, broad media, arbitrary media, or Track A code.

Phase 39C is now ready only for generated VLM runtime verification using the private staged assets. VLM runtime remains blocked until Phase 39C; controlled real-frame VLM remains blocked until Phase 39D; VLM planning integration remains blocked until Phase 39E.
