# AI-VIDEO-BROLL-GEN-9J Controlled L4 Private Proof Prompt

Goal: run the controlled L4 private proof only if every final preflight from AI-VIDEO-BROLL-GEN-9I passes. This is the first future gate that may create a bounded private VM and run the non-user-media Wan 1.3B proof. It must remain private, capped, synthetic, and cleanup-verified.

Use Gate 9I as source of truth:

- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md`
- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval-change-log.md`
- `docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md`
- `docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md`
- `docs/activation-gcp-staging-command-policy.md`

Allowed only if final preflight passes:

- create one private `g2-standard-4` VM with one NVIDIA L4 in `us-central1-b`, or fallback to an approved same-region zone from the 9I packet;
- transfer the already-downloaded private Wan 1.3B cache to the VM by approved private path only;
- verify checksums before inference;
- run only the non-user-media Gate 8 synthetic tabletop fixture proof;
- collect sanitized proof metadata, runtime, cost, and cleanup evidence;
- delete proof output and VM-local cache;
- delete the VM created by that prompt and verify cleanup.

Forbidden even in that future prompt:

- public endpoint, public IP, public bucket, signed URL, public artifact, or storage upload;
- Supabase mutation or SQL;
- provider call;
- worker dispatch;
- user media or customer data;
- beta or production unlock;
- credit estimate, approval, reservation, spend, refund, or release;
- any model other than `Wan-AI/Wan2.1-T2V-1.3B` revision `37ec512624d61f7aa208f7ea8140a131f93afc9a`;
- any claim of `dry_run_passed` or `generated_local_fixture_passed`.

Stop before execution if:

- the repo is dirty;
- the selected project/zone/quota/price/cache/fixture differs from 9I;
- final total cost cannot be bounded under the approved cap;
- cleanup cannot be guaranteed;
- any secret, credential, public URL, signed URL, provider key, user media, or production/staging data appears in scope.

Exit decision if successful:

`ai_video_broll_gen_9j_controlled_l4_private_proof_completed_ready_for_result_review`
