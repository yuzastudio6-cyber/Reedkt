# Production Speech Caption Runbook

Milestone 7 is safe to validate without faster-whisper, model files, FFmpeg, or libass installed.

## Modes

1. `dry_run`: validates contracts and builds transcript/caption/QA outputs from mock or provided structured transcript data.
2. `local_dev`: may use local audio, local model references, and local temp output paths only when the relevant tools already exist.
3. `production_blocked`: refuses real transcription, caption render, or export.

## Smoke Validation

Run:

```powershell
npm.cmd run smoke:prod-speech-caption
```

The smoke verifies transcript normalization, filler/repeated-take candidates, caption segmentation, caption file builders, caption QA, private artifacts, local-dev skip behavior, production-blocked behavior, raw prompt rejection, signed URL rejection, and no Revideo usage.

If faster-whisper, a local model, FFmpeg, or libass are unavailable, local-dev portions skip gracefully. No model download is attempted.
