# Production Libass Caption Burnin Policy

libass is used through FFmpeg for subtitle burn-in when an approved caption artifact requires it.

M16A accepts only validated private caption files and allowlisted FFmpeg/libass filter plans. Arbitrary ASS/libass args and unvalidated caption injection are blocked.

Caption burn-in is disabled by default and skips safely when FFmpeg/libass support or safe caption paths are unavailable.

Phase 45A verified FFmpeg/libass burn-in only for a bounded private 5-second preview from the approved Phase 32 export and the existing Phase 28 ASS caption sidecar. This validation does not approve final delivery, arbitrary media, public previews, production, external beta, broad real media, providers, Revideo, or Track B tools.
