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
feature gates. It recommends DeepFilterNet first for future staging planning,
keeps RNNoise as a fallback planning candidate, and keeps Demucs restricted to
future source-separation review. It does not approve audio AI download,
runtime, media processing, providers, production, external beta, or broad real
media.

Phase 36B may download/load only the approved DeepFilterNet v0.5.6 artifacts to
private staging model storage. Runtime verification remains Phase 36C and must
start with generated audio only; real-video audio AI cleanup remains blocked
until later controlled QA.
