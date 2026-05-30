# Phase 38C FILM Runtime Policy

Phase 38C is Track A generated-frame runtime verification only.

Allowed:

- Copy the approved Phase 38B FILM SavedModel tree from private staging GCS.
- Verify the four Phase 38B file checksums and aggregate checksum.
- Build, push, deploy, and execute one CPU Cloud Run Job.
- Generate two synthetic RGB frames and one midpoint interpolated frame.
- Upload private generated-frame and QA artifacts.

Blocked:

- Real video, user media, and the Phase 28-32 real-video chain.
- Real-video slow motion and full-video interpolation.
- Runtime model downloads or alternate FILM model trees.
- Providers, Revideo, public URLs, public buckets, production, external beta,
  paid production, and broad real media.

The approved model prefix is:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/`

The aggregate SHA-256 is:

`6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b`
