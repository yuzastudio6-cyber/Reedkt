# Phase 36A Audio AI QA Policy

Phase 36A defines QA requirements but does not execute audio AI.

Future generated-audio and controlled real-video samples must check:

- speech intelligibility preservation
- musical noise or robotic artifacts
- ambience and room-tone preservation
- loudness and true-peak regression
- latency and lip/audio sync
- stereo/channel integrity
- source-separation leakage and balance if Demucs is ever used
- private artifact storage
- no runtime model download
- no provider/Revideo/public/production/beta unlock

Human listening review is required before broader use. Metrics alone are not
enough for audio AI cleanup approval.
