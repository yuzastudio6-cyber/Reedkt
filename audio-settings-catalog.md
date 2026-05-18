# Audio Settings Catalog

This catalog defines planned settings for audio cleanup, SoundSync, music, SFX, and audio QA. It is frontend/mock planning only; no audio tool runs from this catalog.

## Voice Cleanup Settings

- `voiceCleanupEnabled`
- `noiseReduction`
- `noiseReductionStrength`
- `deEssing`
- `eqCleanup`
- `compression`
- `voiceLeveling`
- `breathReduction`
- `fillerPauseHandling`
- `silenceCleanup`
- `preserveEmotionalPauses`
- `targetVoiceLoudness`
- `truePeakLimit`

## Loudness Settings

- `loudnessTarget`
- `integratedLoudnessTarget`
- `truePeakTarget`
- `loudnessRangeTarget`
- `normalizationMode`
- `platformTarget`
- `speechPriority`

## Music Bed Settings

- `musicPolicy`
- `musicStyle`
- `musicEnergy`
- `musicVolume`
- `duckingEnabled`
- `duckingStrength`
- `duckingAttack`
- `duckingRelease`
- `introMusicAllowed`
- `outroMusicAllowed`
- `musicFadeIn`
- `musicFadeOut`
- `musicMoodMatch`
- `musicMustNotOverpowerVoice`

## SFX Settings

- `sfxPolicy`
- `sfxIntensity`
- `allowedSfxTypes`
- `transitionSfx`
- `impactHits`
- `risers`
- `whooshes`
- `uiPops`
- `mapPinDrops`
- `countUpTicks`
- `evidenceCardHits`
- `maxSfxPerMinute`
- `avoidRandomSfx`

## Beat / SoundSync Settings

- `bpmDetection`
- `beatGridEnabled`
- `onsetDetection`
- `cutOnBeat`
- `visualRevealOnBeat`
- `captionEmphasisOnBeat`
- `sfxOnBeat`
- `musicBeatSync`
- `emotionalPauseProtection`
- `transitionBeatAlignment`

## Audio Analysis Settings

- `sampleRate`
- `monoStereo`
- `trimStart`
- `trimEnd`
- `voiceClarityScore`
- `backgroundNoiseLevel`
- `musicPresent`
- `speechMusicSeparationNeeded`
- `energyCurve`
- `moodDetection`
- `silenceRanges`
- `fillerDensity`

## SoundSync Cue Settings

- `cueType`
- `cueTime`
- `linkedSegmentId`
- `linkedVisualAssetId`
- `linkedRendererLayerId`
- `intensity`
- `soundStyle`
- `reason`
- `qaChecks`

## Tier Presets

- `clean_voice_basic`: voice cleanup, level consistency, silence cleanup, no random SFX, music optional/minimal.
- `subtle_premium_soundsync`: subtle bed, ducking, tasteful transition cues, visual reveal timing, better SoundSync.
- `documentary_serious_audio`: serious tone, restrained music, low-intensity SFX, voice-first.
- `educational_clean_audio`: voice clarity, minimal music, labels/steps not overpowered.
- `cinematic_emotional_soundsync`: stronger emotional pacing, music cues, preserved pauses, deeper ducking plan.
- `high_retention_social_soundsync`: beat sync, impact hits, faster cue density, only when the user wants high energy.
- `advanced_mix_qa`: stronger loudness, ducking, SFX QA, and scene-by-scene audio notes.

## QA Thresholds

Planned QA thresholds include voice too quiet warning, music over voice warning, clipping warning, background noise warning, too many SFX warning, long silence warning, ducking missing warning, and SFX without reason warning.
