# AI-VIDEO-BROLL-GEN-11E Cloud-Side Cache Staging Runner

## Status

Decision: `ai_video_broll_gen_11e_cloud_side_cache_staging_runner_implemented_no_execution`.

This packet implements the no-GPU Wan / Wan2.1 private model-cache staging runner selected by 11D. It makes the cache staging path callable through an explicit external-agent wrapper, while keeping actual execution gated by confirmation.

This implementation does not run the runner, create a Cloud Run Job, execute a Cloud Run Job, create a GPU VM, run Docker, import Wan, load Wan, run inference, encode prompts, denoise, decode frames, create generated video, create generated assets, touch Supabase, execute SQL, dispatch workers, create signed URLs, publish public artifacts, mutate credits, unlock beta, unlock production, or claim `generated_local_fixture_passed`.

## Runner Shape

- Package script: `ai-video-broll-gen-11e:cloud-side-cache-staging-runner`
- CLI: `server/cli/ai-video-broll-gen-11e-cloud-side-cache-staging-runner.ts`
- Confirmation env: `REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING=true`
- External-agent cache wrapper env: `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_CACHE_FILL=true`
- Prompt-scoped job name: `reeditpro-ai-broll-wan-cache-stage-11e`
- Region: `us-central1`
- Image: `gcr.io/google.com/cloudsdktool/google-cloud-cli:slim`
- Service account: `reeditpro-ai-broll-proof-sa@reeditpro.iam.gserviceaccount.com`
- Target private bucket: `reeditpro-staging-reeditpro-model-cache`
- Target private prefix: `proof-payloads/ai-video-broll/11b/model-cache-by-commit/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b`
- Ready marker: `wan-model-cache-ready.json`

The runner uses a CPU-only Cloud Run Job to copy pinned Hugging Face `resolve/<commit>/...` files into the private GCS model-cache prefix, validate per-file byte counts and aggregate bytes, and write the ready marker only after the expected 19 files and `28928887859` aggregate bytes match.

## Execution Boundary

The runner may create private GCS support files and a prompt-scoped CPU-only Cloud Run Job only when:

- `--execute` is passed;
- `REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING=true`;
- the local Wan cache manifest is present and matches expected file count and bytes;
- the target private bucket is readable;
- no mismatched ready marker already exists;
- cleanup verification runs after the job.

The runner must not:

- use a GPU VM as a transfer host;
- use public URL-list objects;
- persist signed URLs or treat signed URLs as source of truth;
- use service-account key files;
- run model import, model load, or inference;
- create generated video or generated assets;
- touch Supabase, SQL, workers, providers, billing, beta, or production.

## External-Agent Wiring

`npm run external-agent-tool-prepare-broll-wan-cache` now points at the 11E runner instead of the old 11B local-upload cache-fill path.

Static mode returns a fail-closed guard. Execution mode requires `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_CACHE_FILL=true`, then delegates with `REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING=true`.

The B-roll GPU import/load wrapper still stays blocked until the private ready marker exists. The 11B L4 runner remains the import/load proof path after staging succeeds.

## Runtime Gates

- `cloudRunJobCreated=false` in this prompt
- `cloudRunJobExecuted=false` in this prompt
- `computeVmCreated=false`
- `gpuUsed=false`
- `dockerRun=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `signedUrlsCreated=false`
- `publicArtifactsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `generatedLocalFixturePassedClaimed=false`

## Next Prompt

`AI-VIDEO-BROLL-GEN-11E-EXECUTE-CLOUD-SIDE-CACHE-STAGING: run no-GPU Wan private cache staging runner with explicit confirmation, no inference/no generated video`
