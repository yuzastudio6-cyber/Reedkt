# Production Audio Sound Runbook

Milestone 9 can be validated without FFmpeg, DeepFilterNet, RNNoise, Demucs, SoundTouch, Signalsmith Stretch, model files, providers, or GPU runtime.

## Modes

1. `dry_run`: validates inputs and builds analysis summaries, cleanup/loudness/ducking/SoundSync plans, artifacts, and QA gates from structured/mock evidence.
2. `local_dev`: may run safe FFmpeg loudness probing on generated temp audio or explicit local-dev audio paths; model tools remain skip-first unless already installed and explicitly enabled.
3. `production_blocked`: refuses real cleanup, separation, SoundSync processing, mux, or export.

Run:

```powershell
npm.cmd run smoke:prod-audio-sound
```

The smoke skips unavailable tools gracefully and never downloads model weights.
