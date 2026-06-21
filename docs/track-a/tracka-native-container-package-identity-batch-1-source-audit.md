# TRACKA-NATIVE-CONTAINER-PACKAGE-IDENTITY-BATCH-1 Source Audit

## Base

Base branch: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

Base SHA: `f19c173a6a3d9a4cf381fc23826bd14a6385bc1f`

#601 is merged and remains the latest native/container install-source source-of-truth.

## Repo Evidence

- `docker/prod/render-worker/Dockerfile` declares GStreamer base/good/tools and MKVToolNix from #601 only.
- `docker/prod/render-worker/Dockerfile` records Hyperframe metadata handoff, but no Hyperframe package install target.
- `package.json` and `package-lock.json` contain no direct `gpac`, `bento4`, `vapoursynth`, `revideo`, or `hyperframe` package additions from this batch.
- `server/tool-registry/production-tool-profiles.ts` models Hyperframe as a preview/timeline boundary, VapourSynth as planned worker-only, and Revideo as evaluation-only.
- `docs/track-a/tracka-native-container-render-tools-install-proof-2*.md` records Bento4/MP4Box, VapourSynth, and Revideo as previously blocked pending identity or policy review.

## External Evidence

- GPAC MP4Box evidence: `https://github.com/gpac/gpac/wiki/mp4box`
- Bento4 evidence: `https://www.bento4.com/`
- VapourSynth packaging evidence: `https://www.vapoursynth.com/doc/packaging.html`
- VapourSynth release evidence: `https://www.vapoursynth.com/`
- Revideo install evidence: `https://docs.re.video/installation-and-setup/`
- Revideo project evidence: `https://docs.re.video/project-structure/`

## Exclusions

#609 is draft/blocked and excluded as source-of-truth.

#577 is draft/blocked and excluded as source-of-truth.

No Dockerfile, package dependency, package-lock, runtime source, worker, route, Supabase, SQL, or migration file was changed.
