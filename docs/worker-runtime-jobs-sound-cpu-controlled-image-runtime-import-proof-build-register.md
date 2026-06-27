# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Build Register

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-build-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_blocked_probe_invocation_no_output_ready_for_fix",
  "buildEvidence": {
    "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "imageTag": "reeditpro-sound-cpu:controlled-image-runtime-import-proof-local",
    "baseImageDigest": "sha256:2b7445fb71ca9cb15e9aab053fe8cb3162796f8e1d92ada12a49c766a811bc1e",
    "buildPassed": true,
    "pipInstallLayerPassed": true,
    "nonRootUserLayerPassed": true,
    "dockerPushAttempted": false,
    "dockerRunForWorkerExecutionAttempted": false,
    "gcpCloudRunAttempted": false
  },
  "sanitizedWarnings": [
    {
      "warningId": "pip_root_warning_inside_container_build",
      "classification": "accepted_container_build_warning",
      "reason": "The Dockerfile installs packages during image build before switching to non-root user. This is not a host package install and does not enable runtime execution."
    }
  ]
}
```
