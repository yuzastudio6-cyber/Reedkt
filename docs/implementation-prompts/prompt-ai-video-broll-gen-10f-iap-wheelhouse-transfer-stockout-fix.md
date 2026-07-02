# AI-VIDEO-BROLL-GEN-10F-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof capacity strategy after the cleanup-verified `us-east1-d` stockout. This prompt is read-only and no-VM.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10F-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-d stockout, no VM/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.md`
- `docs/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md`
- `docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

Review the stockout chain, current quota, private cache readiness, private wheelhouse readiness, and no-idle GPU constraints. Decide the next safe capacity strategy for the B-roll/Wan transfer proof without creating a VM, reservation, Docker path, Cloud Run path, or generated asset.

The immediate strategy must preserve the user's run-when-used and stop-when-idle GPU requirement. Any future GPU execution must remain bounded, no-public-IP, cleanup-verified, and prompt-scoped.

## Required Read-Only Checks

- active project is `reeditpro`;
- auth refresh passes with token stdout suppressed;
- required services are enabled;
- no matching proof VM, disk, static address, or reservation exists;
- project `GPUS_ALL_REGIONS` quota remains visible;
- candidate regional L4 quota remains visible;
- private model cache stat-only readiness still passes;
- private Python 3.12 wheelhouse manifest remains present and complete;
- proof service account and IAP firewall path remain present without storing secret values;
- historical stockout zones are classified without reusing them blindly.

## Strategy Options To Evaluate

- another same-provider L4 zone only if it is visible, quota-compatible, and not already in the recent cleanup-verified stockout chain;
- a delayed no-idle retry only if every remaining visible target is exhausted or unsafe;
- a separate scale-to-zero architecture track only as future design work, not as immediate proof execution;
- capacity reservation only as rejected unless the user explicitly accepts potentially billable idle capacity in a future approval prompt;
- always-on GPU only as rejected because it violates run-when-used/stop-when-idle.

## Forbidden Actions

Do not create a VM. Do not create or modify a capacity reservation. Do not create a public IP. Do not mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, images, Artifact Registry, Cloud Run, or quota requests. Do not run Docker. Do not install dependencies. Do not clone repositories. Do not import models. Do not run inference. Do not create generated frames, generated video, generated assets, storage objects, signed URLs, Supabase rows, SQL mutations, credit records, beta unlocks, or production unlocks. Do not claim `dry_run_passed` or `generated_local_fixture_passed`.

## Required Output

Produce:

- a sanitized no-VM stockout-fix result doc;
- a deterministic mock/spec result;
- a smoke validating the selected strategy and fail-closed runtime gates;
- updates to external-agent B-roll wrappers/gates/rollups so agents block until the selected next prompt;
- the exact next prompt, which must be either a bounded no-idle transfer proof prompt, a delayed retry plan, or a scale-to-zero architecture planning prompt.
