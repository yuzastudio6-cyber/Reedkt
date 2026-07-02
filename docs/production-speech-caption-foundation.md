# Production Speech Caption Foundation

Milestone 7 adds the server-only speech, transcript, word timestamp, caption segment, caption file, and caption QA foundation for the production tool runtime.

Milestone 8 consumes transcript segments, word timestamps, filler candidates, repeated-take candidates, and caption segments as structured evidence for smart cut and timeline planning. Smart cut does not own transcription and does not alter transcript artifacts.

Milestone 9 can consume speech and caption timing for voice-first loudness, ducking, naturalness, and SoundSync cue planning. Audio planning does not own transcription or caption rendering.

Milestone 10 adds FFmpeg/libass readiness declarations for future caption preview and subtitle burn-in support. It does not render final subtitles or install/download speech models.

This is not smart cutting, audio cleanup, provider transcription, production GPU execution, final subtitle burn-in, or final export. It prepares controlled artifacts and QA records that later workers can execute after approved snapshots, credit gates, model-weight approval, and deployment gates are in place.

## Flow

1. A worker payload references an approved snapshot, tool execution plan, idempotency key, and private audio/caption artifact references.
2. `speech-foundation-runner` validates the payload, rejects raw prompt or signed URL fields, and runs in `dry_run`, `local_dev`, or `production_blocked`.
3. The speech foundation prepares transcript JSON, word timestamp JSON, filler candidates, repeated-take candidates, and a speech analysis update for `MediaAnalysisReport`.
4. `caption-foundation-runner` converts transcript/word timestamps into readable caption segments.
5. Caption file builders prepare SRT, WebVTT, and ASS text with controlled style presets and no unsafe ASS override injection.
6. Caption QA creates `QualityGateResult` records for readability, timing, safe-zone placement, and transcript alignment.

## Not Included

- no smart cuts or retake removal
- no audio cleanup, demucs, DeepFilterNet, or loudness processing
- no OCR, face analysis, or real safe-zone CV analysis
- no production faster-whisper model execution
- no model downloads
- no provider calls
- no final render/export
- no Revideo usage

Caption and transcript outputs are private structured artifacts, not raw chat instructions for workers.
## Milestone 13 Execution Layer

M13 builds on the M7 foundation by adding controlled real execution for faster-whisper and deterministic caption file generation. The M7 builders remain the shared normalization, caption segmentation, file, and QA layer.
## Milestone 14 Smart Cut Consumption

M14 consumes transcript artifact IDs, word timestamps, and caption refs to validate cut boundaries and timeline layers. Speech/caption modules still own transcription and caption generation; smart cut execution only consumes approved artifacts and timing evidence.
