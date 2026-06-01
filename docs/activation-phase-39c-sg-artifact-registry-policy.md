# Phase 39C-SG Artifact Registry Policy

The only approved image destination for this phase is:

`us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-sglang`

The runtime report must record the pushed image tag and digest before Cloud Run execution can be treated as valid evidence.

No public images, public buckets, signed URLs, production repositories, or broad image tags are allowed as source of truth.
