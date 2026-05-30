# Production DeepFilterNet RNNoise Policy

DeepFilterNet is the active internal speech cleanup tool. RNNoise is retained only as inactive historical scaffolding after Phase 36G.

Milestone 9 adds adapter scaffolds and skip behavior only. Local-dev execution is allowed only when explicitly enabled and the tool is already installed. No models are downloaded.

DeepFilterNet production use requires model-weight review and deployment approval. RNNoise is not an active fallback candidate after Phase 36G.

Phase 36A records DeepFilterNet as the first staging planning recommendation
only. It does not approve a DeepFilterNet download or runtime because the exact
artifact source, checksum plan, private storage path, and no-runtime-download
constraint are still missing.

RNNoise is removed from active product fallback routing. Any future reconsideration would require a new approval phase, exact model pinning, and checksum evidence before execution.

Phase 36G update: DeepFilterNet remains the active internal speech cleanup path. RNNoise is removed from active product fallback routing and must not be auto-selected for internal beta jobs.

Current product-flow update: DeepFilterNet owns Clean Voice, Enhance Speech,
Remove Background Noise, Speech Denoise, and Voice Cleanup. Demucs owns
vocal/music/stem separation only. RNNoise remains inactive and unreachable.
