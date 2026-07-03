# AI Video B-roll 10ZA Payload Delivery Timeout Fix Result

Decision: `ai_video_broll_gen_10za_payload_delivery_timeout_fix_applied_no_vm_archive_chunk_strategy_selected`.

AI-VIDEO-BROLL-GEN-10ZA fixes the payload delivery plan after 10Z proved that recursively copying the full 2.8 GB Python 3.12 wheelhouse directory over IAP is too fragile for a bounded no-idle L4 VM proof. This prompt did not create a VM, run Docker, call providers, download model weights, import Wan, run inference, create generated video, create generated assets, mutate Supabase, execute SQL, create storage objects, create signed URLs, spend credits, unlock beta, unlock production, or claim `generated_local_fixture_passed`.

Boundary phrase for diagnostics: `no VM/no model/no inference`.

## Source Evidence

- 10Z result: `docs/ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.md`
- 10Z result spec: `src/backend/mock/mock-ai-video-broll-gen-10z-no-idle-l4-payload-install-retry-after-runner-fix-result.ts`
- 10Z runner: `server/cli/ai-video-broll-gen-10z-l4-payload-install-runner.ts`
- 10Y runner contract: `server/cli/ai-video-broll-gen-10y-l4-payload-install-runner-contract.ts`
- Wan private cache readiness spec: `src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness.ts`
- Wan private cache readiness CLI: `server/cli/ai-video-broll-wan-fast-cache-readiness-check.ts`
- Wan private cache readiness smoke: `server/smoke/ai-video-broll-wan-fast-cache-readiness-check-smoke.ts`
- Wan GPU quota verification: `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`
- 10ZA prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10za-payload-delivery-timeout-fix.md`
- 10ZA result spec: `src/backend/mock/mock-ai-video-broll-gen-10za-payload-delivery-timeout-fix-result.ts`
- 10ZA result smoke: `server/smoke/ai-video-broll-gen-10za-payload-delivery-timeout-fix-result-smoke.ts`

## Failure Being Fixed

10Z passed live quota/cache preflight, created one no-public-IP `g2-standard-4` L4 VM in `northamerica-northeast2-a`, verified private networking and boot-disk autodelete, passed IAP lookup readiness, verified Python 3.12, prepared the remote payload directory, and transferred the small requirements manifest. It then timed out while recursively transferring the full private wheelhouse directory over IAP.

This was not:

- a quota failure;
- an IAP auth failure;
- a Python readiness failure;
- a raw JSON runner parsing failure;
- a cleanup failure.

The failure was the payload delivery method.

## Selected Fix

Selected strategy: `pre_vm_local_tar_gzip_archive_split_chunks_iap_transfer_with_sha256_reassembly`.

Future 10ZB must:

1. Build a deterministic local `tar.gz` archive from the private Python 3.12 wheelhouse before VM creation.
2. Create a local archive sha256 file and chunk manifest before VM creation.
3. Split the archive into bounded chunks, with a default chunk size of 512 MiB.
4. Refuse VM creation if the archive, archive checksum, or chunk manifest is missing or invalid.
5. Transfer chunks sequentially over IAP with per-chunk checkpoints.
6. Reassemble chunks on the remote VM.
7. Verify the remote archive sha256 before extraction.
8. Extract the archive only after checksum verification.
9. Validate the original wheelhouse `SHA256SUMS.json` after extraction.
10. Run offline dependency install only after payload validation.
11. Run dependency import readiness only after install.
12. Keep model import and model inference blocked.
13. Delete the prompt-scoped VM and verify exact-name absence before completion.

This reduces the failure surface from thousands of recursive directory operations to bounded package/chunk phases with checkpointable progress.

## Rejected Strategies

| Strategy | Decision | Reason |
| --- | --- | --- |
| Retry recursive IAP directory copy | rejected | 10Z already timed out on this path. |
| Always-on GPU VM cache | rejected | Violates run-when-used and stop-when-idle GPU posture. |
| Public IP or public bucket delivery | rejected | Violates no-public-IP and no-public-artifact boundaries. |
| Skip payload/install proof and import model | rejected | Would bypass dependency readiness proof before model execution. |

## Payload Package Shape

Future local pre-VM payload package:

- Source wheelhouse: private local Wan L4 Python 3.12 wheelhouse.
- Source manifest: `SHA256SUMS.json`.
- Requirements manifest: `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`.
- Archive name: `wan-l4-python312-wheelhouse.tar.gz`.
- Archive checksum file: `wan-l4-python312-wheelhouse.sha256`.
- Chunk manifest: `wan-l4-python312-wheelhouse.chunks.sha256.json`.
- Expected wheel count: `66`.
- Expected wheelhouse bytes: `2802483442`.
- Expected wheelhouse aggregate sha256: `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64`.

The archive and chunks are future local ephemeral files only. They are not created by this prompt and must not be committed.

## External-Agent State

After this fix, B-roll/Wan remains blocked for external-agent execution, but the active blocker changes from the 10ZA planning repair to the future 10ZB bounded retry:

- Previous active blocker: `broll_10za_payload_delivery_timeout_fix_required`.
- New active blocker: `broll_10zb_no_idle_l4_payload_install_retry_with_fixed_delivery_required`.
- Next action: `AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: retry bounded L4 payload/install readiness with fixed payload delivery, no model import/no inference`.

Qwen external-agent execution readiness is unchanged by this fix.

## Runtime Gates

All runtime side effects remain false in this prompt:

- `computeVmCreated=false`
- `gpuAttached=false`
- `sshSessionOpened=false`
- `iapTransferExecuted=false`
- `localArchiveCreated=false`
- `localArchiveChunksCreated=false`
- `fullWheelhousePayloadTransferred=false`
- `dependencyInstalledOnVm=false`
- `dependencyImportReadinessRun=false`
- `modelDownloaded=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `storageObjectsCreated=false`
- `signedUrlsCreated=false`
- `publicArtifactsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: retry bounded L4 payload/install readiness with fixed payload delivery, no model import/no inference`
