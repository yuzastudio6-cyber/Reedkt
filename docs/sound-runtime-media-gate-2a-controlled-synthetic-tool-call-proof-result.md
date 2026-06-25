# SOUND-RUNTIME-MEDIA-GATE-2A Controlled Synthetic Tool-Call Proof Result

Gate 2A proves the 15 accepted SOUND CPU candidates can be called with deterministic synthetic inputs in a disposable local Python virtual environment. This is not beta unlock, worker readiness, media readiness, Docker runtime readiness, external beta readiness, or production readiness.

```json sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2A",
  "decision": "sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review",
  "sourceVerification": {
    "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "sourceHead": "eb4fa16292f41e97660fe1dd429cd567fa944380",
    "pr739": {
      "status": "merged",
      "mergeCommit": "eb4fa16292f41e97660fe1dd429cd567fa944380",
      "decision": "worker_runtime_jobs_sound_cpu_image_hardening_owner_review_passed_with_warnings_ready_for_dockerignore_source_plan"
    },
    "pr737": {
      "decision": "worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review"
    },
    "pr730": {
      "decision": "sound_runtime_media_gate_1j_controlled_docker_build_proof_passed_with_warnings_ready_for_build_proof_owner_review"
    },
    "pr640": {
      "decision": "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof"
    }
  },
  "proofCommand": "python3 scripts/validation/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-runner.py",
  "proofRunner": "scripts/validation/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-runner.py",
  "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "toolCandidateCount": 15,
  "directPackageCount": 13,
  "aliasToolCount": 2,
  "metadataPassedCount": 13,
  "metadataFailedCount": 0,
  "importPassedCount": 13,
  "importFailedCount": 0,
  "probePassedCount": 15,
  "probeFailedCount": 0,
  "failedProbes": [],
  "durationSeconds": 125.19,
  "installDurationSeconds": 84.56,
  "proofDurationSeconds": 34.358,
  "tempVenvRemoved": true,
  "runtimeFlags": {
    "mediaFileOpenAttempted": false,
    "audioreadAudioOpenAttempted": false,
    "pydubFromFileAttempted": false,
    "pydubExportAttempted": false,
    "ffmpegExecuted": false,
    "ffprobeExecuted": false,
    "dockerExecuted": false,
    "gcpTouched": false,
    "providerCallAttempted": false,
    "modelDownloadAttempted": false,
    "workerExecutionAttempted": false,
    "routeExecutionAttempted": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "artifactCreated": false,
    "signedUrlCreated": false,
    "publicArtifactCreated": false
  },
  "betaReadinessClassification": {
    "internalSyntheticToolCallProofPassed": "yes",
    "internalDryRunBetaMayContinuePlanning": "yes",
    "realUserMediaBetaAllowed": "no",
    "externalBetaAllowed": "no",
    "paidProductionAllowed": "no"
  },
  "warnings": [
    {
      "warningId": "synthetic_only_not_media_runtime",
      "summary": "All probes used synthetic in-memory inputs. This does not approve uploaded media processing, audioread audio_open, pydub from_file/export, FFmpeg/ffprobe, or real audio runtime readiness."
    },
    {
      "warningId": "worker_route_not_enabled",
      "summary": "The proof runner executed tool calls locally in a disposable venv. It does not add or approve worker dispatch, claim, lease, route execution, Supabase writes, GCP, Docker run, or Docker push."
    },
    {
      "warningId": "direct_node_hydration_unstable_in_prior_gate",
      "summary": "PR #739 dependency validation passed through same-lock validation hydration after direct npm ci attempts exited 137. Gate 2A uses a Python venv proof and does not rely on node_modules hydration."
    }
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-SYNTHETIC-TOOL-CALL-OWNER-REVIEW: review controlled synthetic tool-call proof, no media/beta unlock",
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Tool calls were limited to the controlled local Gate 2A synthetic proof; no media file open, Docker run, Docker push, GCP, worker execution, or beta unlock was enabled."
}
```
