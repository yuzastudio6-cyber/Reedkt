# Production Libass Caption Burnin Policy

libass is used through FFmpeg for subtitle burn-in when an approved caption artifact requires it.

M16A accepts only validated private caption files and allowlisted FFmpeg/libass filter plans. Arbitrary ASS/libass args and unvalidated caption injection are blocked.

Caption burn-in is disabled by default and skips safely when FFmpeg/libass support or safe caption paths are unavailable.

The safe readiness proof command is `npm run beta:tools:libass-container-proof-preflight`. It checks only FFmpeg filter metadata and can reduce the libass execution-evidence blocker when an approved host/container exposes `ass` or `subtitles` filters. It must not burn subtitles, process media, mount private artifacts, accept arbitrary libass args, or mark product-ready local OSS before caption burn-in/font QA passes.
