# WORKER_RUNTIME_JOBS SOUND CPU Launch Core Python Dependency Plan After Controlled Proof

```json worker-runtime-jobs-sound-cpu-launch-core-python-dependency-plan-after-controlled-proof
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-python-dependency-plan-after-controlled-proof",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production",
  "sourcePr": 1433,
  "sourceMergeCommit": "d1dfda8e6f416d26c2195be08e422d9178322063",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production",
  "existingRequirementSources": [
    {
      "path": "docker/prod/cpu-worker/requirements.cpu.txt",
      "status": "declares_required_python_packages_unpinned",
      "hostInstallApprovedToday": false
    },
    {
      "path": "docker/prod/tool-readiness-worker/requirements.readiness.txt",
      "status": "declares_required_python_packages_unpinned",
      "hostInstallApprovedToday": false
    }
  ],
  "requiredPythonPackages": [
    {
      "toolId": "pyav",
      "importName": "av",
      "requirementName": "av",
      "currentProofStatus": "missing",
      "installPlan": "pin and install in controlled disposable Python environment or worker image proof only"
    },
    {
      "toolId": "pyscenedetect",
      "importName": "scenedetect",
      "requirementName": "scenedetect",
      "currentProofStatus": "missing",
      "installPlan": "pin and install in controlled disposable Python environment or worker image proof only"
    },
    {
      "toolId": "opencv",
      "importName": "cv2",
      "requirementName": "opencv-python-headless",
      "currentProofStatus": "missing",
      "installPlan": "pin and install headless package only; no media decode/read proof in install gate"
    },
    {
      "toolId": "duckdb",
      "importName": "duckdb",
      "requirementName": "duckdb",
      "currentProofStatus": "missing",
      "installPlan": "pin and install for import-only proof; extension/network policies remain blocked"
    },
    {
      "toolId": "polars",
      "importName": "polars",
      "requirementName": "polars",
      "currentProofStatus": "missing",
      "installPlan": "pin and install for import-only proof; no user data read"
    },
    {
      "toolId": "opentimelineio",
      "importName": "opentimelineio",
      "requirementName": "opentimelineio",
      "currentProofStatus": "missing",
      "installPlan": "pin and install for metadata/timeline import proof only"
    }
  ],
  "deferredPythonPackages": [
    {
      "toolId": "openimageio",
      "importName": "OpenImageIO",
      "reason": "optional and needs source/package review"
    },
    {
      "toolId": "opencolorio",
      "importName": "PyOpenColorIO",
      "reason": "optional and needs color pipeline package review"
    }
  ],
  "pythonPlanConclusion": {
    "requiredPythonPackageCount": 6,
    "optionalPythonPackageCount": 2,
    "currentRequirementFilesAreUnpinned": true,
    "nextGateMayPinOrInstallInControlledProof": true,
    "mediaReadApprovedToday": false,
    "runtimeExecutionApprovedToday": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The Python plan uses import-only proof boundaries. It does not authorize opening uploaded media, decoding frames, or reading real-user project files.
