# Phase 40A Pro Color/Image Approval Policy

Phase 40A approves staging planning only for a professional color/image stack:

- OpenColorIO: color management, LUT/look transforms, OCIO config validation,
  color-space transforms, ACES/config-aware validation, and reproducible
  professional color transforms.
- OpenImageIO: robust image/frame I/O, metadata inspection, frame decode/write
  validation, image sequence validation, and image/color format compatibility
  checks.
- Kornia: local image-processing helpers, image metrics, frame-difference and
  quality helpers, and generated-fixture visual QA helpers.
- FFmpeg/FFprobe: existing video stream probe/decode, signalstats/media
  validation, approved frame extraction, and export integrity.

Kornia model/provider-style features are not approved in Phase 40A.

## Evidence

- OpenColorIO official ASWF repo: `https://github.com/AcademySoftwareFoundation/OpenColorIO`
- OpenColorIO license: BSD-3-Clause from the official repository license file.
- OpenColorIO README evidence: motion-picture/VFX color management, ACES
  compatibility, and LUT-format agnostic behavior.
- OpenImageIO official ASWF repo: `https://github.com/AcademySoftwareFoundation/OpenImageIO`
- OpenImageIO license: Apache-2.0 from the official repository license file.
- OpenImageIO README evidence: VFX/animation image I/O, metadata, and image
  tools including `oiiotool`, `iinfo`, `iconvert`, and `idiff`.
- Kornia official repo: `https://github.com/kornia/kornia`
- Kornia license: Apache-2.0 from the official repository license file.
- Kornia README evidence: PyTorch-based image processing areas including color,
  filters, enhance, geometry, losses, features, and metrics.

## Gates

Allowed:

- `proColorImagePlanningAllowed=true`
- `openColorIOPlanningAllowed=true`
- `openImageIOPlanningAllowed=true`
- `korniaPlanningAllowed=true`

Blocked:

- runtime install
- pro color/image runtime execution
- generated-fixture execution in Phase 40A
- real-video pro color/image execution
- final delivery
- provider calls
- Revideo
- production
- external beta
- paid production
- broad real user media
