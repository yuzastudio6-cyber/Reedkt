# SOUND-RUNTIME-MEDIA-GATE-0 Media Runtime Policy Plan

Media runtime policy remains closed. This packet records the gates that must be cleared before any real audio file open, media operation, preview handoff, or export handoff.

```json sound-runtime-media-gate-0-media-runtime-policy-plan
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-0",
  "decision": "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan",
  "mediaReadWriteGates": [
    {
      "gateId": "audioread_file_open",
      "toolIds": ["audioread"],
      "status": "blocked",
      "reason": "file-open warning remains attached until media policy owner approval"
    },
    {
      "gateId": "pydub_media_operations",
      "toolIds": ["pydub", "pydub_effects"],
      "status": "blocked",
      "reason": "media operations require FFmpeg or avconv policy and binary handoff"
    },
    {
      "gateId": "ffmpeg_ffprobe_handoff",
      "toolIds": ["ffmpeg", "ffprobe"],
      "status": "blocked",
      "reason": "Track A and Track B owners must approve binary, LGPL, and media handling policy"
    },
    {
      "gateId": "private_manifest",
      "toolIds": ["private_audio_artifact_manifest_builder", "timing_aware_cue_manifest_builder"],
      "status": "blocked",
      "reason": "private artifact manifest policy must be approved before storage or preview handoff"
    },
    {
      "gateId": "preview_export_handoff",
      "toolIds": ["audio_qa_tool", "music_ducking_mix_qa"],
      "status": "blocked",
      "reason": "preview and final export remain Track A/render-owner handoffs"
    }
  ],
  "defaultPolicies": {
    "realUserData": "blocked",
    "mediaProcessing": "blocked",
    "fileWrite": "blocked",
    "signedUrlCreation": "blocked",
    "publicArtifactCreation": "blocked",
    "supabaseStorageMutation": "blocked",
    "finalRenderExport": "blocked",
    "betaUnlock": "blocked",
    "productionUnlock": "blocked"
  },
  "allowedNow": {
    "docsOnlyPolicyMapping": "yes",
    "audioFileOpen": "no",
    "ffmpegProbe": "no",
    "pydubOperation": "no",
    "previewArtifact": "no",
    "exportArtifact": "no"
  },
  "nextPrompt": "SOUND-RUNTIME-MEDIA-GATE-3: media policy owner handoff, no execution"
}
```
