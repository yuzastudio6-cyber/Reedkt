# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Image Rebuild Register

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_image_rebuild_deploy_execution_proof_blocked_gcloud_reauth_readback",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "permissionFix": {
    "requirementsCopy": "COPY --chmod=0644 server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt ./requirements.sound-oss-tools.txt",
    "runnerCopy": "COPY --chmod=0644 scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py ./controlled-tool-execution-runner.py",
    "reason": "Cloud Run runs the image as non-root. Host source files were readable by owner only during Docker COPY, so the copied runner was not readable by the non-root runtime user."
  },
  "initialEntrypointImage": {
    "digest": "sha256:ee9f8150b0d48681174a8b00fadf2e4054ad573275c498b7426c5361dd6884c0",
    "buildPushPassed": true,
    "cloudRunExecutionName": "reeditpro-sound-cpu-analysis-worker-kd77h",
    "executionFailed": true,
    "failure": "Permission denied opening /opt/reeditpro/sound-cpu/controlled-tool-execution-runner.py"
  },
  "fixedEntrypointImage": {
    "digest": "sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366",
    "platform": "linux/amd64",
    "provenanceEnabled": false,
    "sbomEnabled": false,
    "buildPushPassed": true,
    "analysisTag": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker:source-a1c6fdb13-amd64-entrypoint-chmod",
    "metadataTag": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker:source-a1c6fdb13-amd64-entrypoint-chmod"
  },
  "warnings": [
    "Docker build emitted a FromPlatformFlagConstDisallowed warning for the constant linux/amd64 platform pin.",
    "No Docker run was executed.",
    "No Docker push beyond the fixed-image proof tags was executed."
  ]
}
```
