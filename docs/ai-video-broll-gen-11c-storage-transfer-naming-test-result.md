# AI-VIDEO-BROLL-GEN-11C Storage Transfer Naming Test Result

## Status

Decision: `ai_video_broll_gen_11c_storage_transfer_naming_test_blocked_private_url_list_403_no_gpu_no_inference`.

This packet records a bounded Storage Transfer naming test for the Wan / Wan2.1 B-roll model-cache staging path. The test was created because the direct local `gcloud storage cp` cache-fill path stayed in-flight on the first large `text_encoder` shard and did not produce the private model-cache ready marker.

The test did not create a GPU VM, did not import Wan, did not load Wan, did not run inference, did not encode prompts, did not denoise, did not decode frames, did not create generated video, did not create generated assets, did not touch Supabase, did not execute SQL, did not dispatch workers, did not mutate credits, did not unlock beta, did not unlock production, and did not claim `generated_local_fixture_passed`.

## Source Inputs

- Local Wan cache: `/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b`
- Model repository: `Wan-AI/Wan2.1-T2V-1.3B-Diffusers`
- Model revision: `0fad780a534b6463e45facd96134c9f345acfa5b`
- Expected runtime files: `19`
- Expected aggregate bytes: `28928887859`
- Expected pipeline class: `WanPipeline`
- Target bucket: `reeditpro-staging-reeditpro-model-cache`

## Test Scope

The test used the smallest possible URL-list transfer shape:

- One TSV URL-list row for `model_index.json`.
- Expected object size: `400` bytes.
- Stable pinned Hugging Face resolve URL only; no redirected signed CDN URL was written to repo.
- Temporary URL-list object in the private B-roll proof payload area.
- Temporary Storage Transfer job.
- Temporary Storage Transfer service-agent IAM bindings for the test.

## Result

| Area | Result |
| --- | --- |
| Storage Transfer API enabled | true |
| Local `gcloud transfer jobs create` available | true |
| URL-list object uploaded to private bucket | true |
| Temporary service-agent IAM added | true |
| Transfer job created | true |
| Transfer operation completed | true |
| Transfer operation status | `FAILED` |
| Error class | `PERMISSION_DENIED` |
| Error detail | `Received HTTP error code 403` while reading the private URL-list object |
| Staging object created | false |
| Job deleted after test | true |
| URL-list object removed after test | true |
| Temporary service-agent IAM removed after test | true |

## Interpretation

The naming test proves the direct private Cloud Storage HTTPS URL-list path is not sufficient as-is. Storage Transfer accepted the job shape, but the transfer service could not read the private TSV list through the HTTPS object URL and failed with HTTP `403`.

This result also confirms the earlier local-upload problem should not be solved by repeatedly starting the same long interactive upload. The next fix should choose an approved cache-staging strategy before any GPU model import proof:

1. Approved temporary public URL-list object with no model secrets and short cleanup window.
2. Approved signed URL exception for the URL-list object only, if policy owners accept it.
3. Approved non-GPU cloud-side transfer harness that streams pinned Hugging Face files to private GCS without exposing list objects publicly.

Manual stubs, public model-cache artifacts, signed model-file source of truth, runtime request-time downloads, and GPU transfer jobs remain rejected.

## Runtime Gates

- `storageTransferNamingTestCreated=true`
- `storageTransferNamingTestPassed=false`
- `privateUrlListReadableByStorageTransfer=false`
- `temporaryIamAdded=true`
- `temporaryIamRemoved=true`
- `transferJobCreated=true`
- `transferJobDeleted=true`
- `urlListObjectCreated=true`
- `urlListObjectDeleted=true`
- `stagingObjectCreated=false`
- `privateGcsModelCacheReady=false`
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

`AI-VIDEO-BROLL-GEN-11D-CACHE-STAGING-STRATEGY-FIX: choose approved Wan private cache staging strategy after local upload stall and private URL-list 403, no GPU/no inference`
