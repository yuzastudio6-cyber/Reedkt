# Fixed SAM2 private GPU runtime candidate

This package is the server-owned source boundary for
`tool.sam2.segment_and_track_subject.v1`.

It accepts one bounded JSON request on standard input and reads only:

- `/mnt/reeditpro/private-input/source.mp4`;
- `/mnt/reeditpro/model-artifacts/sam2-hiera-small/sam2.1_hiera_small.pt`.

It writes create-only private outputs under
`/mnt/reeditpro/private-output` and returns a digest-only JSON receipt.
The runner refuses CPU fallback, runtime downloads, network fetches,
caller paths, caller commands, caller environment, extra model files, and
pre-existing outputs.

The Dockerfile intentionally derives from the exact locally inspected
`proof-local` image. That image is a private qualification input, not a
released production image. A signed/scanned release image, the exact
checkpoint read-only mount, and real Cloud Run L4 inference evidence remain
separate required gates.
