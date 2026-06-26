# AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2 Controlled L4 Private Proof VM Preflight Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2: prepare controlled L4 private proof VM preflight, no inference`

Goal: prepare the next controlled Google Cloud L4 private proof preflight using the validated private Diffusers cache and fail-closed runner envelope. This prompt is preflight-only and must not run inference.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-download-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Approved private cache:

```text
/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b
```

Preflight requirements:

- re-check Google Cloud project identity and target zone;
- re-check L4 quota, current GPU usage, and selected cost-friendly `g2-standard-4` / `nvidia-l4` shape;
- re-check service account, firewall, IAP SSH, disk, and cleanup plan;
- re-check transfer plan from private local cache to `/tmp/reeditpro-private-model-cache` on the proof VM;
- re-check dependency install plan from the approved requirements file only;
- re-check output and evidence paths under `/tmp/reeditpro-private-proof-output`;
- re-check that the runner will first execute `--validate-only`;
- do not pass `--allow-approved-local-proof-execution` unless a later explicit execution prompt authorizes it;
- do not import `torch`, `diffusers`, or `transformers`;
- do not call `from_pretrained`;
- do not run inference;
- do not create generated frames or video.

Expected next prompt if VM preflight passes:

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE: create controlled L4 private proof VM and transfer validated cache, no inference`
