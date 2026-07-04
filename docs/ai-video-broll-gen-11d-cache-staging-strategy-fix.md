# AI-VIDEO-BROLL-GEN-11D Cache Staging Strategy Fix

## Status

Decision: `ai_video_broll_gen_11d_cache_staging_strategy_selected_cloud_side_no_gpu_transfer_harness`.

This packet chooses the next Wan / Wan2.1 B-roll model-cache staging strategy after the direct local upload stalled and the private Storage Transfer URL-list naming test failed with HTTP 403.

This is strategy-fix evidence only. It does not create a GPU VM, create a Cloud Run job, run Docker, run a model import, load Wan, run inference, encode prompts, denoise, decode frames, create generated video, create generated assets, touch Supabase, execute SQL, dispatch workers, mutate credits, unlock beta, unlock production, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/ai-video-broll-gen-11c-storage-transfer-naming-test-result.md`
- `server/cli/ai-video-broll-gen-11b-l4-model-import-runner.ts`
- `src/backend/mock/mock-external-agent-tool-execution-readiness-rollup.ts`
- `docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md`
- `docs/ai-video-broll-generation-weight-download-storage-policy.md`
- `docs/production-media-artifact-policy.md`
- `docs/worker-runtime-artifact-scope-source-of-truth.md`
- Local Wan cache: `/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b`
- Target private bucket: `reeditpro-staging-reeditpro-model-cache`

## Blocker Findings

| Area | Finding |
| --- | --- |
| Direct local upload | Blocked because the first large shard stayed in-flight and did not produce the private ready marker. Repeating the same upload is not a durable fix. |
| Private GCS URL-list | Blocked because Storage Transfer accepted the job but failed reading the private HTTPS TSV with HTTP 403. |
| Temporary public URL-list | Rejected because the target bucket has public access prevention enforced and public model-cache staging is against policy. |
| Signed URL-list | Rejected for this lane because it would require additional service-account token-creator permission and the repo policy keeps signed URLs out of source-of-truth and committed evidence. |
| GPU transfer job | Rejected because cache staging must not consume the L4 proof VM or leave idle GPU cost running. |
| Runtime auto-download | Rejected because future runtime must read verified private GCS model cache, not pull weights on demand. |

## Selected Strategy

Select a no-GPU cloud-side transfer harness as the next implementation path.

The future harness should run only after an explicit confirmation and should:

- create one short-lived no-GPU Cloud Run Job or equivalent controlled no-GPU cloud task;
- use a backend service account scoped to the approved B-roll proof payload prefix;
- read only stable pinned Hugging Face `resolve/<commit>/...` URLs from a safe generated manifest;
- stream or copy one model file at a time into the private GCS model-cache prefix;
- write the existing `wan-model-cache-ready.json` ready marker after object count and byte totals match;
- delete the prompt-scoped transfer job after completion;
- leave no public objects, signed URLs, generated video, generated assets, GPU VM, or runtime model inference.

The selected path preserves the current source of truth:

```text
private GCS prefix
+ safe manifest
+ checksum/byte metadata
+ approved model revision
+ no runtime auto-download
```

## Rejected Strategies

- Repeat the direct local `gcloud storage cp` large-shard upload as the primary path.
- Create public bucket access or public URL-list objects.
- Persist signed URLs or treat signed URLs as source of truth.
- Add a service-account key file.
- Use Secret Manager, provider APIs, Supabase rows, SQL, workers, media processing, FFmpeg, render/export, or billing paths.
- Use the L4 model-import proof VM as a transfer host.

## Future Harness Requirements

The next implementation must stay no-GPU and fail closed:

- explicit confirmation env required;
- no default execution;
- preflight checks for bucket visibility, service account identity, target prefix, model URL manifest, and no existing ready marker mismatch;
- bounded job name and cleanup verification;
- max retries set to zero or one bounded retry only if the runner proves idempotency;
- task timeout finite and recorded;
- no logs containing signed URLs, tokens, service-role keys, provider keys, or raw prompts;
- no model import, model load, inference, frame creation, video encoding, generated asset creation, Supabase mutation, SQL, credit mutation, beta, or production unlock.

## Runtime Gates

- `cloudSideNoGpuTransferHarnessSelected=true`
- `directLocalUploadRetrySelected=false`
- `privateGcsUrlListRetrySelected=false`
- `temporaryPublicUrlListSelected=false`
- `signedUrlListSelected=false`
- `gpuTransferSelected=false`
- `runtimeAutoDownloadSelected=false`
- `cloudRunJobCreated=false`
- `dockerRun=false`
- `computeVmCreated=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `workersDispatched=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `generatedLocalFixturePassedClaimed=false`

## Next Prompt

`AI-VIDEO-BROLL-GEN-11E-CLOUD-SIDE-CACHE-STAGING-RUNNER: implement no-GPU Wan private cache staging runner, no inference/no generated video`
