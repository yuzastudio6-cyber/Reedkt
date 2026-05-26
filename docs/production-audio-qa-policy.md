# Production Audio QA Policy

Milestone 9 emits audio QA gates:

- `audio_loudness`: target loudness, true peak, clipping risk, and measurement availability.
- `audio_sync`: placeholder gate for future waveform/timeline sync checks.
- `audio_naturalness`: overprocessing, robotic artifact risk, clipping review, and cleanup strength.
- `music_over_voice`: music/speech overlap and ducking status.

Blocking or warning gates can block future preview/final export. Milestone 9 records gates only and does not render/export.
