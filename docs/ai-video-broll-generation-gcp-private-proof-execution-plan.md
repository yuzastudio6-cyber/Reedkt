# AI Video B-roll Generation GCP Private Proof Execution Plan

Decision: `ai_video_broll_gen_9h_private_proof_execution_plan_completed_ready_for_owner_execution_approval`

AI-VIDEO-BROLL-GEN-9H defines a plan-only command shape for a future private Wan 1.3B single-L4 proof. This gate does not execute the command plan. It does not create VMs, disks, service accounts, networks, firewall rules, IAP settings, buckets, Artifact Registry images, reservations, Cloud Run jobs, quota requests, Docker containers, dependency installs, model imports, pipeline instances, model inference, generated frames, generated video, media processing, FFmpeg output, Supabase rows, SQL mutations, provider calls, worker jobs, storage uploads, signed URLs, public artifacts, credit rows, beta unlocks, production unlocks, runtime-readiness claims, `dry_run_passed` claims, or `generated_local_fixture_passed` claims.

## Source Evidence

- `docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md`
- `docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-change-log.md`
- `docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md`
- `docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md`
- `docs/activation-gcp-staging-command-policy.md`
- `model-routing-policy.md`
- `render-strategy-planner.md`
- `open-source-tool-registry.md`

## Selected Future Target

- Project: `reeditpro`.
- Region: `us-central1`.
- Default zone candidate: `us-central1-b`.
- Zone fallback order: `us-central1-a`, then `us-central1-c` if capacity is unavailable.
- Machine type: `g2-standard-4`.
- Accelerator: one NVIDIA L4.
- Planning price: USD `0.706832276` per hour for the officially extracted Iowa (`us-central1`) G2 L4 row.
- Max runtime cap: 60 minutes.
- Placeholder cap: USD `2.00`, before separately bounded disk/network/storage costs.
- Input: non-user-media Gate 8 synthetic tabletop fixture only.
- Model cache: private outside-repository Wan 1.3B cache with revision `37ec512624d61f7aa208f7ea8140a131f93afc9a`.
- Output: temporary private VM-local proof directory only in a later execution prompt if explicitly approved.

## Future Command Plan

The following command shapes are future-only, owner-approval-only text. They are not executed by this gate.

### Preflight Recheck

```bash
# FUTURE ONLY - DO NOT RUN IN 9H
gcloud config get-value project
gcloud services list --enabled --project=reeditpro --filter='config.name=compute.googleapis.com' --format='value(config.name)'
gcloud compute machine-types describe g2-standard-4 --project=reeditpro --zone=us-central1-b --format=json
gcloud compute accelerator-types describe nvidia-l4 --project=reeditpro --zone=us-central1-b --format=json
gcloud compute regions describe us-central1 --project=reeditpro --format=json
```

Abort criteria:

- Active project is not `reeditpro`.
- Compute Engine API is not enabled.
- `g2-standard-4` is not visible in the selected zone.
- `nvidia-l4` is not visible in the selected zone.
- `NVIDIA_L4_GPUS` limit is below 1 or usage is above 0.
- Official pricing cannot be rechecked immediately before execution.
- Any production, staging customer data, user media, or public endpoint enters scope.

### VM Create Shape

```bash
# FUTURE ONLY - DO NOT RUN IN 9H
gcloud compute instances create reeditpro-ai-broll-wan-l4-proof-YYYYMMDDHHMM \
  --project=reeditpro \
  --zone=us-central1-b \
  --machine-type=g2-standard-4 \
  --maintenance-policy=TERMINATE \
  --accelerator=type=nvidia-l4,count=1 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=200GB \
  --boot-disk-type=pd-balanced \
  --no-address \
  --service-account=AI_VIDEO_BROLL_PROOF_SERVICE_ACCOUNT_EMAIL_PLACEHOLDER \
  --metadata=enable-oslogin=TRUE,proof-mode=ai-video-broll-wan-l4-private \
  --labels=workstream=ai-video-broll-generation,proof=wan-l4-private,ttl=60m
```

Future owner requirements before this command can run:

- GCP owner approves the exact VM shape, zone, image, no-public-address policy, labels, and cleanup path.
- GCP owner confirms the service account exists, has least-privilege permissions, and exposes no secrets.
- Network owner confirms IAP or another private admin path is safe without adding a public IP.
- Billing owner approves the total capped spend, including disk/network/storage-transfer cost.
- AI_VIDEO_BROLL_GENERATION owner confirms the fixture remains non-user-media and the plan still uses Wan 1.3B only.

### Private Cache Transfer Shape

```bash
# FUTURE ONLY - DO NOT RUN IN 9H
gcloud compute scp --recurse \
  PRIVATE_WAN_1_3B_CACHE_PATH_PLACEHOLDER \
  reeditpro-ai-broll-wan-l4-proof-YYYYMMDDHHMM:/tmp/reeditpro-private-model-cache/wan-1-3b \
  --project=reeditpro \
  --zone=us-central1-b \
  --tunnel-through-iap
```

Transfer constraints:

- Public buckets are forbidden.
- Signed URLs are forbidden.
- Runtime auto-download is forbidden.
- Repo-tracked weights are forbidden.
- Private cache checksum verification is required before execution.
- The transferred cache must be deleted during cleanup.

### Proof Runner Shape

```bash
# FUTURE ONLY - DO NOT RUN IN 9H
gcloud compute ssh reeditpro-ai-broll-wan-l4-proof-YYYYMMDDHHMM \
  --project=reeditpro \
  --zone=us-central1-b \
  --tunnel-through-iap \
  --command='AI_VIDEO_BROLL_PROOF_RUNNER_PLACEHOLDER --offline-model-cache /tmp/reeditpro-private-model-cache/wan-1-3b --fixture non-user-media-tabletop --max-runtime-minutes 60 --output-dir /tmp/reeditpro-private-proof-output'
```

Runner constraints:

- No provider call.
- No worker dispatch.
- No Supabase mutation.
- No storage upload.
- No signed URL.
- No public artifact.
- No production or customer media.
- No route unlock.
- No beta or production claim.

### Cleanup Shape

```bash
# FUTURE ONLY - DO NOT RUN IN 9H
gcloud compute ssh reeditpro-ai-broll-wan-l4-proof-YYYYMMDDHHMM \
  --project=reeditpro \
  --zone=us-central1-b \
  --tunnel-through-iap \
  --command='rm -rf /tmp/reeditpro-private-model-cache /tmp/reeditpro-private-proof-output'

gcloud compute instances delete reeditpro-ai-broll-wan-l4-proof-YYYYMMDDHHMM \
  --project=reeditpro \
  --zone=us-central1-b \
  --quiet

gcloud compute instances describe reeditpro-ai-broll-wan-l4-proof-YYYYMMDDHHMM \
  --project=reeditpro \
  --zone=us-central1-b \
  --format='value(name)'
```

Cleanup verification rule: the final describe must return no instance. If cleanup fails, no proof result may be accepted and manual cleanup is required before any follow-up.

## Cost Guard

- Verified compute planning price from Gate 9G: USD `0.706832276` per hour.
- Max runtime cap: 60 minutes.
- Placeholder cap: USD `2.00`.
- Minimum cost guard for future execution: compute price plus separately bounded boot disk and transfer costs must remain under the owner-approved cap.
- Stop condition: if official final pricing or disk/network/storage-transfer bounds push the run above the cap, execution must not proceed.
- Billing behavior now: no credit estimate, approval, reservation, spend, refund, or release is created.

## Owner Acceptance Checklist

| Owner | Acceptance needed before any future execution | Status in 9H |
| --- | --- | --- |
| `AI_VIDEO_BROLL_GENERATION` | Confirm Wan 1.3B, non-user-media fixture, no product/user media, no runtime-readiness claim. | pending |
| `GCP_CLOUD_RUNTIME` | Approve exact VM, zone, service account, no-public-address, private admin path, labels, cleanup, and final pricing recheck. | pending |
| `WORKER_RUNTIME_JOBS` | Confirm this is not worker dispatch and no worker runtime contract is bypassed. | pending |
| `SUPABASE_RLS_STORAGE_DATABASE` | Confirm no Supabase mutation, no SQL, no storage upload, no signed URL, and no public artifact. | pending |
| `BILLING_STRIPE_CREDITS` | Approve capped local/cloud proof spend as infrastructure validation only, not user credit spend. | pending |
| `OBSERVABILITY_AUDIT_COST` | Approve evidence capture format for command output summaries, cleanup status, and cost notes. | pending |
| `TRACK_A_RENDER_EXPORT` | Confirm no render, mux, export, or final composition artifact is created. | pending |
| `TRACK_B_MEDIA_PROCESSING` | Confirm no media processing, FFmpeg, ffprobe, cleanup, separation, or analysis is run. | pending |

## Still Forbidden

- Creating or running the VM.
- Creating disks, service accounts, networks, firewall rules, IAP settings, buckets, or reservations.
- Running Docker or Cloud Run.
- Installing dependencies.
- Downloading model weights.
- Importing model modules.
- Instantiating a pipeline.
- Running inference.
- Creating generated frames or generated video.
- Running media processing or FFmpeg.
- Touching Supabase or SQL.
- Calling providers.
- Dispatching workers.
- Uploading storage objects.
- Creating signed URLs.
- Creating public artifacts.
- Creating credit or approval records.
- Claiming runtime readiness, beta readiness, production readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

## Result

The private proof command plan is sufficiently specified for a future owner execution approval packet. The next gate should collect owner approval for the exact command plan, still without running the VM or inference.

```json ai-video-broll-gen-9h-private-proof-execution-plan
{
  "phase": "AI-VIDEO-BROLL-GEN-9H",
  "decision": "ai_video_broll_gen_9h_private_proof_execution_plan_completed_ready_for_owner_execution_approval",
  "sourceBranch": "codex/ai-video-broll-gen-9g-l4-quota-cost-verification",
  "sourceCommit": "feaf01ed",
  "sourcePullRequests": {
    "pr786": "AI-VIDEO-BROLL-GEN-0 owner/model selection plan",
    "pr797": "AI-VIDEO-BROLL-GEN-1 license/provenance approval",
    "pr799": "AI-VIDEO-BROLL-GEN-2 weight source/checksum plan",
    "pr801": "AI-VIDEO-BROLL-GEN-3 dependency install plan",
    "pr804": "AI-VIDEO-BROLL-GEN-4 runtime/GPU owner review",
    "pr806": "AI-VIDEO-BROLL-GEN-5 controlled dependency install proof",
    "pr815": "AI-VIDEO-BROLL-GEN-6 controlled model weight download proof",
    "pr820": "AI-VIDEO-BROLL-GEN-7 model loader import proof",
    "pr823": "AI-VIDEO-BROLL-GEN-8 controlled synthetic generation plan",
    "pr826": "AI-VIDEO-BROLL-GEN-9 controlled synthetic proof result",
    "pr832": "AI-VIDEO-BROLL-GEN-9A runtime memory owner review",
    "pr836": "AI-VIDEO-BROLL-GEN-9B GCP L4 private proof plan",
    "pr841": "AI-VIDEO-BROLL-GEN-9C GCP L4 prerequisite verification",
    "pr845": "AI-VIDEO-BROLL-GEN-9D GCP Compute API quota setup plan",
    "pr847": "AI-VIDEO-BROLL-GEN-9E GCP Compute API owner approval",
    "pr849": "AI-VIDEO-BROLL-GEN-9F GCP Compute API enablement",
    "pr857": "AI-VIDEO-BROLL-GEN-9G L4 quota cost verification"
  },
  "selectedFutureTarget": {
    "project": "reeditpro",
    "region": "us-central1",
    "zone": "us-central1-b",
    "zoneFallbacks": [
      "us-central1-a",
      "us-central1-c"
    ],
    "machineType": "g2-standard-4",
    "accelerator": "nvidia-l4",
    "acceleratorCount": 1,
    "planningPriceUsdPerHour": 0.706832276,
    "maxRuntimeMinutes": 60,
    "placeholderCapUsd": 2,
    "inputFixture": "non_user_media_tabletop_fixture",
    "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
    "modelRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "executionApprovedNow": false
  },
  "futureCommandPlan": {
    "commandsAreFutureOnly": true,
    "commandsExecutedByThisGate": false,
    "requiresOwnerExecutionApproval": true,
    "plannedInstanceNamePattern": "reeditpro-ai-broll-wan-l4-proof-YYYYMMDDHHMM",
    "preflightCommands": [
      "gcloud config get-value project",
      "gcloud services list --enabled --project=reeditpro --filter='config.name=compute.googleapis.com' --format='value(config.name)'",
      "gcloud compute machine-types describe g2-standard-4 --project=reeditpro --zone=us-central1-b --format=json",
      "gcloud compute accelerator-types describe nvidia-l4 --project=reeditpro --zone=us-central1-b --format=json",
      "gcloud compute regions describe us-central1 --project=reeditpro --format=json"
    ],
    "vmCreateCommandDefined": true,
    "privateCacheTransferCommandDefined": true,
    "proofRunnerCommandDefined": true,
    "cleanupCommandsDefined": true,
    "noPublicIpRequired": true,
    "iapOrPrivateAdminPathRequired": true,
    "leastPrivilegeServiceAccountRequired": true,
    "secretValuesIncluded": false
  },
  "costGuard": {
    "verifiedComputeUsdPerHour": 0.706832276,
    "maxRuntimeMinutes": 60,
    "computeOnlyProjectedCostUsd": 0.706832276,
    "placeholderCapUsd": 2,
    "diskCostBoundedNow": false,
    "networkTransferCostBoundedNow": false,
    "storageCostBoundedNow": false,
    "finalOfficialPricingRecheckRequired": true,
    "executeOnlyIfTotalBoundedCostUnderCap": true,
    "creditMutationAllowed": false
  },
  "transferPolicy": {
    "privateCacheTransferPlanned": true,
    "publicBucketAllowed": false,
    "signedUrlAllowed": false,
    "runtimeAutoDownloadAllowed": false,
    "repoTrackedWeightsAllowed": false,
    "checksumVerificationRequired": true,
    "cleanupRequired": true,
    "storageUploadAllowed": false
  },
  "ownerAcceptanceChecklist": [
    {
      "owner": "AI_VIDEO_BROLL_GENERATION",
      "status": "pending_owner_execution_approval"
    },
    {
      "owner": "GCP_CLOUD_RUNTIME",
      "status": "pending_owner_execution_approval"
    },
    {
      "owner": "WORKER_RUNTIME_JOBS",
      "status": "pending_owner_execution_approval"
    },
    {
      "owner": "SUPABASE_RLS_STORAGE_DATABASE",
      "status": "pending_owner_execution_approval"
    },
    {
      "owner": "BILLING_STRIPE_CREDITS",
      "status": "pending_owner_execution_approval"
    },
    {
      "owner": "OBSERVABILITY_AUDIT_COST",
      "status": "pending_owner_execution_approval"
    },
    {
      "owner": "TRACK_A_RENDER_EXPORT",
      "status": "pending_owner_execution_approval"
    },
    {
      "owner": "TRACK_B_MEDIA_PROCESSING",
      "status": "pending_owner_execution_approval"
    }
  ],
  "runtimeFlags": {
    "commandsExecutedByThisGate": false,
    "computeEngineApiEnabledByThisGate": false,
    "additionalApiEnabledByThisGate": false,
    "quotaRequestCreated": false,
    "quotaIncreaseRequested": false,
    "vmCreated": false,
    "diskCreated": false,
    "serviceAccountCreated": false,
    "networkCreated": false,
    "firewallRuleCreated": false,
    "iapSettingChanged": false,
    "bucketCreated": false,
    "artifactRegistryImageCreated": false,
    "reservationCreated": false,
    "cloudRunJobCreated": false,
    "dockerCommandRun": false,
    "dependencyInstallAllowed": false,
    "modelWeightDownloadAllowed": false,
    "dependencyModuleImportAllowed": false,
    "modelLoaderMetadataInspectionAllowed": false,
    "pipelineInstantiationAllowed": false,
    "modelFromPretrainedAllowed": false,
    "torchLoadAllowed": false,
    "textEncodingAllowed": false,
    "denoisingStepAllowed": false,
    "schedulerRunAllowed": false,
    "vaeEncodeDecodeAllowed": false,
    "modelInferenceAllowed": false,
    "generatedFramesAllowed": false,
    "generatedVideoAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "storageUploadAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "creditMutationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9I: private proof owner execution approval, no VM/no inference"
}
```

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model weights are downloaded. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No VM, disk, service account, network, firewall rule, IAP setting, bucket, Artifact Registry image, reservation, Cloud Run job, or quota request is created. No additional Google Cloud API is enabled. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9I: private proof owner execution approval, no VM/no inference`
