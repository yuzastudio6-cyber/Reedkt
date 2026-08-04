# Local Tool Bootstrap

This guide helps developers make the legacy RP-E2E worker host checks
reproducible before Prompt 6. Host installation is optional if the Docker
worker image passes the required checks. These nine developer-host probes are
not the canonical ReeditPro tool registry and do not change its exact 50-tool
count.

## Authoritative Canonical Tool Summary

Use the default summary for the exact canonical private end-to-end tool scope:

```bash
npm run tools:summary
```

It reports exactly 50 tool identities. Every identity has individual confined
runner, canonical approved-snapshot lifecycle, and server-derived job-adapter
evidence. Historical exploratory names, non-end-to-end capability candidates,
runner foundations, and developer-host availability are excluded from this
count. Private internal evidence does not imply deployed, external-beta, or
paid-production readiness.

## Required For Prompt 6

- FFmpeg
- FFprobe

Prompt 6 can run basic media-readiness smoke tests only when both tools are available. The readiness check uses safe `-version` commands and does not process media.

## Docker Fallback

Use Docker when the host machine does not have editing tools installed:

```bash
npm run docker:worker:build
npm run docker:worker:tools
npm run docker:worker:smoke
docker run --rm --env API_ALLOW_MOCK_WITHOUT_SUPABASE=true --env E2E_RUNTIME_MODE=local --env WORKER_RUNTIME_MODE=local --env STRICT_PROMPT6_TOOL_READINESS=true reeditpro-worker-dev npm run smoke:prompt6-ready
```

The Docker image is local/dev/test only. It does not include provider SDKs, Remotion, Sharp/libvips, Stripe, Google Cloud credentials, or secrets.

## macOS

```bash
brew install ffmpeg
npm run tools:host-summary
```

Optional later tools may use separate milestones and review:

```bash
brew install python
```

Do not install optional media stacks globally unless the relevant milestone asks for them.

## Ubuntu Or Debian

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg python3 python3-pip
npm run tools:host-summary
```

The distro FFmpeg package is acceptable for local smoke checks. It is not production legal/configuration approval.

## Windows

Using winget:

```powershell
winget install Gyan.FFmpeg
npm run tools:host-summary
```

Using Chocolatey:

```powershell
choco install ffmpeg
npm run tools:host-summary
```

Restart the terminal after install so `ffmpeg` and `ffprobe` are on `PATH`.

## Legacy Developer-Host Probe Coverage

- Remotion: future compositor/render worker milestone.
- Sharp/libvips: future thumbnail/image worker milestone.
- Python packages AudioFlux, OpenCV, and VapourSynth: future audio, QA, and frame-pipeline milestones.
- Playwright: future authorized browser capture and visual regression milestone.
- Signalsmith Stretch: future music stretch/pitch milestone.

These probes should report `unavailable` until the corresponding dependency is
installed on that developer machine. A host result does not override pinned,
confined canonical runtime evidence.

## Safety Notes

- No provider keys are needed for this milestone.
- No AI providers, Stripe, Google Cloud deploys, production rendering, or real media transforms are run by the host probe.
- Production FFmpeg, codecs, VapourSynth plugins, and any optional tool still require legal/security/deployment review before customer media work.
