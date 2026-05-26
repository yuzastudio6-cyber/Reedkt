# Production GPU Model Weight Policy

Model/checkpoint weights are reviewed separately from package and code licenses. A permissive repository license does not approve a model for paid production.

## Production Blockers

Production execution is blocked when model weights are:

- missing from the approved manifest registry;
- unknown license;
- non-commercial;
- `needs_review`, `not_reviewed`, `blocked`, or `evaluation_only`;
- missing commercial-use, redistribution, attribution, source, or checksum/provenance review.

Milestone 11 creates manifest templates only. No model files are committed, downloaded, or baked into Docker images.
