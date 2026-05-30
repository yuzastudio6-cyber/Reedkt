# Production DeepFilterNet RNNoise Policy

DeepFilterNet and RNNoise are worker-only audio cleanup tools.

Milestone 9 adds adapter scaffolds and skip behavior only. Local-dev execution is allowed only when explicitly enabled and the tool is already installed. No models are downloaded.

DeepFilterNet production use requires model-weight review and deployment approval. RNNoise is a lightweight fallback candidate, but production execution is still blocked until a future runtime milestone.

Phase 36A records DeepFilterNet as the first staging planning recommendation
only. It does not approve a DeepFilterNet download or runtime because the exact
artifact source, checksum plan, private storage path, and no-runtime-download
constraint are still missing.

RNNoise remains fallback planning only. Future RNNoise use must pin any model
file that would otherwise be fetched during build/runtime and record checksums
before execution.
