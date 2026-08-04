# SAM2 immutable historical evidence (new execution disabled)

This directory is retained only so an immutable historical SAM2 artifact can
be audited against the operation version that originally produced it. It is
not an active image source, runtime candidate, fallback, repair path, or new
plan dependency. New segmentation/tracking work must use the separately
qualified `tool.sam3_1.segment_and_track_subject.v1` route.

There is no package, CI, deployment, or active GPU-worker Dockerfile reference
that builds this directory. The generic GPU router rejects the SAM2 operation
before request admission, the direct SAM2 subprocess factory throws before a
child process can spawn, and the active GPU image carries no SAM2 checkpoint.
Do not build, tag, push, mount, dispatch, or cost this historical directory.

For historical audit context only, the former fixed worker expected one
bounded JSON request on standard input and read only:

It accepts one bounded JSON request on standard input and reads only:

- `/mnt/reeditpro/private-input/source.mp4`;
- `/mnt/reeditpro/model-artifacts/sam2-hiera-small/sam2.1_hiera_small.pt`.

It writes create-only private outputs under
`/mnt/reeditpro/private-output` and returns a digest-only JSON receipt.
The runner refuses CPU fallback, runtime downloads, network fetches,
caller paths, caller commands, caller environment, extra model files, and
pre-existing outputs.

The retained Dockerfile and runner are non-authoritative historical source
evidence. Their former `proof-local` base was never a released production
image, and they may not be used to satisfy any current runtime, quality, cost,
or production gate.
