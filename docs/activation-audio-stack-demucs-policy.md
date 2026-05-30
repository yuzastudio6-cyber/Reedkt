# Phase 36G Audio Stack Demucs Policy

Phase 36G separates product intent from model approval.

DeepFilterNet is approved for internal speech cleanup from the Phase 36B-36F
chain. It must not be presented as vocal/music/stem separation.

Demucs is the product engine for vocal/music/stem separation only, behind an
approved-model manifest gate. It must not be described as a general denoise or
speech-enhancement tool.

RNNoise is not an active product fallback after Phase 36G. Historical adapters
may remain in the codebase only if removing them would create unsafe unrelated
churn, but product routing must not select RNNoise.

Demucs non-mock runtime requires:

- a company-controlled model artifact
- `approval.json`
- model card, license, and provenance records
- SHA-256 checksum verification
- commercial-use and redistribution posture
- `DEMUCS_ALLOW_RUNTIME_DOWNLOADS=false`

The official Demucs code license is MIT, but model weights remain separate
artifacts. Phase 36G blocks runtime auto-download and unapproved htdemucs use;
it permits product/API/mock routing and fails closed until the approved artifact
manifest passes.
