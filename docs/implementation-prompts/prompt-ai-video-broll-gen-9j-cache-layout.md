# AI-VIDEO-BROLL-GEN-9J-CACHE-LAYOUT Private Wan Cache Layout Reconciliation Prompt

Goal: reconcile the private Wan 1.3B cache layout for the approved fail-closed private L4 proof runner. This is no VM/no inference. Do not create a VM, install dependencies on a cloud machine, transfer model weights, import the model, instantiate a pipeline, run inference, create generated frames, create generated video, run FFmpeg, mutate Google Cloud, touch Supabase, call providers, dispatch workers, or claim beta/production readiness.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-result.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`

Required decision:

- either approve an adapter for the current original Wan runtime-essential cache layout; or
- approve a private Diffusers-format cache conversion/download plan for the exact Wan 1.3B revision.

The prompt must keep all public URLs, signed URLs, provider APIs, Supabase, SQL, worker dispatch, user media, generated media, beta, and production paths blocked. If a Diffusers-format cache lane is selected, it must record source, revision, checksum plan, private outside-repo path, and no network runtime fetch before any later VM retry.

Expected next prompt if cache layout is reconciled:

`AI-VIDEO-BROLL-GEN-9J-RETRY-2: controlled L4 private proof with approved runner, bounded VM/non-user fixture`
