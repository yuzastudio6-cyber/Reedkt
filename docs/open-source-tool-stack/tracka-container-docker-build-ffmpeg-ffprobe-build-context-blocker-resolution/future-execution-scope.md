# Future Execution Scope

The next phase is `OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL`. It may approve build-context generation commands only. Docker build, Docker run, and FFmpeg/FFprobe probes remain excluded from that next approval packet unless a later prompt explicitly expands scope.

- Build-context generation included in next approval: `true`
- Docker build included in next approval: `false`
- FFmpeg/FFprobe probes included in next approval: `false`
- No media input/output: `true` / `true`
- No Docker image push: `true`
- Stop on first failure: `true`
