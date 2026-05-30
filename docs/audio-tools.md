# Audio Tools

## Active Product Routing

DeepFilterNet owns speech cleanup:

- Clean Voice
- Enhance Speech
- Remove Background Noise
- Speech Denoise
- Voice Cleanup

Demucs owns vocal/music/stem separation:

- Separate Vocals
- Remove Background Music
- Split Stems
- Create Instrumental
- Isolate Voice from Music

RNNoise is removed from active product routing. It must not appear in active UI
labels, fallback lists, or job selection paths.

## Demucs Runtime Gate

Demucs product flow is wired through UI, API, mock job status, stem listing, and
worker command planning. Non-mock runtime execution requires:

- `DEMUCS_ENABLED=true`
- `DEMUCS_MODEL_ID`
- `DEMUCS_MODEL_PATH`
- `DEMUCS_APPROVAL_PATH`
- `DEMUCS_ALLOW_RUNTIME_DOWNLOADS=false`
- approved `approval.json`
- matching model SHA-256

Demucs must fail closed if approval or checksum validation fails.

## User Rights Notice

Only upload, separate, export, or share audio that you own, have licensed, or
are legally permitted to use. Dukira does not grant rights to third-party songs,
vocals, instrumentals, or separated stems.
