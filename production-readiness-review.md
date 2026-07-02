# Production Readiness Review

This document is not legal advice. It summarizes production-readiness blockers for the current ReeditPro planning prototype and future worker stack. The current repository remains frontend/mock planning only.

## Current Status

ReeditPro has a connected mock planning system, typed planner contracts, inline planning UI cards, validation/regression checks, and documented future worker boundaries. It does not yet implement backend persistence, real credits, provider calls, media processing, worker execution, storage, rendering, export, or legal approval.

## Updated Worker-Only Tool Candidates

Launch worker/tool candidates:

- VapourSynth: worker-only frame/native video pipeline candidate. LGPL v2.1 working assumption. Plugins require separate review.
- FFmpeg LGPL Configuration: required worker/export/ingest candidate. Needs LGPL-safe build configuration, configure flag documentation, codec review, and patent/commercial exposure review.
- AudioFlux: launch audio analysis candidate for onset, rhythm, beat/drop, audio feature, and SoundSync cue planning. Needs accuracy benchmark.
- Signalsmith Stretch: launch music stretch/pitch candidate for moderate music fitting. Needs audio quality benchmark.
- Sharp + libvips: asset/image worker candidate for thumbnails, resize, overlays, watermarks, and image prep. Needs dependency/security/LGPL review.

Future/evaluation-only tools may include OpenCV, OpenColorIO, OpenImageIO, Playwright, librosa, whisper.cpp, VapourSynth plugins, and other controlled tools after review. Their presence in planning docs does not mean they are installed, approved, or executable.

## Audio Pipeline Readiness

Launch SoundSync analysis candidate: AudioFlux.

Launch stretch/pitch candidate: Signalsmith Stretch.

Essentia is not selected for launch audio analysis. Rubber Band is not selected for launch stretch/pitch. If either is referenced later, it should be marked future/evaluation only and blocked until review.

## Production Blockers

- FFmpeg must have documented LGPL-safe configuration and codec/patent review before production use.
- VapourSynth plugins require separate license and security review.
- Sharp + libvips optional dependencies and untrusted image handling require dependency/security review.
- AudioFlux needs accuracy benchmarks for BPM, beat-drop, onset/rhythm, and SoundSync timing use cases.
- Signalsmith Stretch needs quality benchmarks for common stretch and pitch ranges.
- Backend worker runtime, storage, job orchestration, credit ledger, approved snapshot persistence, user privacy/redaction, and export pipeline remain future work.
- Provider integrations, AI generation, and real rendering remain disabled until explicit future milestones.

## Launch Guardrails

- Basic and Pro must never route to Veo.
- Premium may use Veo only as final fallback/rescue.
- Remotion owns final canvas/composition.
- AI models generate assets/clips only.
- Open-source tools are separate from provider models.
- Workers execute approved snapshots after user approval and credit reservation.
- No future tool execution should bypass auth, privacy rules, robots/rate limits, site restrictions, or production review.
