# Production Faster-Whisper GPU Policy

faster-whisper and CTranslate2 are the planned production transcription runtime for GPU speech workers.

Milestone 11 declares package readiness and model-weight manifest placeholders only. Local or production transcription must not run unless a later milestone provides an approved local model path or reviewed model-weight manifest.

Production transcription remains blocked until model weights, language coverage, confidence behavior, privacy, and caption/transcript QA are approved.

The canonical candidate definition now lives in
`canonical-faster-whisper-cloud-run-gpu-execution-admission.md`. It pins the
four-file `Systran/faster-whisper-small` CTranslate2 runtime set and requires
Google Cloud Run GPU, CUDA, and `float16` with no CPU fallback. This definition
does not add Faster Whisper to the exact 50-tool production registry or
authorize inference, dispatch, model ingest, artifact writes, QA, or
production.
