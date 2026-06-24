# Environment Base Compatibility

Current render-worker base in source truth remains `node:24-bookworm`.

Prior owner/environment evidence records that exact GPAC package-source compatibility is not safely approved for the current base:

- Debian source search showed exact source package `gpac` only in bullseye in prior evidence.
- Debian sid `gpac` is not a stable bookworm package source for this repo base.
- GPAC downloads do not provide a clean owner-approved current render-worker package source in committed source truth.

Compatibility decision: `blocked_no_owner_environment_source_approval_for_gpac_mp4box`.

Dockerfile patch: `none`. Requirements patch: `none`. Package-lock patch: `none`.
