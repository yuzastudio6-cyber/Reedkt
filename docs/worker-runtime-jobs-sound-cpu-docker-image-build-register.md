# WORKER_RUNTIME_JOBS SOUND CPU Docker Image Build Register

```json worker-runtime-jobs-sound-cpu-docker-image-build-register
{
  "label": "worker-runtime-jobs-sound-cpu-docker-image-build-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan",
  "build": {
    "sourceHead": "556cd5fb538379ebbecf58fde92a9034d836931c",
    "dockerfile": "server/workers/sound-cpu/Dockerfile",
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "buildCommandScope": "controlled local Docker build only",
    "platform": "linux/amd64",
    "tag": "source-556cd5fb5",
    "buildPassed": true,
    "buildWarningAccepted": "FROM --platform flag should not use constant value linux/amd64",
    "dockerRunExecuted": false,
    "dockerPushExecutedAfterBuild": true
  },
  "installedPinnedPackages": [
    "librosa==0.11.0",
    "audioread==3.1.0",
    "pydub==0.25.1",
    "scipy==1.17.1",
    "resampy==0.4.3",
    "pyloudnorm==0.2.0",
    "audioflux==0.1.9",
    "music21==10.3.0",
    "pretty_midi==0.2.11",
    "mido==1.3.3",
    "noisereduce==3.0.3",
    "pedalboard==0.9.23",
    "mir_eval==0.8.2"
  ],
  "aliasCoverage": {
    "pydub_effects": "covered_by_pydub",
    "ebu_r128_pyloudnorm": "covered_by_pyloudnorm"
  },
  "blockedDuringBuildGate": {
    "dockerRun": true,
    "cloudRunDeploy": true,
    "cloudRunExecute": true,
    "workerExecution": true,
    "mediaProcessing": true,
    "supabaseSql": true,
    "artifactCreation": true,
    "externalBetaUnlock": true
  }
}
```
