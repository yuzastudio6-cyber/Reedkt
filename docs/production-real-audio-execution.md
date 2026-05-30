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

Phase 36C verified the generated-audio DeepFilterNet runtime only. The completed
run `phase36c-20260530T133009` copied approved private DeepFilterNet artifacts,
verified checksums, generated a synthetic audio fixture, ran the approved
DeepFilterNet CLI, and wrote private enhanced-audio metrics. This does not
approve real-video audio AI cleanup, RNNoise, Demucs, providers, Revideo,
production, external beta, or broad real media. Phase 36D remains the first
allowed controlled real-video audio AI cleanup sample.

Phase 36D completed the controlled real-video DeepFilterNet audio cleanup sample
for `phase36d-20260530T141724` using the approved Phase 32 private export only.
It created a private cleaned WAV, private metrics/QA, and a private review MP4,
but it is not final delivery and does not approve arbitrary media, RNNoise,
Demucs, providers, Revideo, FILM, slow motion, production, external beta, paid
production, or broad real media.

Phase 36E completed the private DeepFilterNet audio feature E2E gate for
`phase36e-20260530T152327`. It used the approved Phase 32 private export and
Phase 36D evidence only; local Finder media such as
`/Users/macuser/Downloads/IMG_6024.MOV` was not part of this phase. The result
permits internal DeepFilterNet feature testing only and does not approve final
delivery, production, external beta, paid production, or broad real media.

Phase 36F completed the audio system internal readiness closure for
`phase36f-20260530T161352`. It verified Phase 31 and Phase 36A-36E evidence,
checked private Phase 36E artifacts in GCS, and documented FFmpeg loudness plus
DeepFilterNet as the only initial internal audio feature scope. RNNoise, Demucs,
providers, Revideo, FILM, slow motion, arbitrary media, external beta, paid
production, production-ready status, and broad media remain blocked.
