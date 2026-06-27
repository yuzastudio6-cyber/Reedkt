# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Evidence Map

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-evidence-map
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof",
  "acceptedSourceEvidence": [
    {
      "id": "persistent_runtime_install_readiness_plan",
      "file": "docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-readiness-plan.md",
      "acceptedMeaning": "The next non-duplicate gate is a controlled image runtime import proof plan; product execution and beta readiness remain zero."
    },
    {
      "id": "persistent_runtime_target_register",
      "file": "docs/worker-runtime-jobs-sound-cpu-persistent-runtime-install-target-register.md",
      "acceptedMeaning": "The selected target is the existing fail-closed SOUND CPU Dockerfile with the approved SOUND requirements file."
    },
    {
      "id": "gate_2a_synthetic_tool_call_proof",
      "file": "docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md",
      "acceptedMeaning": "Fifteen SOUND CPU tools passed controlled synthetic probes outside product runtime."
    },
    {
      "id": "docker_build_proof_owner_review",
      "file": "docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md",
      "acceptedMeaning": "The prior local Docker build proof is accepted for planning only; Docker run/push and worker execution remain closed."
    },
    {
      "id": "runtime_execution_approval_refresh",
      "file": "docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh.md",
      "acceptedMeaning": "Persistent runtime install, tool-call execution, and worker execution readiness remain zero."
    }
  ],
  "reconciledCounts": {
    "acceptedSoundCpuToolCount": 15,
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2,
    "containerRuntimeImportProofPassedToday": 0,
    "productToolCallExecutionReadyCount": 0,
    "externalBetaReadyCount": 0,
    "productionReadyCount": 0
  },
  "duplicateGuard": {
    "rerunGate2aSyntheticProof": false,
    "rerunGate1jDockerBuildProof": false,
    "createAlternateRuntimeTarget": false,
    "createProductRouteSurface": false,
    "waitForOwnerChat": false
  }
}
```
