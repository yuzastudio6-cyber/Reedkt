# Production BiRefNet And SAM2 Policy

BiRefNet and SAM2 are future GPU candidates for background removal, segmentation, temporal tracking, and mask support.

Milestone 11 does not produce masks, run segmentation, or process media. BiRefNet and SAM2 package/source paths are pending install review, and their checkpoints require separate model-weight review before paid production.

BiRefNet-related weights must not be assumed commercial-safe as a group. SAM2 code approval does not approve SAM2 checkpoints.

## Activation Phase 33A

Phase 33A approves only `ZhengPeng7/BiRefNet` for staging
representative-frame/single-frame background-removal planning. The approval is
not production approval and does not permit model download, GPU deployment,
mask execution, text-behind-subject, or broad real media.

`facebook/sam2-hiera-tiny` and Meta SAM2 official checkpoints/code are
evaluated-only. SAM2 execution stays blocked until a later video tracking and
mask-propagation approval phase.

## Activation Phase 35A

Phase 35A is that later SAM2 review phase, but it remains non-mutating. It
records SAM2 as a future staging-planning candidate for temporal masks while
blocking Phase 35B readiness until human legal/model approval is recorded for an
exact checkpoint, checksum plan, and private storage path.

Phase 35A does not download SAM2 weights, run SAM2, deploy GPU jobs, process
media, or approve temporal tracking. Full-video masks, full-video
text-behind-subject, production, external beta, paid production, broad real
media, providers, and Revideo remain blocked.

## Activation Phase 35B

Phase 35B downloads and loads only `sam2.1_hiera_tiny.pt` and
`sam2.1_hiera_t.yaml` into private staging model storage. Official SAM2 source
evidence is treated as clear for this staging-only download, and Codex records
the Apache-2.0 license decision with checksums and private GCS object evidence.

Phase 35B still does not run SAM2, deploy GPU jobs, process media, or approve
temporal tracking. Full-video masks, full-video text-behind-subject,
production, external beta, paid production, broad real media, providers, and
Revideo remain blocked.

## Activation Phase 33C

Phase 33C verified BiRefNet runtime loading on one generated synthetic image
using the approved Phase 33B snapshot from private staging storage. It executed
only local allowlisted BiRefNet loader files from that verified snapshot and did
not import `handler.py`.

SAM2, arbitrary real-video masks, text-behind-subject, production, external
beta, and broad real-media execution remain blocked.

## Activation Phase 33D

Phase 33D used only `ZhengPeng7/BiRefNet` on exactly one representative frame
from the approved Phase 32 private export. It did not use SAM2, did not create a
full-video mask sequence, and did not execute text-behind-subject.

The result is staging evidence for the single controlled frame-mask path only.
SAM2, production, external beta, broad real media, full-video masks, and public
delivery remain blocked.
