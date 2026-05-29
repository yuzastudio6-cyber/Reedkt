# Phase 35C SAM2 Runtime Policy

Phase 35C is limited to generated/synthetic SAM2 runtime verification.

Required gates:

- load only `sam2.1_hiera_tiny.pt` and `sam2.1_hiera_t.yaml` from private
  Phase 35B GCS storage
- verify checkpoint, config, and aggregate checksums before inference
- run on Cloud Run L4 with one GPU, 4 CPU, 16Gi memory, parallelism 1, and
  max retries 0
- generate the fixture inside the job
- emit private artifacts only

Blocked after Phase 35C:

- real-video temporal tracking
- full-video masks
- full-video text-behind-subject
- production, paid production, external beta, and broad real media
- providers, Revideo, FILM, and slow motion
