# Phase 38A FILM Slow-Motion Approval Policy

Phase 38A belongs to Track A visual/video only. Track B audio/OCR work is out of scope.

Official evidence:

- Repository: `https://github.com/google-research/frame-interpolation`
- Project page: `https://film-net.github.io/`
- License: Apache-2.0 from the official repository license file
- Checkpoint source: official README Google Drive TF2 Saved Models folder
- Recommended first Phase 38B candidate: `film_net/Style/saved_model`

Phase 38A allows staging planning only. The approval decision does not approve downloads, runtime, media processing, Docker/GCP mutation, public output, providers, Revideo, production, external beta, paid production, or broad real-media testing.

Hard false gates:

- `filmDownloadAllowed=false`
- `filmRuntimeAllowed=false`
- `slowMotionAllowed=false`
- `realVideoSlowMotionAllowed=false`
- `fullVideoInterpolationAllowed=false`
- `providerAllowed=false`
- `revideoAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `paidProductionAllowed=false`
- `broadRealUserMediaAllowed=false`
