# Production Smart Cut Preview Policy

Smart cut preview is local-dev only in M14.

Preview requirements:

- `mode: local_dev`;
- `enableProxyPreview=true`;
- FFmpeg available;
- source or proxy local path is safe and not a signed URL;
- output path stays inside the safe output directory;
- source/proxy file is never overwritten;
- cut validation passes.

The preview is a proxy review artifact, not final delivery. If FFmpeg or safe paths are unavailable, preview skips with a clear reason.
