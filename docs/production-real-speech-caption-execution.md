# Production Real Speech Caption Execution

Milestone 13 turns the speech/caption foundation into a controlled execution path. The flow is faster-whisper transcription, transcript JSON, word timestamps, caption segments, SRT/WebVTT/ASS text, caption QA, and optional local-dev caption preview.

Real transcription is explicit and gated. Dry-run uses a mock transcript fixture. Local-dev can run faster-whisper only when the tool and model already exist locally, model downloads are disabled, paths are safe, and execution is explicitly enabled.

M13 does not deploy, run `gcloud`, call providers, download models, run smart cuts, run audio cleanup, run color/mask tools, render final exports, or make Revideo core.

M16A final render/export consumes private transcript, caption segment, and caption file artifacts for caption layers and optional libass burn-in after render/export QA gates pass.
