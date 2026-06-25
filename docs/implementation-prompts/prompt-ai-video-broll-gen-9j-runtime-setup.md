# AI-VIDEO-BROLL-GEN-9J-RUNTIME-SETUP Private L4 Proof Runner Dependency Path Approval Prompt

Goal: approve a concrete, private, no-public-endpoint proof runner and dependency setup path for the Wan 1.3B L4 tabletop proof. This is approval/planning only and remains no VM/no inference. Do not create a VM, run inference, install dependencies on a cloud machine, transfer model weights, create generated video, or mutate Google Cloud.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md`
- `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md`
- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md`
- `docs/ai-video-broll-generation-controlled-dependency-install-result.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-result.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `product-plan.md`
- `intent-led-edit-planning.md`
- `model-routing-policy.md`
- `open-source-tool-registry.md`
- `render-strategy-planner.md`
- `docs/activation-gcp-staging-command-policy.md`

Required output:

- approve or reject an exact proof runner path that replaces `AI_VIDEO_BROLL_PROOF_RUNNER_PLACEHOLDER`;
- define whether the runner is a committed script, a temporary VM-local script generated from committed text, or a prebuilt private image path;
- define the dependency setup boundary, including whether any future VM step may install from `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`;
- define offline-only cache usage for `Wan-AI/Wan2.1-T2V-1.3B` revision `37ec512624d61f7aa208f7ea8140a131f93afc9a`;
- define sanitized evidence capture, output deletion, cache deletion, and VM cleanup expectations;
- reconcile the private cache aggregate byte total before transfer-cost evidence;
- keep the proof limited to the Gate 8 non-user-media tabletop fixture;
- keep all public IP, public bucket, signed URL, public artifact, provider, worker, Supabase, SQL, credit, beta, and production paths blocked.

Forbidden in this prompt:

- VM creation;
- disk creation;
- network, firewall, service account, IAM, key, bucket, Artifact Registry, reservation, or Cloud Run mutation;
- dependency installation;
- model import;
- pipeline instantiation;
- text encoding, denoising, scheduler, VAE encode/decode, or model inference;
- generated frames or generated video;
- media processing or FFmpeg;
- Supabase command or SQL;
- provider call;
- worker dispatch;
- storage upload;
- signed URL;
- public artifact;
- credit estimate, approval, reservation, spend, refund, or release;
- beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim.

Expected next prompt if approved:

`AI-VIDEO-BROLL-GEN-9J-RETRY-2: controlled L4 private proof with approved runner, bounded VM/non-user fixture`
