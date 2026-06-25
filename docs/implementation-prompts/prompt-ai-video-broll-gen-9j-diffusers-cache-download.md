# AI-VIDEO-BROLL-GEN-9J-DIFFUSERS-CACHE-DOWNLOAD Private Diffusers Cache Download Prompt

Goal: download the approved runtime-essential Diffusers-format Wan 1.3B cache into the private outside-repo model cache. This is no VM/no inference. Do not create a VM, install cloud dependencies, import the model, instantiate a pipeline, run inference, create generated frames, create generated video, run FFmpeg, mutate Google Cloud, touch Supabase, call providers, dispatch workers, or claim beta/production readiness.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Approved source:

```text
Wan-AI/Wan2.1-T2V-1.3B-Diffusers
commit 0fad780a534b6463e45facd96134c9f345acfa5b
```

Approved target:

```text
/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b
```

Download only the runtime-essential files listed in `docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md`. Do not download `assets/*`, `examples/*`, repository screenshots, demos, or generated media.

Required proof:

- pin the exact source commit;
- download to the approved private outside-repo cache path only;
- compute SHA-256 for every downloaded file;
- record byte size for every downloaded file;
- verify `model_index.json` class is `WanPipeline`;
- verify transformer/text encoder index files reference local shards only;
- remove AppleDouble sidecars from the private cache;
- do not import `torch`, `diffusers`, or `transformers`;
- do not call `from_pretrained`;
- do not run the runner;
- do not create generated frames or video;
- do not upload or expose files.

Expected next prompt if the private Diffusers cache proof passes:

`AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE: validate Diffusers cache with fail-closed runner envelope, no VM/no inference`
