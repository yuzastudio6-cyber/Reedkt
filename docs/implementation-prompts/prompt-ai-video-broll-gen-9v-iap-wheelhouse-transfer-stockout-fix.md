# AI-VIDEO-BROLL-GEN-9V-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof capacity strategy after `us-west1-c` stocked out before VM creation.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9V-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west1-c stockout, no VM/no inference`.

This prompt is read-only and no-VM. It may inspect existing repo evidence, private cache and wheelhouse metadata, and read-only Google Cloud region/zone/quota visibility. It must not create a VM, reservation, firewall, service account, bucket, image, Docker container, Cloud Run job, storage object, signed URL, generated video, generated asset, provider call, worker dispatch, Supabase row, SQL mutation, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Required Source Evidence

- `docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md`
- `docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md`
- `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Required Analysis

- Summarize every cleanup-verified stockout across `us-central1`, `us-west1`, and any other attempted transfer-proof zones.
- Re-read current quota, machine type, accelerator, zone status, IAP path, service, and proof-resource absence without mutating Cloud state.
- Compare available cross-region fallback zones already identified by 9T, including `us-east4`, `us-east1`, and `us-west4`.
- Decide whether the next safe path should be:
  - one more bounded no-idle cross-region transfer proof attempt;
  - a delayed retry plan;
  - a non-idle capacity reservation proposal that remains blocked until the user explicitly accepts billable capacity;
  - a Cloud Run or queued job scale-to-zero strategy proposal that still does not run providers, workers, Docker, model import, or inference;
  - or a blocked report if no safe no-idle target remains.

## Guardrails

The selected next path must preserve:

- no idle GPU;
- no public IP;
- at most one VM create attempt in any later execution prompt;
- prompt-scoped resources only;
- mandatory cleanup and absence verification;
- no dependency install until a later prompt explicitly authorizes install after transfer validation;
- no Wan/Wan2.1 import;
- no model load;
- no model inference;
- no generated frames, generated video, or generated assets;
- no Supabase, SQL, storage object, signed URL, public artifact, or credit mutation;
- no beta or production unlock.

## Required Result

Record the selected capacity strategy and the next exact prompt. If selecting a cross-region retry, the result must include the chosen region and zone and require fresh preflight before any VM create. If selecting a non-VM strategy, the result must explicitly state why no VM should be attempted next.
