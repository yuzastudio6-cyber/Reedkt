# Future Execution Scope

Selected path: `build_context_generation_only`

The next phase may execute build-context generation only. Docker build/run and FFmpeg/FFprobe version probes remain separate future phases.

- Build-context generation included: `true`
- Docker build included: `false`
- FFmpeg/FFprobe probes included: `false`
- No media input/probe/decode/encode: `true`
- No render/export: `true`
- No dist output commit: `true`
- Stop on first failure: `true`
