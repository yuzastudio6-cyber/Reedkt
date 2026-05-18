# Launch Tool Stack Update

## Purpose

ReeditPro has replaced higher-risk audio/tool choices with a cleaner launch candidate stack. This update is documentation and mock planning only: it does not install, execute, approve, or deploy any worker tool.

Updated worker/tool candidates:

- VapourSynth for worker-only frame/native video pipeline planning.
- FFmpeg LGPL Configuration for ingest, audio extraction, trimming, final encode, and export.
- AudioFlux for audio analysis and SoundSync features.
- Signalsmith Stretch for music time-stretching and pitch adjustment.
- Sharp + libvips for thumbnails, watermarks, resize, overlay graphics, and image/asset processing.

## What Changed

Essentia is removed from the launch SoundSync analysis stack. AudioFlux replaces it for onset, rhythm, audio feature, beat/drop, and timing-map planning.

Rubber Band is removed from the launch stretch/pitch stack. Signalsmith Stretch replaces it for moderate music-bed duration fitting, time-stretch, and pitch adjustment planning.

If Essentia or Rubber Band remain in registry references, they must be marked as `not_selected_for_launch`, `future_evaluation`, or `blocked_until_review`, and they must not be used as default launch tools.

## Launch Stack Policy

| Area | Launch candidate |
| --- | --- |
| Video/frame pipeline | VapourSynth, FFmpeg LGPL Configuration |
| Audio analysis | AudioFlux |
| Music stretch / pitch | Signalsmith Stretch |
| Image/asset pipeline | Sharp + libvips |
| Final encode/export | FFmpeg LGPL Configuration |

## Tool Notes

### VapourSynth

- Worker-only frame/video pipeline candidate.
- LGPL v2.1 working assumption.
- Useful for frame-level video processing and Python-native frame pipeline planning.
- Plugins require separate review.
- Production status: `approved_candidate`, `needs_lgpl_compliance_review`, `needs_plugin_review`.

### FFmpeg LGPL Configuration

- Worker-only ingest/export candidate.
- Must use LGPL-safe build configuration until reviewed.
- Do not enable GPL or nonfree flags unless legal/build review approves them.
- Configure flags, codecs, H.264/MP4/WebM patent exposure, and commercial usage need review.
- Production status: `required_candidate`, `needs_build_config_review`, `needs_codec_patent_review`.

### AudioFlux

- Worker-only audio analysis candidate.
- MIT working assumption.
- Useful for onset/rhythm/audio feature analysis and SoundSync cue planning.
- Needs accuracy benchmark for BPM, beat-drop, onset, rhythm, and SoundSync timing use cases.
- Production status: `approved_candidate`, `needs_accuracy_benchmark`.

### Signalsmith Stretch

- Worker-only music stretch/pitch candidate.
- MIT working assumption.
- Useful for time-stretch, pitch adjustment, and fitting music beds to scene length.
- Best for moderate changes; extreme stretch ratios need QA or regeneration.
- Production status: `approved_candidate`, `needs_audio_quality_benchmark`.

### Sharp + libvips

- Backend/worker asset pipeline candidate.
- Sharp Apache 2.0 working assumption; libvips LGPL working assumption.
- Useful for thumbnails, resizing, overlay assets, watermarks, and image prep.
- Optional dependencies and untrusted image handling need dependency/security review.
- Production status: `approved_candidate`, `needs_lgpl_compliance_review`, `needs_dependency_security_review`.

## Not Selected For Launch

- Essentia: replaced by AudioFlux for launch audio analysis planning; future evaluation only unless legal/product review re-enables it.
- Rubber Band: replaced by Signalsmith Stretch for launch stretch/pitch planning; future evaluation only unless legal/product review re-enables it.

## Non-Goals

This task does not install tools, execute tools, approve legal production use, create backend workers, create storage/jobs, implement media processing, or make legal conclusions.
