# Sound/Music/Audio Cross-Chat Duplicate Risk Register

Status: `sound_ownership_0_duplicate_risk_registered_no_execution`

Decision: `duplicate_risk_registered_ready_for_sound_oss_tools_0`

This register records where SOUND may duplicate another workstream if future prompts do not read the ownership registry first. No installation, execution, Supabase mutation, SQL, signed URL, public artifact, beta, production, `dry_run_passed`, `generated_local_fixture_passed`, or runtime-readiness claim is made.

| Tool or group | Suspected current owner | Duplicate-risk reason | SOUND allowed action | SOUND blocked action | Required handoff | Owner conflict |
| --- | --- | --- | --- | --- | --- | --- |
| `ffmpeg` | `TRACK_A_RENDER_EXPORT` | SOUND needs audio extraction/loudness metadata, but Track A owns final mux/export and FFmpeg runtime policy | Reference/handoff only | Running FFmpeg, approving codec/runtime policy | Track A render/export owner | no |
| `ffprobe` | `TRACK_B_MEDIA_PROCESSING` | SOUND needs media/audio metadata, but Track B owns general probe/runtime paths | Reference/handoff only | Running probes or claiming media-processing readiness | Track B media owner | no |
| `remotion` | `TRACK_A_RENDER_EXPORT` | SOUND timing cues feed composition, but Track A owns render/composition runtime | Handoff cue metadata | Rendering or claiming preview/export readiness | Track A render/export owner | no |
| `sharp` | `TRACK_B_MEDIA_PROCESSING` | SOUND may reference private artifact thumbnail/manifest needs, but image processing is not SOUND-owned | Reference only | Image processing, untrusted uploads, runtime readiness | Track B media owner | no |
| `lyria`, `mirelo_sfx_v1_5`, `mmaudio_v2` | `PROVIDER_GATEWAY_MODELS` | SOUND owns creative semantics, but provider transport/secrets/fallback are provider-gateway owned | Prompt/semantic handoff only | Provider/model calls, secret handling, fallback routing | Provider Gateway owner | no |
| `demucs` | `SOUND_MUSIC_AUDIO` | Candidate is audio-scoped but blocked by provenance/model-weight/commercial review | Record blocker and review needs | Running separation, downloading weights, default cleanup path | SOUND plus Worker/Observability model review | no |
| `rnnoise` | `SOUND_MUSIC_AUDIO` | Candidate is audio-scoped but inactive in source-of-truth | Record inactive status | Reactivation or execution without approval | SOUND owner acceptance | no |
| `rubber_band`, `essentia` | `SOUND_MUSIC_AUDIO` | Replaced by Signalsmith/AudioFlux for launch planning | Record future/evaluation status | Use as launch defaults | SOUND owner acceptance | no |
| Web capture tools | `WEB_SEARCH_CAPTURE` | Completed external owner evidence must not be recreated by SOUND | Reference only | Replacement study or browser capture | Web Search Capture owner | no |
| Map/geospatial tools | `MAP_GEOSPATIAL` | Completed external owner evidence must not be recreated by SOUND | Reference only | Replacement study or map rendering | Map/Geospatial owner | no |

## Machine-Readable Risk Register

```json duplicate-risk-register
{
  "schemaVersion": "sound_duplicate_risk_register_v1",
  "phase": "SOUND-OWNERSHIP-0",
  "decision": "duplicate_risk_registered_ready_for_sound_oss_tools_0",
  "ownerConflicts": [],
  "runtimeClaims": {
    "toolExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "workerExecutionAllowed": false,
    "providerExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlExecuted": false,
    "signedUrlsCreated": false,
    "publicArtifactsCreated": false,
    "betaReady": false,
    "productionReady": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "risks": [
    {"toolId":"ffmpeg","suspectedCurrentOwner":"TRACK_A_RENDER_EXPORT","reason":"SOUND audio handoff intersects final mux/export runtime ownership.","soundAllowedAction":"handoff-only","soundBlockedAction":"execute_or_own_runtime_policy","requiredHandoff":"TRACK_A_RENDER_EXPORT","ownerConflict":false,"nextPrompt":"Track A render/export owner prompt"},
    {"toolId":"ffprobe","suspectedCurrentOwner":"TRACK_B_MEDIA_PROCESSING","reason":"SOUND metadata needs intersect Track B media probing ownership.","soundAllowedAction":"handoff-only","soundBlockedAction":"execute_or_claim_media_runtime","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":false,"nextPrompt":"Track B media-processing owner prompt"},
    {"toolId":"remotion","suspectedCurrentOwner":"TRACK_A_RENDER_EXPORT","reason":"SOUND cue timing intersects final render/composition ownership.","soundAllowedAction":"handoff-only","soundBlockedAction":"render_or_claim_export_readiness","requiredHandoff":"TRACK_A_RENDER_EXPORT","ownerConflict":false,"nextPrompt":"Track A render/export owner prompt"},
    {"toolId":"sharp","suspectedCurrentOwner":"TRACK_B_MEDIA_PROCESSING","reason":"Private artifact/image prep is Track B owned, not SOUND owned.","soundAllowedAction":"reference-only","soundBlockedAction":"process_images_or_own_untrusted_upload_policy","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":false,"nextPrompt":"Track B media-processing owner prompt"},
    {"toolId":"lyria","suspectedCurrentOwner":"PROVIDER_GATEWAY_MODELS","reason":"SOUND owns music semantics but not provider transport/secrets.","soundAllowedAction":"handoff-only","soundBlockedAction":"provider_call_or_secret_handling","requiredHandoff":"PROVIDER_GATEWAY_MODELS","ownerConflict":false,"nextPrompt":"Provider Gateway owner prompt"},
    {"toolId":"mirelo_sfx_v1_5","suspectedCurrentOwner":"PROVIDER_GATEWAY_MODELS","reason":"SOUND owns SFX semantics but not provider transport/secrets.","soundAllowedAction":"handoff-only","soundBlockedAction":"provider_call_or_secret_handling","requiredHandoff":"PROVIDER_GATEWAY_MODELS","ownerConflict":false,"nextPrompt":"Provider Gateway owner prompt"},
    {"toolId":"mmaudio_v2","suspectedCurrentOwner":"PROVIDER_GATEWAY_MODELS","reason":"SOUND owns draft/fallback SFX semantics but not provider transport/secrets.","soundAllowedAction":"handoff-only","soundBlockedAction":"provider_call_or_secret_handling","requiredHandoff":"PROVIDER_GATEWAY_MODELS","ownerConflict":false,"nextPrompt":"Provider Gateway owner prompt"},
    {"toolId":"demucs","suspectedCurrentOwner":"SOUND_MUSIC_AUDIO","reason":"Audio-scoped candidate is blocked pending provenance/model-weight review.","soundAllowedAction":"blocked-review-only","soundBlockedAction":"run_separation_or_download_weights","requiredHandoff":"WORKER_RUNTIME_JOBS and OBSERVABILITY_AUDIT_COST before any runtime","ownerConflict":false,"nextPrompt":"SOUND-OSS-TOOLS-0"},
    {"toolId":"rnnoise","suspectedCurrentOwner":"SOUND_MUSIC_AUDIO","reason":"Inactive audio candidate requires source-of-truth approval before use.","soundAllowedAction":"inactive-record-only","soundBlockedAction":"reactivate_or_execute","requiredHandoff":"SOUND_MUSIC_AUDIO owner acceptance","ownerConflict":false,"nextPrompt":"SOUND-OSS-TOOLS-0"},
    {"toolId":"rubber_band","suspectedCurrentOwner":"SOUND_MUSIC_AUDIO","reason":"Future/evaluation only; Signalsmith is launch stretch candidate.","soundAllowedAction":"blocked-evaluation-record-only","soundBlockedAction":"launch_default_or_execute","requiredHandoff":"SOUND_MUSIC_AUDIO owner acceptance","ownerConflict":false,"nextPrompt":"SOUND-OSS-TOOLS-0"},
    {"toolId":"essentia","suspectedCurrentOwner":"SOUND_MUSIC_AUDIO","reason":"Future/evaluation only; AudioFlux is launch analysis candidate.","soundAllowedAction":"blocked-evaluation-record-only","soundBlockedAction":"launch_default_or_execute","requiredHandoff":"SOUND_MUSIC_AUDIO owner acceptance","ownerConflict":false,"nextPrompt":"SOUND-OSS-TOOLS-0"},
    {"toolId":"web_capture_tools","suspectedCurrentOwner":"WEB_SEARCH_CAPTURE","reason":"Completed owner evidence must not be duplicated by SOUND.","soundAllowedAction":"reference-only","soundBlockedAction":"replacement_study_or_browser_capture","requiredHandoff":"WEB_SEARCH_CAPTURE","ownerConflict":false,"nextPrompt":"Web Search Capture owner prompt"},
    {"toolId":"map_geospatial_tools","suspectedCurrentOwner":"MAP_GEOSPATIAL","reason":"Completed owner evidence must not be duplicated by SOUND.","soundAllowedAction":"reference-only","soundBlockedAction":"replacement_study_or_map_rendering","requiredHandoff":"MAP_GEOSPATIAL","ownerConflict":false,"nextPrompt":"Map/Geospatial owner prompt"}
  ]
}
```

## SOUND-OSS-TOOLS-0 Extension

This extension adds shared open-source stack candidates discovered during SOUND-OSS-TOOLS-0. It does not replace the PR #418 ownership registry.

```json sound-oss-tools-0-duplicate-risk-extension
{
  "phase": "SOUND-OSS-TOOLS-0",
  "decision": "duplicate_risk_extension_created_no_install_no_execution",
  "risks": [
    {"toolId":"ffmpeg","currentPrimaryOwner":"TRACK_A_RENDER_EXPORT","soundRole":"handoff-only","duplicateRisk":"medium","allowedSOUNDAction":"record audio handoff requirements","blockedSOUNDAction":"run FFmpeg or own export runtime","requiredHandoff":"TRACK_A_RENDER_EXPORT","ownerConflict":"no"},
    {"toolId":"ffprobe","currentPrimaryOwner":"TRACK_B_MEDIA_PROCESSING","soundRole":"handoff-only","duplicateRisk":"medium","allowedSOUNDAction":"record audio metadata needs","blockedSOUNDAction":"run probing or own media runtime","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":"no"},
    {"toolId":"mediainfo","currentPrimaryOwner":"TRACK_B_MEDIA_PROCESSING","soundRole":"reference-only","duplicateRisk":"medium","allowedSOUNDAction":"reference metadata requirements","blockedSOUNDAction":"own media metadata runtime","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":"no"},
    {"toolId":"exiftool","currentPrimaryOwner":"TRACK_B_MEDIA_PROCESSING","soundRole":"reference-only","duplicateRisk":"medium","allowedSOUNDAction":"reference private metadata needs","blockedSOUNDAction":"own untrusted upload metadata runtime","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":"no"},
    {"toolId":"remotion","currentPrimaryOwner":"TRACK_A_RENDER_EXPORT","soundRole":"handoff-only","duplicateRisk":"medium","allowedSOUNDAction":"record cue/timing handoff","blockedSOUNDAction":"render or compose final canvas","requiredHandoff":"TRACK_A_RENDER_EXPORT","ownerConflict":"no"},
    {"toolId":"pydub","currentPrimaryOwner":"SOUND_MUSIC_AUDIO","soundRole":"own","duplicateRisk":"medium","allowedSOUNDAction":"inventory transform candidate","blockedSOUNDAction":"use FFmpeg-backed runtime without Track A handoff","requiredHandoff":"TRACK_A_RENDER_EXPORT if FFmpeg is needed","ownerConflict":"no"},
    {"toolId":"faster_whisper","currentPrimaryOwner":"TRACK_B_MEDIA_PROCESSING","soundRole":"handoff-only","duplicateRisk":"medium","allowedSOUNDAction":"reference transcript/timing dependency","blockedSOUNDAction":"run transcription or approve model weights","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":"no"},
    {"toolId":"whisper_cpp","currentPrimaryOwner":"TRACK_B_MEDIA_PROCESSING","soundRole":"reference-only","duplicateRisk":"medium","allowedSOUNDAction":"reference speech timing dependency","blockedSOUNDAction":"run transcription or approve model weights","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":"no"},
    {"toolId":"pyannote_audio","currentPrimaryOwner":"TRACK_B_MEDIA_PROCESSING","soundRole":"reference-only","duplicateRisk":"medium","allowedSOUNDAction":"reference diarization dependency only","blockedSOUNDAction":"run diarization or own speech runtime","requiredHandoff":"TRACK_B_MEDIA_PROCESSING","ownerConflict":"no"},
    {"toolId":"lyria","currentPrimaryOwner":"PROVIDER_GATEWAY_MODELS","soundRole":"handoff-only","duplicateRisk":"high","allowedSOUNDAction":"define music semantics","blockedSOUNDAction":"provider call or secret handling","requiredHandoff":"PROVIDER_GATEWAY_MODELS","ownerConflict":"no"},
    {"toolId":"mirelo_sfx_v1_5","currentPrimaryOwner":"PROVIDER_GATEWAY_MODELS","soundRole":"handoff-only","duplicateRisk":"high","allowedSOUNDAction":"define SFX semantics","blockedSOUNDAction":"provider call or secret handling","requiredHandoff":"PROVIDER_GATEWAY_MODELS","ownerConflict":"no"},
    {"toolId":"mmaudio_v2","currentPrimaryOwner":"PROVIDER_GATEWAY_MODELS","soundRole":"handoff-only","duplicateRisk":"high","allowedSOUNDAction":"define draft/fallback SFX semantics","blockedSOUNDAction":"provider call or secret handling","requiredHandoff":"PROVIDER_GATEWAY_MODELS","ownerConflict":"no"},
    {"toolId":"private_audio_artifact_manifest_builder","currentPrimaryOwner":"SOUND_MUSIC_AUDIO","soundRole":"own","duplicateRisk":"medium","allowedSOUNDAction":"define manifest metadata","blockedSOUNDAction":"create Supabase rows, storage objects, or signed URLs","requiredHandoff":"SUPABASE_RLS_STORAGE_DATABASE","ownerConflict":"no"},
    {"toolId":"demucs","currentPrimaryOwner":"SOUND_MUSIC_AUDIO","soundRole":"governance-only","duplicateRisk":"high","allowedSOUNDAction":"record provenance/model blocker","blockedSOUNDAction":"download weights or run separation","requiredHandoff":"WORKER_RUNTIME_JOBS and OBSERVABILITY_AUDIT_COST","ownerConflict":"no"}
  ],
  "ownershipConflicts": [],
  "dryRunPassedClaimed": false,
  "generatedLocalFixturePassedClaimed": false,
  "runtimeReadinessClaimed": false,
  "supabaseMutationAllowed": false
}
```
