# AI-VIDEO-BROLL-GEN-10K-PAYLOAD-INSTALL-STOCKOUT-FIX

Choose the next approved no-idle L4 payload/install-readiness proof capacity strategy after the `us-west4-c` 10J stockout. This prompt is read-only and no-VM.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10K-PAYLOAD-INSTALL-STOCKOUT-FIX: choose next approved no-idle L4 payload/install-readiness proof capacity strategy after us-west4-c stockout, no VM/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md`
- `docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md`
- `docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`

## Scope

Run read-only Google Cloud and local cache/wheelhouse checks to choose the next capacity strategy for a future bounded no-idle payload/install-readiness proof. Do not create a VM, disk, static address, reservation, firewall rule, service account, bucket, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

The user posture remains run-when-used and stop-when-idle. Capacity reservations, always-on GPU, public IPs, and ad hoc retries remain rejected unless a later prompt explicitly changes the strategy with evidence.

## Required Read-Only Checks

- active project and auth refresh;
- current quota for `GPUS_ALL_REGIONS`;
- regional L4 quota for candidate regions;
- visible `g2-standard-4` and `nvidia_l4` surfaces in candidate zones;
- proof service account presence without recording its value;
- IAP firewall or approved equivalent no-public-IP path;
- absence of matching proof VM, disk, static address, and reservation;
- private model cache stat-only readiness;
- private Python 3.12 wheelhouse manifest presence, wheel count, byte count, and aggregate SHA-256.

## Required Output

Produce a sanitized no-VM result doc/spec/smoke that selects exactly one next prompt or records that no safe next capacity strategy is available. The output must keep B-roll blocked before full wheelhouse payload transfer, offline dependency install readiness, model import, model inference, generated assets, beta, and production.
