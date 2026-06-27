# Production Libass Caption Burnin Policy

libass is used through FFmpeg for subtitle burn-in when an approved caption artifact requires it.

M16A accepts only validated private caption files and allowlisted FFmpeg/libass filter plans. Arbitrary ASS/libass args and unvalidated caption injection are blocked.

Caption burn-in is disabled by default and skips safely when FFmpeg/libass support or safe caption paths are unavailable.

The safe readiness proof command is `npm run beta:tools:libass-container-proof-preflight`. It checks only FFmpeg filter metadata and can reduce the libass execution-evidence blocker when an approved host/container exposes `ass` or `subtitles` filters. It must not burn subtitles, process media, mount private artifacts, accept arbitrary libass args, or mark product-ready local OSS before caption burn-in/font QA passes.

The next safe QA command is `npm run beta:tools:libass-synthetic-burnin-qa-preflight`. It creates only temporary synthetic color video and ASS caption fixtures, runs a bounded libass subtitle burn-in, probes the output, records checksums/sizes/duration, verifies the safe ASS style preset, and removes temp artifacts. It may emit product-ready local OSS evidence for `libass` only with explicit production and product-ready acceptance confirmations. It still does not use user/private media, GCS artifacts, public artifacts, providers, Supabase writes, live beta, paid production, or final delivery.

After synthetic QA passes, operators can run `npm run beta:tools:libass-synthetic-burnin-qa-evidence-preflight` and then `npm run beta:tools:libass-synthetic-burnin-qa-evidence` against deployed staging. The collector reruns the synthetic QA locally, posts only the accepted `libass` evidence packet to `/v1/beta-readiness/evidence` with auth/idempotency, and fails closed if deployed readback does not include accepted `libass` evidence. This recording step still does not clear platform billing/deployment evidence or launch approvals by itself.

Open PR #73 remains historical activation/private-media context for an old source branch. This policy keeps that duplicate-adjacent evidence as context only; current beta readiness must use the synthetic preflight or a later approved deployed evidence packet before recording current source-of-truth acceptance.
