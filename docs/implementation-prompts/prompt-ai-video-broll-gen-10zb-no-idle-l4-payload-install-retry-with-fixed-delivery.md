# AI-VIDEO-BROLL-GEN-10ZB No-Idle L4 Payload Install Retry With Fixed Delivery

## Summary

Run one bounded no-idle L4 payload/install readiness retry after AI-VIDEO-BROLL-GEN-10ZA selected the fixed payload delivery strategy. This future prompt may create at most one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `northamerica-northeast2-a`, only after all local pre-VM payload packaging and live preflight checks pass.

This prompt must keep model import and model inference blocked. It must not create generated video, generated assets, public artifacts, signed URLs, Supabase rows, SQL mutations, provider calls, worker dispatch, credit mutations, beta unlocks, production unlocks, or `generated_local_fixture_passed` claims.

## Required Inputs

- `docs/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result.md`
- `src/backend/mock/mock-ai-video-broll-gen-10za-payload-delivery-timeout-fix-result.ts`
- `server/smoke/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result-smoke.ts`
- `docs/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.md`
- `server/cli/ai-video-broll-gen-10z-l4-payload-install-runner.ts`
- `server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts`
- `src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts`
- `server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts`
- `server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts`
- `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`

## Required Pre-VM Local Packaging

Before any VM creation:

1. Verify the private wheelhouse `SHA256SUMS.json`.
2. Verify the requirements manifest.
3. Create a deterministic local `tar.gz` archive of the private wheelhouse.
4. Create an archive sha256 file.
5. Split the archive into bounded chunks.
6. Create a chunk manifest with each chunk path, byte size, and sha256.
7. Write a durable pre-VM summary.
8. Stop without VM creation if any package artifact is missing or invalid.

The local archive and chunks are ephemeral validation inputs. Do not commit them.

## Required Runtime Flow

If preflight passes:

1. Create exactly one prompt-scoped no-public-IP L4 VM.
2. Verify `RUNNING`, private-only networking, and boot-disk autodelete from raw compact JSON.
3. Wait for IAP lookup readiness with bounded backoff.
4. Verify Python 3.12.
5. Transfer the requirements manifest.
6. Transfer archive chunks sequentially over IAP with per-chunk checkpoints.
7. Reassemble the archive remotely.
8. Verify the remote archive sha256.
9. Extract the archive remotely.
10. Validate the original wheelhouse manifest after extraction.
11. Run offline dependency install.
12. Run dependency import readiness without model import.
13. Delete the prompt-scoped VM and verify exact-name absence.

## Stop Conditions

Stop and cleanup if:

- pre-existing proof resources are present;
- local archive or chunk manifest validation fails;
- VM create fails or stocks out;
- private-only networking cannot be verified;
- boot-disk autodelete cannot be verified;
- IAP readiness is not captured;
- Python 3.12 is missing;
- any chunk transfer fails after bounded retry;
- remote reassembly fails;
- archive sha256 mismatch occurs;
- wheelhouse manifest validation fails;
- offline install fails;
- dependency import readiness fails;
- cleanup is not verified.

## Required Output

Produce a sanitized result doc/spec/smoke recording the exact outcome. If payload/install readiness passes, the next prompt may plan Wan model import only; it must still not run inference. If payload delivery fails again, the next prompt must fix the specific failing phase rather than blindly retrying.

## Recommended Next Prompt On Pass

`AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference`
