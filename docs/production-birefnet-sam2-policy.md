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
