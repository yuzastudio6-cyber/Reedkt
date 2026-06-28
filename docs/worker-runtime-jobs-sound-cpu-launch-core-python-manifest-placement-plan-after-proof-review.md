# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Python Manifest Placement Plan After Proof Review

```json worker-runtime-jobs-sound-cpu-launch-core-python-manifest-placement-plan-after-proof-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_plan_after_proof_review_completed_with_warnings_ready_for_persistent_manifest_source_plan_no_runtime_no_production",
  "sourceOwnerReviewPr": 1442,
  "sourceOwnerReviewMergeCommit": "e35acdd53893deb028baac3774e1ec258db42c50",
  "selectedFutureRequirementsPath": "server/workers/sound-cpu/requirements.launch-core.txt",
  "pathDecision": {
    "createSeparateLaunchCoreRequirementsFileLater": true,
    "appendToSoundOssToolsRequirementsToday": false,
    "mutateExistingSoundOssToolsRequirementsToday": false,
    "reason": "The existing SOUND OSS requirements file is the audio package manifest consumed by the disabled SOUND CPU Dockerfile. The launch-core proof adds render/media-data timeline dependencies and should be source-planned separately before any Dockerfile or runtime package change."
  },
  "plannedPythonRequirements": [
    {
      "toolId": "pyav",
      "requirementName": "av",
      "proofImportModule": "av",
      "proofVersion": "17.1.0",
      "futurePinStrategy": "exact_pin_from_proof_metadata",
      "sourceMutationApprovedToday": false
    },
    {
      "toolId": "pyscenedetect",
      "requirementName": "scenedetect",
      "proofImportModule": "scenedetect",
      "proofVersion": "0.7",
      "futurePinStrategy": "exact_pin_from_proof_metadata",
      "sourceMutationApprovedToday": false
    },
    {
      "toolId": "opencv",
      "requirementName": "opencv-python-headless",
      "proofImportModule": "cv2",
      "proofVersion": "4.13.0",
      "futurePinStrategy": "resolve_distribution_version_before_source_mutation",
      "sourceMutationApprovedToday": false
    },
    {
      "toolId": "duckdb",
      "requirementName": "duckdb",
      "proofImportModule": "duckdb",
      "proofVersion": "1.5.4",
      "futurePinStrategy": "exact_pin_from_proof_metadata",
      "sourceMutationApprovedToday": false
    },
    {
      "toolId": "polars",
      "requirementName": "polars",
      "proofImportModule": "polars",
      "proofVersion": "1.42.0",
      "futurePinStrategy": "exact_pin_from_proof_metadata",
      "sourceMutationApprovedToday": false
    },
    {
      "toolId": "opentimelineio",
      "requirementName": "opentimelineio",
      "proofImportModule": "opentimelineio",
      "proofVersion": "0.18.1",
      "futurePinStrategy": "exact_pin_from_proof_metadata",
      "sourceMutationApprovedToday": false
    }
  ],
  "futureSourceGateRequirements": [
    "create the selected requirements file only after owner-reviewed source mutation plan",
    "resolve opencv-python-headless distribution version from package metadata before pinning",
    "keep optional OpenImageIO and PyOpenColorIO out of the required launch-core file until separately approved",
    "do not alter the existing SOUND OSS audio requirements file in this planning packet",
    "do not claim media processing or runtime readiness from import-only proof"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
