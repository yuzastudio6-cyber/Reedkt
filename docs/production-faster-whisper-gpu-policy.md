# Production Faster-Whisper GPU Policy

faster-whisper and CTranslate2 are the planned production transcription runtime for GPU speech workers.

Milestone 11 declares package readiness and model-weight manifest placeholders only. Local or production transcription must not run unless a later milestone provides an approved local model path or reviewed model-weight manifest.

Production transcription remains blocked until model weights, language coverage, confidence behavior, privacy, and caption/transcript QA are approved.

## Activation Phase 26

Phase 26 approves only `Systran/faster-whisper-tiny` for staging
speech/caption planning and records faster-whisper/CTranslate2 runtime evidence.
This is not production approval, not external beta approval, and not proof that
weights are available in the runtime path. Phase 28 execution still needs a
separate explicit model download/load step and controlled real-video approval.

Phase 26B stores the approved tiny model in private staging GCS with revision
and checksum evidence. Runtime loading, transcription execution, GPU deployment,
production use, external beta, and broad real user media testing remain blocked.
