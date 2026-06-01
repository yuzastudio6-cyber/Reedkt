# Phase 39C-SG SGLang Runtime Policy

The SGLang runtime is a dedicated staging-only Cloud Run Job path.

Runtime requirements:

- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-sglang:<run-id-or-commit>`
- Job: `reeditpro-stg-vlm-runtime-phase39c-sglang`
- Region: `us-central1`
- GPU: `1 x nvidia-l4`
- CPU/memory: `8 CPU`, `32Gi`
- Service account: `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- Task count and parallelism: `1`
- No public service endpoint.

Runtime must:

- Copy exact candidate files from PR #87 private GCS manifests.
- Verify per-file SHA-256 and aggregate hash.
- Prepare an ephemeral local model directory.
- Start SGLang with the verified local model path only.
- Run generated synthetic fixtures only.
- Upload private JSON QA artifacts only.

Runtime must fail closed on:

- Missing checksum evidence.
- Any model-id runtime path.
- Any runtime auto-download attempt.
- Any provider or external OpenAI-compatible request.
- Any real media, arbitrary media, public path, or signed URL.
- Any production/beta/Track A unlock.
