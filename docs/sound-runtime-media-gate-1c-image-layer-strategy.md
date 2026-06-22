# SOUND-RUNTIME-MEDIA-GATE-1C Image Layer Strategy

This layer strategy is a planning artifact. It does not create a Dockerfile, build an image, install packages into a runtime image, or execute validation inside a container.

```json sound-runtime-media-gate-1c-image-layer-strategy
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1C",
  "decision": "sound_runtime_media_gate_1c_cpu_worker_image_plan_completed_with_warnings_ready_for_worker_runtime_handoff",
  "layerPlan": [
    {
      "layer": "base OS layer",
      "includes": ["future slim Linux base image selected by worker runtime owner"],
      "excludes": ["GPU runtime", "CUDA", "FFmpeg", "ffprobe", "sox", "model weights"],
      "owner": "WORKER_RUNTIME_JOBS",
      "approvalNeeded": "worker runtime owner base image approval",
      "validationNeeded": "future static Dockerfile review",
      "rollbackPlan": "revert image base plan before Dockerfile creation"
    },
    {
      "layer": "Python runtime layer",
      "includes": ["future Python 3.13.x-compatible CPU runtime plan"],
      "excludes": ["repo local venv", "system Python mutation", "runtime package installation in Gate 1C"],
      "owner": "WORKER_RUNTIME_JOBS",
      "approvalNeeded": "runtime Python version approval",
      "validationNeeded": "future image import smoke",
      "rollbackPlan": "return to Gate 1A proof-only Python evidence"
    },
    {
      "layer": "system dependencies layer",
      "includes": ["minimal compiler/runtime libraries only if future static review approves them"],
      "excludes": ["FFmpeg", "ffprobe", "libsndfile", "sox", "soundtouch", "aubio", "madmom", "codec binaries", "GPU drivers"],
      "owner": "WORKER_RUNTIME_JOBS with TRACK_A_RENDER_EXPORT and TRACK_B_MEDIA_PROCESSING handoff",
      "approvalNeeded": "system/binary owner approval before adding binaries",
      "validationNeeded": "future static dependency review",
      "rollbackPlan": "drop system dependency additions and keep CPU Python-only plan"
    },
    {
      "layer": "Python requirements layer",
      "includes": ["13 pinned packages from server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"],
      "excludes": ["model-weight packages", "provider SDK execution", "media-open proof", "runtime requirements copy"],
      "owner": "SOUND_MUSIC_AUDIO with WORKER_RUNTIME_JOBS handoff",
      "approvalNeeded": "Gate 1D runtime owner approval before image install proof",
      "validationNeeded": "future package install and import smoke inside image",
      "rollbackPlan": "revert to existing requirements source and no image package layer"
    },
    {
      "layer": "ReEditPro worker code layer",
      "includes": ["future worker entrypoint placeholder only"],
      "excludes": ["worker code changes", "route code", "queue mutation", "artifact write implementation"],
      "owner": "WORKER_RUNTIME_JOBS",
      "approvalNeeded": "worker implementation prompt family",
      "validationNeeded": "future static contract check",
      "rollbackPlan": "remove placeholder plan before implementation"
    },
    {
      "layer": "validation/proof layer",
      "includes": ["future Dockerfile static review", "future image import smoke", "future no-media smoke"],
      "excludes": ["Docker build in Gate 1C", "Cloud Run execution", "media processing", "FFmpeg/ffprobe execution"],
      "owner": "WORKER_RUNTIME_JOBS and COMPLIANCE_SECURITY",
      "approvalNeeded": "Gate 1E static Dockerfile plan before Dockerfile authoring",
      "validationNeeded": "future CI plan review",
      "rollbackPlan": "discard planned proof stage with no runtime changes"
    },
    {
      "layer": "runtime-disabled default policy layer",
      "includes": ["runtime-disabled flags", "no media open defaults", "no Supabase/artifact defaults"],
      "excludes": ["runtime readiness", "worker execution", "route execution", "tool execution", "beta/production unlock"],
      "owner": "WORKER_RUNTIME_JOBS and PRODUCT_BETA_READINESS",
      "approvalNeeded": "runtime owner handoff before enabling any job path",
      "validationNeeded": "future runtime disabled assertion",
      "rollbackPlan": "preserve all disabled defaults"
    }
  ],
  "systemDependencyPolicy": {
    "ffmpegFfprobeInGate1cImagePlan": false,
    "libsndfileSoxSoundtouchAubioMadmomInGate1cImagePlan": false,
    "codecMetadataBinariesInGate1cImagePlan": false,
    "modelWeightsInGate1cImagePlan": false,
    "gpuRuntimeInGate1cImagePlan": false
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
