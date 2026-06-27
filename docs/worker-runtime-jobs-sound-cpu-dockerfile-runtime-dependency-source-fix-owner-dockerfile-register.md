# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Runtime Dependency Source Fix Owner Dockerfile Register

```json worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-dockerfile-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_owner_review_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation_refresh",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "acceptedSourceProperties": {
    "explicitPlatform": "linux/amd64",
    "baseImage": "python:3.13-slim",
    "debianRuntimePackage": "libatomic1",
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "runtimeDisabledFlagsPreserved": true,
    "nonRootUserPreserved": true,
    "failClosedCommandPreserved": true
  },
  "prohibitedSourceExpansionAbsent": {
    "ffmpegInstall": true,
    "ffprobeInstall": true,
    "modelWeights": true,
    "serviceAccountFiles": true,
    "supabaseCredentials": true,
    "providerCredentials": true,
    "workerImplementation": true,
    "routeImplementation": true
  },
  "acceptedWarning": {
    "id": "FromPlatformFlagConstDisallowed",
    "classification": "intentional_planning_warning",
    "reason": "The source currently pins linux/amd64 to satisfy audioflux bundled x86_64 shared libraries; the follow-up reconciliation must decide whether this is acceptable for beta infrastructure."
  }
}
```
