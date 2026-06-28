# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Native Runtime Proof Command Plan

```json worker-runtime-jobs-sound-cpu-launch-core-native-runtime-proof-command-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_native_runtime_install_proof_plan_completed_with_warnings_ready_for_controlled_install_import_proof_no_media_no_production",
  "futureProofCommands": {
    "pythonVenv": {
      "locationPolicy": "outside_repo_under_private_tmp",
      "createCommand": "python3 -m venv /private/tmp/reeditpro-native-runtime-install-proof-<timestamp>/venv",
      "installCommand": "python -m pip install --no-input --disable-pip-version-check -r server/workers/sound-cpu/requirements.launch-core.txt",
      "metadataCheck": "python -c \"import importlib.metadata as m; print(m.version('av'), m.version('scenedetect'), m.version('opencv-python-headless'))\"",
      "importCheck": "python -c \"import av; import scenedetect; import cv2; print('native-runtime-python-imports-ok')\"",
      "cleanupRequired": true
    },
    "nodeInstall": {
      "locationPolicy": "repo_worktree_validation_only",
      "installCommand": "npm ci --no-audit --no-fund",
      "metadataCheck": "node --input-type=module -e \"const p=await import('./package.json',{with:{type:'json'}}); console.log(p.default.dependencies.sharp,p.default.dependencies.remotion)\"",
      "importCheck": "node --input-type=module -e \"await import('sharp'); await import('remotion'); console.log('native-runtime-node-imports-ok')\"",
      "cleanupRequired": true
    }
  },
  "explicitlyNotExecutedInThisGate": [
    "python venv create",
    "pip install proof",
    "python native imports",
    "npm ci proof install",
    "node native imports",
    "media open",
    "image transform",
    "Remotion render",
    "worker execution"
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

The next proof gate may run these commands only after its own preflight confirms disk, duplicate state, source head, and cleanup policy.
