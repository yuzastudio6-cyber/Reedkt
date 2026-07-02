# Production SAM2 Execution Policy

SAM2 is the segmentation/tracking and propagation candidate for video masks, subject tracking, and text-behind-subject support.

Production execution requires an approved `sam2_checkpoint` manifest. Checkpoint license and commercial-use review are separate from the code license.

M15C does not download checkpoints or run production GPU jobs. Local-dev SAM2 paths skip cleanly when the package, checkpoint, or safe source media is unavailable.
