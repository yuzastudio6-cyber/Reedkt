# Production Audio Sound Foundation

Milestone 9 adds the audio cleanup, loudness, music/speech, and SoundSync planning foundation for ReeditPro production runtime.

The flow is:

1. consume extracted audio/media analysis from Milestone 6;
2. consume speech/caption timing from Milestone 7 when available;
3. consume smart cut/timeline metadata from Milestone 8 when available;
4. build deterministic audio analysis summaries;
5. build voice cleanup, loudness, music ducking, SFX density, and SoundSync cue plans;
6. build private audio artifacts and audio QA gates.

Milestone 9 does not final mux, render, export, call providers, download model weights, or run production GPU audio jobs.

Milestone 10 adds FFmpeg/ffprobe core readiness for safe loudness/version checks only. Audio AI tools such as DeepFilterNet and Demucs remain skip-first scaffolds until later GPU/model install milestones approve packages and model weights.

Milestone 15A builds on this foundation with controlled audio execution planning, optional local-dev FFmpeg loudness/normalization, private cleaned-audio and SoundSync metadata artifacts, and audio QA gates. It still does not final mux/export, download model weights, run production GPU audio jobs, overwrite source audio, or use Revideo.

Phase 36A is the first audio AI approval workflow after the controlled SAM2
feature gates. It recommends DeepFilterNet first for future staging planning.
Phase 36G supersedes the earlier fallback-planning note for RNNoise: RNNoise is
removed from active product routing, and Demucs stays restricted to future
source-separation review until model provenance is approved. It does not
approve audio AI download, runtime, media processing, providers, production,
external beta, or broad real media.

Phase 36B may download/load only the approved DeepFilterNet v0.5.6 artifacts to
private staging model storage. Runtime verification remains Phase 36C and must
start with generated audio only; real-video audio AI cleanup remains blocked
until later controlled QA.

Phase 36D completed that first controlled real-video audio AI cleanup sample for
`phase36d-20260530T141724`. It was locked to the approved Phase 32 private
export and Phase 31 audio reference, used only the private Phase 36B
DeepFilterNet artifacts, and remains private review only. RNNoise, Demucs,
arbitrary media, providers, Revideo, FILM, slow motion, production, beta, broad
media, and final delivery remain blocked.

Phase 36E completed the private DeepFilterNet audio feature E2E gate on the
same approved controlled chain for `phase36e-20260530T152327`. It created a
private review package and a local backup copy for Finder review, but GCS
remains the source of truth and production, external beta, paid production,
broad media, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow
motion, and final delivery remain blocked.

Phase 36F closed internal audio feature testing readiness for the audio system
with `phase36f-20260530T161352`. The internal scope includes FFmpeg loudness and
DeepFilterNet only.

Phase 36G records RNNoise as removed from active audio routing and Demucs as the
future vocal/music/stem separation candidate. Demucs remains blocked because
the official pretrained-model license/provenance evidence is ambiguous, so no
Demucs model download, runtime, media processing, Docker, or Cloud Run job is
approved. External beta, paid production, broad media, arbitrary media,
providers, Revideo, FILM, slow motion, and production remain blocked.
