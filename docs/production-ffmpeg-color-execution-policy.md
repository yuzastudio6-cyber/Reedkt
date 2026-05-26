# Production FFmpeg Color Execution Policy

M15B allows FFmpeg for preview-only color correction command plans.

Rules:

- use allowlisted `eq`, safe pixel format, short preview, and optional approved `lut3d`;
- reject arbitrary FFmpeg args;
- reject source/proxy overwrite;
- reject signed URLs and path traversal;
- write only under an explicit safe output root;
- run only in `local_dev` with `enableFfmpegColorPreview=true`;
- never final export.

Dry-run and container-ready modes create command metadata only. If FFmpeg is unavailable, local-dev preview returns a structured skip reason.
