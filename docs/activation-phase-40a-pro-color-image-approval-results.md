# Phase 40A Pro Color/Image Approval Results

Status: `approval_review_complete`

Track: A visual/video

Base: `origin/codex/rp-activation-38d-real-video-film-slowmotion-sample`

Preferred base unavailable: `origin/codex/rp-activation-38e-film-private-feature-e2e-readiness`

## Decision

Phase 40A approves staging planning only for OpenColorIO, OpenImageIO, and
Kornia. The decision is `staging_planning_approved` for generated-fixture
runtime planning in Phase 40B only.

## Tool Decisions

- OpenColorIO: approved for future planning around professional color
  management, LUT/look transforms, OCIO config validation, color-space
  transforms, and ACES/config-aware validation.
- OpenImageIO: approved for future planning around robust image/frame I/O,
  metadata inspection, decode/write validation, image sequence validation, and
  image/color format compatibility checks.
- Kornia: approved for future planning around local image-processing helpers,
  image metrics, frame-difference/quality helpers, and generated-fixture visual
  QA helpers. Kornia model/provider-style features remain blocked.
- FFmpeg/FFprobe: existing ownership is preserved for video stream probe/decode,
  signalstats/media validation, approved frame extraction, and export integrity.

## Evidence

- OpenColorIO official repo: `https://github.com/AcademySoftwareFoundation/OpenColorIO`
- OpenColorIO README: `https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenColorIO/main/README.md`
- OpenColorIO license: `https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenColorIO/main/LICENSE`
- OpenImageIO official repo: `https://github.com/AcademySoftwareFoundation/OpenImageIO`
- OpenImageIO README: `https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenImageIO/master/README.md`
- OpenImageIO license: `https://raw.githubusercontent.com/AcademySoftwareFoundation/OpenImageIO/master/LICENSE.md`
- Kornia official repo: `https://github.com/kornia/kornia`
- Kornia README: `https://raw.githubusercontent.com/kornia/kornia/master/README.md`
- Kornia license: `https://raw.githubusercontent.com/kornia/kornia/master/LICENSE`

## Phase 40B Readiness

Ready for generated-fixture pro color/image runtime planning only.

Readiness criteria:

- official source/license evidence is recorded for all three tools
- tool scope ownership is explicit
- command plans are text-only and blocked in Phase 40A
- future generated-fixture runtime remains a separate Phase 40B approval
- real-video, final delivery, providers, Revideo, production, beta, paid
  production, and broad media remain blocked

## Blocked Gates

- runtime install: false
- pro color/image runtime: false
- generated-fixture runtime in Phase 40A: false
- real-video pro color/image execution: false
- final delivery: false
- provider execution: false
- Revideo: false
- production: false
- external beta: false
- paid production: false
- broad real user media: false

## Warnings

- Preferred Phase 38E base branch was unavailable, so Phase 40A is based on
  completed Phase 38D and documents this fallback.
- Runtime dependency transitive licenses and native packaging must be reviewed
  in Phase 40B before any installation or image build.
- Color/image metrics cannot replace human visual review for controlled
  real-video samples.
