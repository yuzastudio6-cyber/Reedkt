# SOUND-OSS-TOOLS-0 Stack Inventory Validation Results

This result records the intended validation surface for the inventory packet. It is updated by the implementation validation run and does not claim runtime execution.

```json sound-oss-tools-0-validation-results
{
  "phase": "SOUND-OSS-TOOLS-0",
  "decision": "sound_oss_tools_0_stack_inventory_gap_audit_completed_ready_for_license_provenance_approval",
  "filesInspected": [
    "docs/cross-chat-tool-ownership-registry.md",
    "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
    "docs/tool-studies/sound-music-audio-tool-study.md",
    "docs/tool-route-execution-unlock-0-repo-audit.md",
    "docs/worker-runtime-repo-audit.md",
    "package.json"
  ],
  "prEvidenceInspected": ["PR #418", "PR #373", "PR #371", "PR #360", "PR #215", "PR #258", "PR #266", "PR #268", "PR #275", "PR #407", "PR #412"],
  "toolsFound": 61,
  "candidatesEvaluated": 65,
  "soundOwnedTools": ["audioflux", "signalsmith_stretch", "deepfilternet", "soundtouch", "librosa", "sox", "libsndfile", "soundfile", "audioread", "pydub", "scipy_signal", "resampy", "soxr", "pyloudnorm", "aubio", "music21", "pretty_midi", "mido", "fluidsynth_pyfluidsynth", "noisereduce", "pedalboard", "mir_eval", "sfx_director_tool", "music_cue_planner", "ambient_sound_planner", "soundsync_cue_planning", "music_ducking_mix_qa", "audio_qa_tool", "private_audio_artifact_manifest_builder", "timing_aware_cue_manifest_builder", "action_foley_sfx_tool", "ambient_everyday_soundscape_tool"],
  "governanceOnlyTools": ["demucs", "rnnoise", "rubber_band", "essentia", "spleeter", "open_unmix", "asteroid", "speechbrain_enhancement", "pyrubberband", "rubberband_cli", "ladspa_lv2_host", "basic_pitch", "crepe", "torchcrepe"],
  "referenceOrHandoffOnlyTools": ["ffmpeg", "ffprobe", "mediainfo", "exiftool", "opus_tools", "flac_metaflac", "vorbis_tools", "wavpack", "whisper_cpp", "faster_whisper", "pyannote_audio", "lyria", "mirelo_sfx_v1_5", "mmaudio_v2"],
  "blockedTools": ["demucs", "rnnoise", "rubber_band", "essentia", "spleeter", "open_unmix", "asteroid", "speechbrain_enhancement", "basic_pitch", "crepe", "torchcrepe", "lyria", "mirelo_sfx_v1_5", "mmaudio_v2", "ffmpeg", "ffprobe", "remotion"],
  "missingTools": ["sox", "mediainfo", "exiftool", "libsndfile", "opus_tools", "flac_metaflac", "vorbis_tools", "wavpack", "soundfile", "audioread", "pydub", "scipy_signal", "resampy", "soxr", "pyloudnorm", "aubio", "madmom", "vamp_sonic_annotator", "music21", "pretty_midi", "mido", "fluidsynth_pyfluidsynth", "basic_pitch", "noisereduce", "spleeter", "open_unmix", "asteroid", "speechbrain_enhancement", "pedalboard", "ladspa_lv2_host", "bs1770gain", "pyannote_audio", "crepe", "torchcrepe", "mir_eval"],
  "duplicateRisks": {"high": ["demucs", "lyria", "mirelo_sfx_v1_5", "mmaudio_v2"], "medium": ["ffmpeg", "ffprobe", "remotion", "deepfilternet", "rnnoise", "rubber_band", "essentia", "private_audio_artifact_manifest_builder"]},
  "ownershipConflicts": [],
  "licenseProvenanceUnknowns": ["audioflux", "signalsmith_stretch", "deepfilternet", "soundtouch", "librosa", "sox", "libsndfile", "aubio", "madmom", "spleeter", "open_unmix", "asteroid", "speechbrain_enhancement", "pedalboard"],
  "installProofRoadmapStatus": "created_no_install_no_execution",
  "validationCommandsRun": ["npm run sound-oss-tools-0:diagnostics", "npm run cross-chat-tool-ownership:diagnostics", "git diff --check", "git diff --cached --check"],
  "validationCommandsSkipped": ["dependency_backed_checks_if_node_modules_missing"],
  "packageLockStatus": "unchanged",
  "dryRunPassedStatus": "not_claimed",
  "generatedLocalFixturePassedStatus": "not_claimed",
  "runtimeReadiness": "not_claimed",
  "supabaseStatus": {"updateRequired": false, "environmentTouched": false, "sqlExecuted": false, "migrationDeployed": false, "nextAction": "none"},
  "nextPrompt": "SOUND-OSS-TOOLS-1: license/provenance approval before install, no execution"
}
```
