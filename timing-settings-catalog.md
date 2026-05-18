# Timing Settings Catalog

This catalog defines planned timing settings for ReeditPro. It is mock planning only and does not execute media analysis, audio processing, transcript alignment, rendering, providers, or worker tools.

## Timing Base Settings

- `fps`: planning frame rate for frame math
- `totalDurationSeconds`: final edit duration for display
- `totalFrames`: final edit duration in frames
- `sourceDurationSeconds`: source duration estimate
- `finalDurationSeconds`: final edit duration estimate
- `frameRoundingMode`: floor, ceil, or round
- `minimumCueDurationFrames`: shortest useful cue
- `defaultTransitionFrames`: default transition duration
- `defaultCaptionHoldFrames`: default caption hold duration

## Caption Timing Settings

- `chunkingMode`: phrase, sentence, word-emphasis, or custom
- `maxWordsPerCaption`
- `minCaptionDurationFrames`
- `maxCaptionDurationFrames`
- `captionLeadInFrames`
- `captionLagFrames`
- `emphasisWordTiming`
- `captionAnimationInFrames`
- `captionAnimationOutFrames`
- `captionHoldFrames`
- `captionSafeGapFrames`

## Visual Timing Settings

- `revealTimingMode`
- `visualLeadInFrames`
- `visualHoldFrames`
- `visualExitFrames`
- `cardRevealFrames`
- `mapPinDropFrames`
- `routeRevealFrames`
- `chartBuildFrames`
- `browserZoomFrames`
- `strokeMotionDurationSeconds`
- `aiVideoClipDurationSeconds`
- `visualReadTimePerWordFrames`

## Transition Timing Settings

- `transitionType`
- `transitionDurationFrames`
- `cutOnBeat`
- `cutOnPhraseBoundary`
- `avoidCuttingWords`
- `preserveEmotionalPause`
- `matchMotionDirection`
- `transitionSfxCue`

## Beat And SoundSync Settings

- `bpm`
- `beatGridConfidence`
- `beatPositions`
- `downbeatPositions`
- `onsetPositions`
- `dropMoments`
- `energyCurve`
- `cueSnapToleranceFrames`
- `beatCutPriority`
- `visualRevealOnBeat`
- `captionEmphasisOnBeat`
- `sfxOnBeat`

## Music Ducking Settings

- `duckingEnabled`
- `duckStartFrame`
- `duckEndFrame`
- `duckAttackFrames`
- `duckReleaseFrames`
- `duckingStrength`
- `voicePriority`
- `preserveMusicDrop`
- `preserveEmotionalPause`

## Remotion Timing Settings

- `compositionFps`
- `sequenceStartFrame`
- `sequenceDurationFrames`
- `layerStartFrame`
- `layerEndFrame`
- `zIndexTiming`
- `layerOverlapFrames`
- `preRollFrames`
- `postRollFrames`

## Timing QA Thresholds

- `captionTooShortFrames`
- `captionTooLongFrames`
- `wordCutRisk`
- `visualReadTimeMinimum`
- `sfxTooCloseToSpeechFrames`
- `transitionTooLongFrames`
- `beatMisalignmentToleranceFrames`
- `layerOverlapWarning`
- `blackGapDetection`
- `emotionalPauseMinimumFrames`

## Timing Presets

- `clean_basic_timing`: clean cuts, readable captions, simple visual timing, minimal SFX
- `pro_social_timing`: tighter social pacing, cue-based visual reveals, moderate SoundSync
- `premium_story_timing`: scene-level cue timing, richer SFX/visual/music coordination
- `documentary_measured_timing`: restrained cuts, evidence read time, protected pauses
- `education_explainer_timing`: phrase-based reveals and readable labels
- `business_premium_timing`: problem/feature/benefit/CTA timing with clean motion
- `lifestyle_natural_timing`: natural pauses and light captions/music
- `high_retention_timing`: faster hooks and tighter visual/caption cues
- `cinematic_emotional_timing`: longer emotional holds and restrained transitions
- `custom`: user-directed timing plan
