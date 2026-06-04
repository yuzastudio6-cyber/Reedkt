# Phase 36J Controlled Audio Extraction Policy

The controlled extraction step uses `ffmpeg`/`ffprobe` only on the approved private sample and only for the `6.9s-8.9s` window. Output must be 48 kHz mono PCM WAV, duration must stay below five seconds, and raw audio must remain private.

If the window is silent, missing audio, invalid duration, or otherwise unsuitable for timing stretch QA, Phase 36J blocks with `controlled_audio_window_not_timing_stretch_suitable` rather than widening the window or selecting arbitrary media.
