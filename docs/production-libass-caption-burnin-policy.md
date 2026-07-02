# Production Libass Caption Burnin Policy

libass is used through FFmpeg for subtitle burn-in when an approved caption artifact requires it.

M16A accepts only validated private caption files and allowlisted FFmpeg/libass filter plans. Arbitrary ASS/libass args and unvalidated caption injection are blocked.

Caption burn-in is disabled by default and skips safely when FFmpeg/libass support or safe caption paths are unavailable.
