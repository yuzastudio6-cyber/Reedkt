# Phase 36H Generated Audio Fixture Policy

The generated fixture is deterministic and local-temp only:

- sample rate: `48000`
- channels: mono
- source: synthetic speech-like tone plus deterministic noise
- media class: generated audio only
- committed payloads: none

The generated fixture must run before any controlled real-audio path. If generated fixture creation, DeepFilterNet execution, metrics, or output hashing fails, Phase 36H remains blocked and controlled real-audio extraction does not run.
