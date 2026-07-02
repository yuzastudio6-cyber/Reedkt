# Production Audio Cleanup Execution Policy

Audio cleanup starts gentle. Voice naturalness is more important than aggressive denoise.

M15A supports:

- FFmpeg basic loudness/normalization planning and local-dev execution;
- DeepFilterNet skip-safe scaffold execution only when explicitly enabled and already available;
- RNNoise skip-safe scaffold execution only when explicitly enabled and already available;
- Demucs skip-safe scaffold execution only when music/speech overlap or an approved explicit reason justifies separation.

Model-based cleanup and stem separation require model-weight policy approval for production. Unknown, non-commercial, missing, or needs-review weights block production execution. No model downloads are allowed.
