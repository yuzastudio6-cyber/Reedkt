# Sound/Music/Audio Open-Source Tool Controlled Install Change Log

Decision: `sound_oss_tools_3_controlled_dependency_install_completed_ready_for_binary_import_proof`

This change log records the exact repository changes made by SOUND-OSS-TOOLS-3. It does not record import proof, binary proof, audio processing, media processing, runtime readiness, Supabase readiness, beta readiness, or production readiness.

```json sound-oss-tools-3-controlled-install-change-log
{
  "phase": "SOUND-OSS-TOOLS-3",
  "decision": "sound_oss_tools_3_controlled_dependency_install_completed_ready_for_binary_import_proof",
  "sourceBase": "954c45c8d3cd9c028289b4a4f451e56c3909d08f",
  "trackedChanges": [
    {
      "path": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
      "changeType": "added",
      "purpose": "Scoped worker Python requirements manifest for approved SOUND direct packages.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
      "changeType": "added",
      "purpose": "Controlled dependency-install result and source audit evidence.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/sound-music-audio-open-source-tool-controlled-install-change-log.md",
      "changeType": "added",
      "purpose": "Machine-readable change log for SOUND-OSS-TOOLS-3.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/sound-music-audio-open-source-tool-controlled-install-rollback-report.md",
      "changeType": "added",
      "purpose": "Rollback and removal plan for the scoped SOUND manifest.",
      "containsRuntimeCode": false
    },
    {
      "path": "docs/implementation-prompts/prompt-sound-oss-tools-4-binary-import-proof.md",
      "changeType": "added",
      "purpose": "Next metadata/proof prompt; no media processing.",
      "containsRuntimeCode": false
    },
    {
      "path": "scripts/validation/sound-oss-tools-3-controlled-dependency-install-diagnostics.mjs",
      "changeType": "added",
      "purpose": "Built-ins-only diagnostic for SOUND-OSS-TOOLS-3 evidence.",
      "containsRuntimeCode": false
    },
    {
      "path": "package.json",
      "changeType": "updated",
      "purpose": "Adds npm script sound-oss-tools-3:diagnostics.",
      "containsRuntimeCode": false
    }
  ],
  "manifestDirectPins": [
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
  "notAddedToManifest": [
    "pydub_effects",
    "ebu_r128_pyloudnorm",
    "signalsmith_stretch",
    "demucs",
    "rnnoise",
    "essentia",
    "pyrubberband",
    "rubberband_cli",
    "ffmpeg",
    "ffprobe"
  ],
  "packageLockChanged": false,
  "nodePackageDependencyChanged": false,
  "runtimeFilesChanged": false,
  "supabaseFilesChanged": false,
  "sqlFilesChanged": false,
  "mediaArtifactsCreated": false,
  "nextPrompt": "SOUND-OSS-TOOLS-4: binary/import proof, no media processing"
}
```
