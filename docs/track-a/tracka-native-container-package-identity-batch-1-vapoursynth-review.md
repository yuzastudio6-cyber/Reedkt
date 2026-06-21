# TRACKA-NATIVE-CONTAINER-PACKAGE-IDENTITY-BATCH-1 VapourSynth Review

Scoped tool: `vapoursynth_frame_pipeline`

Policy status: `resolved_vapoursynth_native_policy_ready_for_future_install_proof`

Install status: `not_installed`

Runtime execution: `not_run`

## Decision

Core VapourSynth is eligible for a future install-proof packet as a worker-only native frame pipeline candidate. Plugins remain separately blocked until each plugin has license, security, native dependency, and runtime-lane review.

## Evidence

- VapourSynth packaging evidence: `https://www.vapoursynth.com/doc/packaging.html`
- VapourSynth release evidence: `https://www.vapoursynth.com/`
- Repo policy in `launch-tool-stack-update.md` treats VapourSynth as worker-only with LGPL and plugin review requirements.
- `server/tool-registry/production-tool-profiles.ts` models VapourSynth as `planned`, `cpu_analysis_worker`, and `worker_recipe`.

## Future Install Proof Rules

- Future proof may cover core VapourSynth package/source declarations only.
- Do not include unreviewed plugins, arbitrary Python script execution, `vspipe` runtime proof, media processing, Docker build, FFmpeg/FFprobe execution, or production unlock in this identity batch.
- Any plugin addition needs a separate plugin policy packet before install-source changes.
