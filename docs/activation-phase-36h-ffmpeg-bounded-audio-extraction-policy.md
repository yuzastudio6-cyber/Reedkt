# Phase 36H FFmpeg Bounded Audio Extraction Policy

ffmpeg and ffprobe are required only for the approved controlled sample bounded window. Phase 36H-LINUX must not run full-video cleanup or arbitrary media extraction.

Allowed extraction:

- Source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Sample ID: `phase37d-phase32-color-export-safe-zone-window-v1`
- Chain ID: `controlled-real-video-chain-phase28-through-phase32-v1`
- Source SHA-256: `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa`
- Window: `6.9s-8.9s`
- Output: temp/private 48 kHz mono PCM WAV only

If this bounded window is not speech-suitable, Phase 36H remains incomplete unless an already approved controlled speech/caption sample is discoverable in committed activation metadata. The runtime must not widen the window or select arbitrary media.
