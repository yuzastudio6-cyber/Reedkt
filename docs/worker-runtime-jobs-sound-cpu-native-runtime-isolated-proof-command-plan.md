# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Isolated Proof Command Plan

```json worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-command-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_plan_completed_with_warnings_ready_for_controlled_isolated_install_import_proof_no_media_no_production",
  "plannedProofCommands": [
    {
      "proofId": "shared_manifest_metadata_install",
      "manifestPath": "server/workers/sound-cpu/requirements.launch-core.shared.txt",
      "tempVenvPolicy": "outside_repo_under_private_tmp",
      "commands": [
        "python3 -m venv /private/tmp/reeditpro-native-runtime-isolated-shared-<timestamp>/venv",
        "venv/bin/python -m pip install --no-input --disable-pip-version-check -r server/workers/sound-cpu/requirements.launch-core.shared.txt",
        "venv/bin/python -c \"import importlib.metadata as m; import duckdb; import polars; import opentimelineio; print(m.version('duckdb'))\""
      ]
    },
    {
      "proofId": "pyav_isolated_metadata_import",
      "manifestPath": "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
      "tempVenvPolicy": "outside_repo_under_private_tmp",
      "commands": [
        "python3 -m venv /private/tmp/reeditpro-native-runtime-isolated-pyav-<timestamp>/venv",
        "venv/bin/python -m pip install --no-input --disable-pip-version-check -r server/workers/sound-cpu/requirements.launch-core.pyav.txt",
        "venv/bin/python -c \"import importlib.metadata as m; import av; print(m.version('av'))\""
      ]
    },
    {
      "proofId": "opencv_scenedetect_isolated_metadata_import",
      "manifestPath": "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
      "tempVenvPolicy": "outside_repo_under_private_tmp",
      "commands": [
        "python3 -m venv /private/tmp/reeditpro-native-runtime-isolated-opencv-<timestamp>/venv",
        "venv/bin/python -m pip install --no-input --disable-pip-version-check -r server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt",
        "venv/bin/python -c \"import importlib.metadata as m; import cv2; import scenedetect; print(m.version('opencv-python-headless'))\""
      ]
    }
  ],
  "explicitlyNotExecutedInThisGate": [
    "python venv creation",
    "pip install",
    "native module import",
    "media open",
    "worker execution",
    "route execution",
    "runtime readiness unlock"
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

The proof execution gate must run each lane in a separate temporary environment.
