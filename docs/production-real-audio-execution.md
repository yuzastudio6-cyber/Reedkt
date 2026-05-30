# Production Real Audio Execution

Milestone 15A turns the Milestone 9 audio planning foundation into a controlled server-only execution path.

The flow is:

1. validate approved snapshot, execution plan, idempotency, and private audio artifact refs;
2. build an `AudioExecutionPlan`;
3. prepare allowlisted FFmpeg loudness and normalization command plans;
4. optionally run local-dev FFmpeg against safe local/generated audio only;
5. keep DeepFilterNet, RNNoise, and Demucs skip-safe and model-weight gated;
6. write private cleaned-audio, stem, SoundSync metadata, and QA artifact records;
7. emit `audio_loudness`, `audio_sync`, `audio_naturalness`, and `music_over_voice` gates.

M15A does not final mux, render, color grade, run masks, deploy, call providers, download models, run GPU production jobs, overwrite source audio, or use Revideo.

M16A final render/export consumes private cleaned-audio, stem, SoundSync, and QA artifacts for audio layers and final audio sync checks.

Phase 36A adds a non-mutating audio AI approval layer after the SAM2 feature
gate. DeepFilterNet is the first planning recommendation for future staging
review, RNNoise is fallback planning only, and Demucs is restricted/deferred for
source separation. No Phase 36A command may download an audio AI artifact, run
audio AI, process media, mutate GCP, call providers, or unlock production,
external beta, or broad real media.

Phase 36B is narrower than runtime: it may store only the selected
DeepFilterNet v0.5.6 CLI and DeepFilterNet3 ONNX archive in private staging GCS
with checksum/source/license evidence. It still does not run DeepFilterNet,
RNNoise, Demucs, media processing, Docker, Cloud Run, providers, Revideo, FILM,
slow motion, production, external beta, or broad real media.
