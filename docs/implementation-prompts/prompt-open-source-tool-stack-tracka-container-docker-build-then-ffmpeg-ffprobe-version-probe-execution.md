# Open-Source Tool Stack Track A Container Docker Build Then FFmpeg/FFprobe Version-Probe Execution

Use this prompt only after PR source-of-truth merge for the blocker-resolution packet.

Decision prerequisite: `exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution`

Future bounded commands:

```bash
docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> .
docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version
docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version
```

Rules:
- Run only the exact build and version-output commands in the future execution phase.
- Do not push images.
- Do not mutate Dockerfiles, package files, container definitions, Supabase, SQL, GCS, or public artifacts.
- Do not mount media or private payloads.
- Do not probe media files, decode, encode, caption burn-in, render, or export.
- Capture bounded private report output only.
- Stop on first failure.
