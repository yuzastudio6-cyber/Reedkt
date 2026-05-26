# Production Audio Cleanup Policy

Audio cleanup starts gentle and escalates only when analysis and QA support it.

Voice naturalness outranks aggressive denoise. Robotic artifacts, pumping, clipped speech, and overprocessed voices must block or warn through `audio_naturalness` QA.

Clipping is not treated as a denoise problem. When clipping is detected, the plan should prefer loudness/declip review and avoid strong denoise.

Cleanup does not replace edit decisions. Timing, cuts, music ducking, captions, and final render remain separate QA-gated steps.
