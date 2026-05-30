# Phase 35D Real-Video SAM2 Temporal Mask Policy

Allowed scope:

- one approved private Phase 32 video only
- Phase 33D representative frame, mask, and cutout as anchor evidence only
- segment 6.9s-8.9s, maximum 2.0 seconds
- maximum 12 frames; implementation target is 10 frames
- bounded frame dimensions: 768x432
- approved Phase 35B `sam2.1_hiera_tiny` checkpoint/config only
- Cloud Run L4, one GPU, 4 CPU, 16Gi, max retries 0

Approval gates:

- source URI locks must match policy exactly
- model path/checksums must match Phase 35B
- runtime must confirm CUDA on NVIDIA L4
- prompt must be derived from the Phase 33D mask/frame evidence
- artifacts must remain private
- no blocked feature flag may be enabled

Blocked after Phase 35D:

- full-video mask tracking
- full-video text-behind-subject
- text-behind-subject video execution
- production, paid production, external beta, and broad real media
- providers, Revideo, FILM, and slow motion
