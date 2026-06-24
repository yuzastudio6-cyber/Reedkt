# SOUND Runtime Media Gate 1E Proposed Dockerfile Spec

This spec is a planning artifact only. It does not create a Dockerfile, edit an existing Dockerfile, select a final base image, build a container, run a container, or approve worker execution.

```json sound-runtime-media-gate-1e-proposed-dockerfile-spec
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1E",
  "decision": "sound_runtime_media_gate_1e_dockerfile_static_plan_completed_with_warnings_ready_for_dockerfile_static_owner_review",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_dockerfile_static_review_passed_with_warnings_ready_for_gate_1e_static_plan",
  "specStatus": "static_planning_only_no_source_file_created",
  "plannedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "plannedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "instructionFamilies": [
    {
      "family": "base image selection",
      "staticPlanAllowed": true,
      "actualDockerfileInstructionCreated": false,
      "plannedRequirement": "document CPU-only Python base-image criteria, provenance, CVE review, and multi-arch policy before source creation",
      "ownerGate": "WORKER_RUNTIME_JOBS/COMPLIANCE_SECURITY"
    },
    {
      "family": "Python runtime layer",
      "staticPlanAllowed": true,
      "actualDockerfileInstructionCreated": false,
      "plannedRequirement": "pin Python runtime version only after ABI compatibility review for the 13 direct CPU packages",
      "ownerGate": "WORKER_RUNTIME_JOBS"
    },
    {
      "family": "requirements install layer",
      "staticPlanAllowed": true,
      "actualDockerfileInstructionCreated": false,
      "plannedRequirement": "reference server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt without installing packages in this milestone",
      "ownerGate": "SOUND_MUSIC_AUDIO/WORKER_RUNTIME_JOBS"
    },
    {
      "family": "worker source layer",
      "staticPlanAllowed": true,
      "actualDockerfileInstructionCreated": false,
      "plannedRequirement": "reserve future copy layout for worker code only after worker implementation approval",
      "ownerGate": "WORKER_RUNTIME_JOBS"
    },
    {
      "family": "runtime disabled default",
      "staticPlanAllowed": true,
      "actualDockerfileInstructionCreated": false,
      "plannedRequirement": "default every media, model, artifact, Supabase, provider, route, and worker execution flag to false",
      "ownerGate": "WORKER_RUNTIME_JOBS/SOUND_MUSIC_AUDIO"
    },
    {
      "family": "non-root and file permission policy",
      "staticPlanAllowed": true,
      "actualDockerfileInstructionCreated": false,
      "plannedRequirement": "plan non-root user and read-only source layout without changing file permissions now",
      "ownerGate": "COMPLIANCE_SECURITY"
    }
  ],
  "explicitNonOutputs": [
    "Dockerfile",
    ".dockerignore",
    "docker-compose file",
    "Cloud Build config",
    "Cloud Run config",
    "service account file",
    "Secret Manager binding",
    "worker entrypoint",
    "runtime schema",
    "media fixture",
    "model weight",
    "artifact output directory"
  ],
  "actualDockerfileCreated": false,
  "actualDockerfileModified": false,
  "dockerBuildRun": false,
  "dockerPushRun": false,
  "gcpTouched": false,
  "workerExecutionRun": false,
  "mediaProcessingRun": false,
  "supabaseTouched": false,
  "runtimeReadinessClaimed": false,
  "workerReadinessClaimed": false
}
```
