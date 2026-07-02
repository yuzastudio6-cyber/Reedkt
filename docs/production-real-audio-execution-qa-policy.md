# Production Real Audio Execution QA Policy

M15A emits four required audio QA gates:

- `audio_loudness`: target LUFS, true peak, and normalization status;
- `audio_sync`: sync preservation placeholder until final mux/render milestones;
- `audio_naturalness`: overprocessing, robotic artifact risk, and model-tool approval;
- `music_over_voice`: voice-first ducking and separation warnings.

Blocking issues prevent preview readiness and always block future final export. Final export remains out of scope for M15A.
