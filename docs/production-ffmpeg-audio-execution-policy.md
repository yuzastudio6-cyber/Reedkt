# Production FFmpeg Audio Execution Policy

M15A allows FFmpeg for audio loudness analysis and loudness normalization only through server-built command plans.

Rules:

- command args are allowlisted;
- arbitrary FFmpeg args from payloads are rejected;
- signed URLs and path traversal are rejected;
- source audio is never overwritten;
- output paths must stay under an explicit safe output root;
- local-dev execution requires `enableFfmpegAudioExecution=true`;
- dry-run and container-ready modes create command metadata only;
- final mux/export is out of scope.

FFmpeg availability is not required for dry-run smoke validation. If FFmpeg is unavailable in local dev, the runner returns a structured skip reason.
