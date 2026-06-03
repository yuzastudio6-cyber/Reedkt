# Phase 36H Controlled Audio Sample Policy

Phase 36H may process exactly one approved controlled sample:

- sample id: `phase37d-phase32-color-export-safe-zone-window-v1`
- chain id: `controlled-real-video-chain-phase28-through-phase32-v1`
- source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- SHA-256: `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa`
- window: `6.9s-8.9s`

Only the bounded audio window may be extracted. If the window is not suitable for speech cleanup, the run must stop with `controlled_audio_window_not_speech_suitable`; it must not select a different sample or widen the window.

No video, audio, frames, thumbnails, or media-derived raw payloads may be committed.
