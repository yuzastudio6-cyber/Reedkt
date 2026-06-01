# Phase 36G Audio Stack Demucs Policy

Phase 36G separates product intent from model approval.

DeepFilterNet is approved for internal speech cleanup from the Phase 36B-36F
chain. It must not be presented as vocal/music/stem separation.

Demucs is the product candidate for vocal/music/stem separation only. It must
not be described as a general denoise or speech-enhancement tool.

RNNoise is not an active product fallback after Phase 36G. Historical adapters
may remain in the codebase only if removing them would create unsafe unrelated
churn, but product routing must not select RNNoise.

Demucs htdemucs download/runtime requires separate approval of:

- exact official model artifact source
- SHA-256 checksum plan
- private GCS model storage
- pretrained model license/provenance
- commercial-use and redistribution posture

The official Demucs code license is MIT, but the pretrained model license
question remains unresolved in the archived official repository. Phase 36G
therefore blocks Demucs artifact download and runtime.
