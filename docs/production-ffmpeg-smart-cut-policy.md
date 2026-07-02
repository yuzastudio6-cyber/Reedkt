# Production FFmpeg Smart Cut Policy

M14 FFmpeg usage is limited to allowlisted preview-only trim and concat command plans.

Rules:

- no arbitrary FFmpeg args from user input;
- no final export or mux for delivery;
- no source/proxy overwrite;
- no signed URLs as source-of-truth inputs;
- local-dev execution only when `enableProxyPreview=true`, FFmpeg is available, input paths are safe, and cut QA passes;
- dry-run and container-ready modes build command plans without executing them.

The command builder returns structured command metadata. It does not execute by itself.
