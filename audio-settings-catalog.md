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

## AudioFlux Launch Analysis Settings

- `sampleRate`
- `monoStereo`
- `trimStart`
- `trimEnd`
- `onsetDetection`
- `bpmDetection`
- `beatPositions`
- `rhythmFeatures`
- `energyCurve`
- `noveltyCurve`
- `confidenceThreshold`
- `outputTimingMap`

AudioFlux is the launch candidate for SoundSync audio analysis. Essentia is not selected for launch and should remain future/evaluation only unless a later legal/product review re-enables it.

## Signalsmith Stretch Launch Settings

- `stretchRatio`
- `pitchShiftSemitones`
- `inputSampleRate`
- `outputSampleRate`
- `preserveFormants`
- `qualityMode`
- `maxRecommendedStretchRatio`
- `sceneFitTargetSeconds`
- `qaListenRequired`

Signalsmith Stretch is the launch candidate for moderate music time-stretch and pitch adjustment. Rubber Band is not selected for launch and should remain future/evaluation only unless a later legal/product review re-enables it.

## FFmpeg LGPL Configuration Settings

- `configureProfile`
- `enableGpl`
- `enableNonfree`
- `codecPolicy`
- `outputContainer`
- `audioCodec`
- `videoCodec`
- `pixelFormat`
- `crf`
- `bitrate`
- `muxingMode`

FFmpeg launch planning assumes LGPL-safe configuration only. GPL/nonfree flags, codec choices, and patent/commercial exposure require review before production use.

## Sharp + libvips Asset Settings

- `resizeWidth`
- `resizeHeight`
- `fitMode`
- `imageFormat`
- `quality`
- `alphaHandling`
- `watermarkPosition`
- `metadataHandling`
- `optionalLoaderPolicy`
- `untrustedUploadPolicy`

Sharp + libvips is the launch candidate for backend/worker image and asset preparation. Optional dependencies, untrusted image handling, and LGPL compliance require production review.

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

## Launch Tool Boundaries

- FFmpeg owns loudness normalization, trim/silence cleanup, audio filters, and future mux/export planning.
- AudioFlux owns launch onset/rhythm/audio feature and SoundSync timing analysis planning.
- Signalsmith Stretch owns launch moderate music time-stretch and pitch adjustment planning.
- librosa and whisper.cpp remain future/prototype research tools.
- Essentia and Rubber Band are not selected for launch defaults.
- No audio tool runs from this frontend/mock catalog.

## SoundSync Transition Timing Settings

RP-TIMING-03 adds mock settings for beat-grid confidence, snap tolerance, music phrase sections, transition duration frames, SFX density, and ducking attack/release frames. These settings are planning metadata only.

Speech-safe snap decisions prefer phrase boundaries over beats when a beat would cut important words. AudioFlux is the future analysis candidate for beat, onset, and energy analysis. Signalsmith Stretch remains stretch/pitch-only. Essentia and Rubber Band are not launch defaults.

## Timing Validation Settings

Timing validation uses the planned settings to flag missing ducking, high SFX density, beat sync that is not speech-safe, and timing complexity that affects credits. These checks remain structured mock validation only and do not execute audio tools.
