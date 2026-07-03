# AI Video B-roll 10W IAP Lookup Readiness Fix Result

Decision: `ai_video_broll_gen_10w_iap_lookup_readiness_fix_applied_no_execution`.

AI-VIDEO-BROLL-GEN-10W records the no-execution fix for the 10V L4 payload/install retry failure. The prior attempt created the prompt-scoped `g2-standard-4` plus one NVIDIA L4 VM in `northamerica-northeast2-a`, verified no public IP, and verified cleanup, but the first IAP SSH precheck failed with `Failed to lookup instance` before Python readiness, payload transfer, offline install, model import, or inference.

This fix does not create a VM, open SSH, transfer payloads, install dependencies, import Wan, run inference, create generated video/assets, run Docker, mutate Supabase, execute SQL, create signed URLs, mutate credits, unlock beta/production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- 10V result: `docs/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.md`
- 10V result spec: `src/backend/mock/mock-ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result.ts`
- 10V result smoke: `server/smoke/ai-video-broll-gen-10v-no-idle-l4-payload-install-retry-result-smoke.ts`
- 10W prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10w-iap-lookup-readiness-fix.md`
- 10W result spec: `src/backend/mock/mock-ai-video-broll-gen-10w-iap-lookup-readiness-fix-result.ts`
- 10W result smoke: `server/smoke/ai-video-broll-gen-10w-iap-lookup-readiness-fix-result-smoke.ts`
- 10X next prompt: `docs/implementation-prompts/prompt-ai-video-broll-gen-10x-no-idle-l4-payload-install-retry-with-iap-lookup-readiness.md`

## Failure Analysis

What failed in 10V:

- The first IAP SSH precheck ran too soon after the GPU VM create.
- `gcloud compute ssh --tunnel-through-iap` could not look up the just-created instance.
- The failure occurred before a remote shell opened, before payload transfer, before dependency install, and before model import.

What did not fail in 10V:

- `GPUS_ALL_REGIONS` quota and regional L4 quota were sufficient.
- The selected zone exposed the required `g2-standard-4` and `nvidia-l4` shape.
- The no-public-IP VM create path worked.
- Cleanup worked and no prompt-scoped VM, disk, address, or reservation remained.

## Readiness Contract Added

The next L4 payload/install retry must not call IAP SSH immediately after create. It must include this bounded post-create sequence before the first remote command:

1. Wait for the prompt-scoped instance to be visible through Compute Engine reads.
2. Wait for `status=RUNNING`.
3. Re-read the network interface and verify no public NAT IP exists.
4. Re-read the boot disk attachment and verify `autoDelete=true`.
5. Run a bounded IAP lookup readiness loop before any payload transfer or dependency install.
6. Persist every readiness attempt to the durable runtime summary.
7. If lookup readiness does not pass inside the bounded window, stop before payload transfer and run cleanup.

## Bounded Values

| Readiness item | Value |
| --- | --- |
| Instance status wait required | `true` |
| Private-only network recheck required | `true` |
| Boot disk auto-delete recheck required | `true` |
| IAP lookup readiness loop required | `true` |
| Maximum IAP lookup attempts | `8` |
| Delay between attempts | `10s` |
| Maximum readiness window | `120s` |
| Durable per-attempt summary required | `true` |
| Payload transfer allowed before readiness | `false` |
| Dependency install allowed before readiness | `false` |
| Model import allowed | `false` |
| Model inference allowed | `false` |

## Prevention Before Next Runtime Attempt

- Do not repeat the immediate SSH attempt from 10V.
- Use the 10X retry prompt only after this 10W result and smoke pass.
- Keep the proof VM prompt-scoped and no-public-IP.
- Keep cleanup mandatory even if readiness, SSH, transfer, or install fails.
- Do not run model import or inference in the next payload/install retry.

## Runtime Side Effects

All runtime side-effect gates remain false for 10W:

- `gcpReadOnlyCommandsExecutedByThisPrompt=false`
- `gcpMutatingCommandsExecutedByThisPrompt=false`
- `computeVmCreatedByThisPrompt=false`
- `diskCreatedByThisPrompt=false`
- `sshSessionOpenedByThisPrompt=false`
- `iapTransferExecuted=false`
- `fullWheelhousePayloadTransferred=false`
- `dependencyInstalledOnVm=false`
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

`AI-VIDEO-BROLL-GEN-10X-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-IAP-LOOKUP-READINESS: retry bounded no-idle L4 payload/install readiness with post-create IAP lookup readiness and mandatory cleanup, no model import/no inference`
