# AI Video B-roll Generation GCP Proof Service Account Private Admin Approval

Decision: `ai_video_broll_gen_9j_fix_proof_service_account_private_admin_approval_blocked_existing_identity_ready_for_proof_identity_setup`

AI-VIDEO-BROLL-GEN-9J-FIX inspected the missing GCP identity and private admin path for the controlled Wan 1.3B L4 private proof. This gate approves the future setup shape for a proof-only service account and no-public-IP private admin path, but it does not approve a controlled proof retry yet because no concrete proof-only service account exists and no concrete private admin path is configured in the repository or live project metadata.

This gate did not create a VM, disk, service account, IAM binding, network, firewall rule, IAP setting, bucket, Artifact Registry image, reservation, Cloud Run job, quota request, Docker container, dependency install, model import, pipeline instance, model inference, generated frame, generated video, media artifact, FFmpeg output, Supabase row, SQL mutation, provider call, worker job, storage upload, signed URL, public artifact, credit row, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md`
- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-change-log.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-proof-service-account.md`
- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md`
- `docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md`
- `docs/google-cloud/production-gcp-iam-plan.md`
- `docs/production-gcp-runtime-plan.md`
- `docs/activation-gcp-staging-command-policy.md`

## Read-only GCP Metadata Findings

Read-only metadata checks were sanitized before being recorded here. Service account IDs are described without email domains or credential values.

| Check | Result | Fixture impact |
| --- | --- | --- |
| Service account inventory | enabled worker/staging identities exist, including AI-video asset and GPU worker identities | not sufficient for 9J retry because none is proof-only |
| Closest AI-video identity | existing AI-video asset worker identity has logging, monitoring, and Pub/Sub publisher roles | rejected for proof VM because it is worker-shaped, not proof-only |
| Closest GPU identity | existing staging GPU worker identity has logging and monitoring roles | rejected for proof VM because it is staging-worker-shaped, not proof-only |
| Default compute identity | default compute identity exists and has extra project roles | rejected for proof VM because default compute identity is not proof-only |
| Network inventory | default VPC network exists | insufficient alone for no-public-IP proof access |
| IAP/private admin firewall | no IAP-targeted firewall rule found | blocks private admin path approval for retry |
| Project common instance metadata | no project-level metadata override found | no proof-specific admin path evidence |
| Existing proof VM inventory | no AI-video B-roll proof VM found | good cleanup baseline, but no retry authority |

## Approval Decision

The future proof identity setup is approved only as a future no-VM/no-inference setup prompt. The setup must create or identify one proof-only service account and one no-public-IP private admin path before the controlled L4 proof can be retried.

Approved future setup shape:

- service account purpose: AI B-roll Wan 1.3B proof only;
- service account roles: minimal logging and monitoring only unless a later proof explicitly proves another role is required;
- disallowed roles: owner, editor, broad storage admin, artifact registry writer, provider-secret access, Supabase access, Pub/Sub publisher unless separately justified;
- credential policy: no service-account key file, raw credential environment payload, secret value, or committed identity material;
- admin path: no public IP; use IAP or an equivalent approved private admin path;
- firewall policy: no `allUsers`, no `allAuthenticatedUsers`, no open SSH from the public internet, and no broad ingress;
- scope: one `g2-standard-4` VM with one NVIDIA L4 for the non-user tabletop Wan 1.3B proof only;
- cleanup: later retry must delete every resource it creates and verify cleanup before accepting any proof result.

Still blocked before 9J retry:

- concrete proof-only service account does not exist or is not named in repo source of truth;
- IAM binding plan for that proof-only service account is not created;
- no-public-IP private admin path is not configured;
- IAP/firewall evidence is absent;
- disk, transfer, admin, and cleanup cost bounds cannot be accepted until the identity/admin path exists.

## Owner Decisions

| Owner | Decision | Execution in 9J-FIX |
| --- | --- | --- |
| `AI_VIDEO_BROLL_GENERATION` | accepts Wan 1.3B, exact revision, non-user tabletop fixture, and future proof-only identity setup boundary | no |
| `GCP_CLOUD_RUNTIME` | conditionally approves future proof-only service account and no-public-IP private admin setup shape | no |
| `COMPLIANCE_SECURITY` | rejects default/broad/worker identity reuse and requires no key files or credential values | no |
| `OBSERVABILITY_AUDIT_COST` | accepts sanitized evidence summaries without emails, secrets, command logs with credentials, or public URLs | no |
| `BILLING_STRIPE_CREDITS` | keeps infrastructure proof cost bounded and separate from user credits | no |
| `WORKER_RUNTIME_JOBS` | confirms this remains manual proof setup and not worker dispatch | no |
| `SUPABASE_RLS_STORAGE_DATABASE` | confirms no Supabase mutation, SQL, storage upload, signed URL, or public artifact | no |
| `TRACK_A_RENDER_EXPORT` | confirms no render, mux, export, delivery, or final composition | no |
| `TRACK_B_MEDIA_PROCESSING` | confirms no media processing, FFmpeg, ffprobe, cleanup, separation, or analysis | no |

## Result

9J-FIX does not make the controlled L4 proof retry-ready. It makes the next safe step precise: create or bind a proof-only identity and private admin path in a separate setup gate, still without VM creation or inference.

```json ai-video-broll-gen-9j-fix-proof-service-account-private-admin-approval
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-FIX",
  "decision": "ai_video_broll_gen_9j_fix_proof_service_account_private_admin_approval_blocked_existing_identity_ready_for_proof_identity_setup",
  "sourceBranch": "codex/ai-video-broll-gen-9j-controlled-l4-private-proof",
  "sourceCommit": "d75408dc",
  "readOnlyMetadataFindings": {
    "serviceAccountInventoryInspected": true,
    "proofOnlyServiceAccountFound": false,
    "aiVideoWorkerIdentityFound": true,
    "aiVideoWorkerIdentityAcceptedForProofVm": false,
    "gpuWorkerIdentityFound": true,
    "gpuWorkerIdentityAcceptedForProofVm": false,
    "defaultComputeIdentityFound": true,
    "defaultComputeIdentityAcceptedForProofVm": false,
    "ownerOrEditorRoleAccepted": false,
    "defaultNetworkFound": true,
    "iapFirewallRuleFound": false,
    "projectCommonMetadataPresent": false,
    "existingProofVmFound": false
  },
  "approvalDecision": {
    "futureProofIdentitySetupShapeApproved": true,
    "controlledL4PrivateProofRetryApprovedNow": false,
    "concreteProofServiceAccountApproved": false,
    "privateAdminPathApproved": false,
    "futureProofServiceAccountCreationPathApproved": true,
    "futureIapOrEquivalentPrivateAdminPathSetupApproved": true,
    "reuseDefaultComputeIdentityAllowed": false,
    "reuseWorkerIdentityAllowed": false,
    "serviceAccountKeyFileAllowed": false,
    "publicIpAllowed": false,
    "publicSshIngressAllowed": false
  },
  "requiredFutureSetup": [
    "create_or_identify_one_proof_only_service_account",
    "bind_minimal_logging_and_monitoring_roles_only",
    "approve_no_public_ip_private_admin_path",
    "create_or_verify_iap_or_equivalent_private_firewall_rule",
    "record_sanitized_identity_and_admin_path_evidence",
    "rerun_9j_preflight_before_any_vm_create"
  ],
  "runtimeFlags": {
    "mutatingCommandsExecuted": false,
    "vmCreated": false,
    "diskCreated": false,
    "serviceAccountCreated": false,
    "iamBindingCreated": false,
    "networkCreated": false,
    "firewallRuleCreated": false,
    "iapSettingChanged": false,
    "bucketCreated": false,
    "artifactRegistryImageCreated": false,
    "reservationCreated": false,
    "cloudRunJobCreated": false,
    "dockerCommandRun": false,
    "dependencyInstallAllowed": false,
    "modelImportAllowed": false,
    "pipelineInstantiationAllowed": false,
    "modelInferenceAllowed": false,
    "generatedFramesAllowed": false,
    "generatedVideoAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-FIX-SETUP: create proof service account and private admin path, no VM/no inference"
}
```

## No-Scope Statement

No dependency is installed. No virtual environment is created. No new model weights are downloaded. No model import is attempted. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No VM, disk, service account, IAM binding, network, firewall rule, IAP setting, bucket, Artifact Registry image, reservation, Cloud Run job, or quota request is created. No additional Google Cloud API is enabled. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-FIX-SETUP: create proof service account and private admin path, no VM/no inference`
