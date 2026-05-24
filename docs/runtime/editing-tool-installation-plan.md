# Editing Tool Installation Plan

Status: planning and runtime-readiness contract. No production installation or deployment is performed by RP-TOOLS-01.

## Current Installed / Proven Scope

| Tool | Current status | Notes |
| --- | --- | --- |
| FFmpeg | Required for current milestone; staging smoke proven. | Used in tiny fixture/render-adjacent paths. Production/customer processing remains blocked. |
| FFprobe | Required for current milestone; staging smoke proven. | Used for safe media metadata checks. Production/customer validation remains blocked. |
| Remotion | Required for current milestone; staging smoke proven. | Cloud Run staging canaries passed with bounded resources and OIDC/WIF. Production/customer rendering remains blocked. |

## Optional / Planned Runtime Tools

| Tool | Install target | Before production use |
| --- | --- | --- |
| Sharp/libvips | Node worker image or render preprocessing image | Dependency/security/LGPL review, pixel/file caps, image worker canary. |
| OpenCV | Python worker image | Native dependency review, frame sampling caps, media analysis canary. |
| AudioFlux | Python audio worker image | Dependency review, duration/sample-rate caps, SoundSync analysis canary. |
| Signalsmith Stretch | Future audio worker image | License/build review, bounded stretch policy, audio processing canary. |
| Whisper / faster-whisper / whisper.cpp | Future transcription worker image | Implementation selection, model/license/security review, PII retention controls, transcription canary. |
| PySceneDetect | Python media analysis worker image | Dependency review, scene detection canary, source-order fallback behavior. |
| Playwright | Node browser-capture worker image | SSRF/privacy allowlist, isolated browser profile, browser capture canary. |
| VapourSynth | Future advanced frame worker image | Plugin-by-plugin review, isolated CPU/RAM profile, advanced frame canary. |

## Docker Image Strategy

- Keep render-worker images focused on Remotion, FFmpeg/FFprobe, and only reviewed render-adjacent dependencies.
- Split Python analysis/audio tools into separate worker images so optional native dependencies do not bloat the render image.
- Keep browser capture isolated from media/render workers.
- Keep advanced frame tooling isolated because VapourSynth plugins have separate licensing and resource profiles.

## Strict Readiness Policy

- Current strict required tools: `ffmpeg`, `ffprobe`, `remotion`.
- Optional tools may return missing/warning in `npm.cmd run tools:readiness` without failing the milestone.
- `npm.cmd run tools:readiness:strict` fails only for tools required by the current milestone, or for explicit test/CLI overrides such as `--require-tool whisper`.

## Production Blockers

- Production/customer media execution is not approved.
- License/security review is incomplete for optional tools.
- Worker images and resource caps are not production-final.
- Worker canaries for media analysis, real timeline composition, SoundSync, browser capture, image processing, and advanced frame processing are still pending.
- Providers, Stripe/payment, production deployment, broad queues, and service account JSON keys remain outside this plan.
