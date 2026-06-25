# AI-VIDEO-BROLL-GEN-9J-RETRY Controlled L4 Private Proof With Proof Identity Prompt

Goal: retry the controlled L4 private proof using the proof-only service account and no-public-IP private admin firewall created by AI-VIDEO-BROLL-GEN-9J-FIX-SETUP. This is the next gate that may create exactly one private VM and run the non-user-media Wan 1.3B tabletop proof only if every final preflight still passes.

Use Gate 9J-FIX-SETUP as source of truth:

- `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- `docs/ai-video-broll-generation-gcp-proof-identity-setup-change-log.md`
- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`

Allowed only if final preflight passes:

- create one private `g2-standard-4` VM with one NVIDIA L4 in `us-central1-b`, or approved same-region fallback;
- attach proof service account ID `reeditpro-ai-broll-proof-sa`;
- apply target tag `ai-video-broll-wan-l4-proof`;
- use no public IP;
- transfer the already-downloaded private Wan 1.3B cache by private path only;
- verify checksums before inference;
- run only the non-user-media tabletop fixture;
- collect sanitized proof metadata;
- delete proof output and VM-local cache;
- delete the VM created by that prompt and verify cleanup.

Forbidden even in that future prompt:

- public endpoint, public IP, public bucket, signed URL, public artifact, or storage upload;
- service-account keys, raw credentials, provider keys, or secret values;
- Supabase mutation or SQL;
- provider call;
- worker dispatch;
- user media or customer data;
- beta or production unlock;
- credit estimate, approval, reservation, spend, refund, or release;
- any model other than `Wan-AI/Wan2.1-T2V-1.3B` revision `37ec512624d61f7aa208f7ea8140a131f93afc9a`;
- any claim of `dry_run_passed` or `generated_local_fixture_passed`.

Stop before VM creation if:

- repo is dirty;
- proof service account ID is missing, disabled, or has roles beyond logging and monitoring;
- IAP-source firewall rule is missing, disabled, broad, or not scoped to tag `ai-video-broll-wan-l4-proof`;
- selected project/zone/quota/price/cache/fixture differs from 9I/9J-FIX-SETUP;
- final total cost cannot be bounded under cap;
- cleanup cannot be guaranteed;
- any secret, credential, public URL, signed URL, provider key, user media, or production/staging data appears in scope.

Exit decision if successful:

`ai_video_broll_gen_9j_retry_controlled_l4_private_proof_completed_ready_for_result_review`
