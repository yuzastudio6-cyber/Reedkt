# Production SAM2 Execution Policy

SAM2 is the segmentation/tracking and propagation candidate for video masks, subject tracking, and text-behind-subject support.

Production execution requires an approved `sam2_checkpoint` manifest. Checkpoint license and commercial-use review are separate from the code license.

M15C does not download checkpoints or run production GPU jobs. Local-dev SAM2 paths skip cleanly when the package, checkpoint, or safe source media is unavailable.

## Activation Phase 35A

Phase 35A adds a static SAM2 model approval workflow. Existing evidence records
`facebook/sam2-hiera-tiny` and official `facebookresearch/sam2` source/license
claims, but human legal/model approval is not recorded.

Phase 35A does not download checkpoints, run SAM2, run GPU jobs, process media,
deploy Cloud Run, mutate storage, or approve full-video masks. Phase 35B remains
blocked until an exact checkpoint, license/provenance approval, private storage
path, and checksum plan are approved.

## Activation Phase 35B

Phase 35B stores only the approved SAM2.1 tiny checkpoint/config in private
staging GCS. It records source evidence, file checksums, an aggregate checksum,
and upload verification.

Phase 35B is not SAM2 execution approval. Phase 35C must separately verify
runtime loading on generated/synthetic fixtures only before any controlled
real-video temporal tracking phase can be considered.

## Activation Phase 35C

Phase 35C verified SAM2 runtime loading on generated/synthetic frames only for
`phase35c-20260529T16082`. It built, deployed, and executed the dedicated
staging SAM2 runtime job with the approved SAM2.1 tiny checkpoint/config copied
from private GCS.

Phase 35C is not real-video tracking approval. Full-video masks,
text-behind-subject video, production, external beta, broad real media,
providers, Revideo, FILM, and slow motion remain blocked after this phase.
