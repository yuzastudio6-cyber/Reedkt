# AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE Fail-Closed Cache Validation Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE: validate Diffusers cache with fail-closed runner envelope, no VM/no inference`

Goal: validate the private Diffusers-format Wan cache with the committed fail-closed runner envelope, without creating a VM and without inference.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-download-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`

Approved private cache:

```text
/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b
```

The validation gate may inspect files, recompute hashes, and run the runner only in `--validate-only` mode with safe local temp paths if the prompt explicitly allows that. It must not pass `--allow-approved-local-proof-execution`.

Required checks:

- verify all 19 runtime-essential files exist;
- recompute SHA-256 for every file and match `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`;
- verify `model_index.json` class is `WanPipeline`;
- verify text encoder and transformer index shards are local and present;
- verify no `.part`, `._*`, `assets/*`, `examples/*`, demos, screenshots, or generated media are in the private cache;
- verify the runner classifies the cache as Diffusers layout without model imports;
- verify the runner refuses execution without the future execution flag;
- do not import `torch`, `diffusers`, or `transformers`;
- do not call `from_pretrained`;
- do not run inference;
- do not create generated frames or video.

Expected next prompt if cache validation passes:

`AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2: prepare controlled L4 private proof VM preflight, no inference`
