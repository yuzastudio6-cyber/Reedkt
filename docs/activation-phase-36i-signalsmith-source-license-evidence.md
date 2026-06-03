# Phase 36I Signalsmith Source And License Evidence

Source evidence:
- Official project page: https://signalsmith-audio.co.uk/code/stretch/
- GitHub mirror: https://github.com/Signalsmith-Audio/signalsmith-stretch
- Selected runtime source: tag `1.1.0`, commit `44c8f865af9da8c29cc4a70a2d5a3ec83639c711`
- Upstream-current reference only: `main` at `57b93f4e9206a089a45387eaa39bdc9f310d3308`

License evidence:
- Signalsmith Stretch is recorded as MIT licensed.
- The bundled Signalsmith Linear/DSP support files must be tracked as MIT evidence as part of the exact source checksum manifest.
- This is evidence for bounded internal generated-fixture execution only, not production legal approval.

Runtime caveats:
- Signalsmith Stretch is a C++11 header-only pitch/time-stretch library.
- Upstream guidance says time-stretching is best for modest ratios around `0.75x` to `1.5x`.
- Latency, pre-roll, flushing, compiler behavior, and wrapper choices remain production blockers until later review.
