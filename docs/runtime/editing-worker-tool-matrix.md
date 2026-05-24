# Editing Worker Tool Matrix

Status: RP-TOOLS-01 runtime worker mapping.

This matrix mirrors `server/tools/editing-worker-tool-map.ts`. It is a planning and readiness contract only; it does not run media processing, providers, Stripe, production deploys, customer media, or broad queues.

| Worker | Tools | Current role | Production readiness |
| --- | --- | --- | --- |
| `media-analysis-worker` | FFprobe, FFmpeg, PySceneDetect, Whisper, OpenCV | Future source metadata, shot detection, transcription, and visual QA. | FFmpeg/FFprobe are code-enforced for staging smoke. PySceneDetect, Whisper, and OpenCV remain optional/planned until the media analysis worker canary. |
| `render-worker` | Remotion, FFmpeg, FFprobe, Sharp/libvips | Preview/render composition, media validation, and future image preprocessing. | Remotion/FFmpeg/FFprobe are code-enforced for staging smoke. Sharp/libvips remains pending review. |
| `audio-soundsync-worker` | FFmpeg, FFprobe, AudioFlux, Signalsmith Stretch | Future audio extraction, beat/energy analysis, and approved stretch/pitch work. | AudioFlux and Signalsmith Stretch remain planning-only until SoundSync canary and review. |
| `image-asset-worker` | Sharp/libvips, OpenCV | Future thumbnails, overlays, image transforms, and visual QA. | Pending image worker canary, dependency review, and security review. |
| `browser-capture-worker` | Playwright | Future approved browser/app capture and visual QA. | Pending SSRF/privacy controls, allowlist policy, and capture worker canary. |
| `advanced-frame-worker` | VapourSynth, FFmpeg | Future advanced filtering/postprocessing. | Planning-only; plugin review and isolated worker profile required. |

## Enforcement

- `npm.cmd run smoke:tools:worker-map` validates that every worker maps only to registered tools.
- `ffmpeg`, `ffprobe`, and `remotion` must remain mapped because they support already-passed staging gates.
- Optional tools can be mapped before installation, but strict readiness must not require them until the corresponding worker canary is in scope.

## Safety Boundary

Workers may only execute after approved snapshots, credit gates, storage provenance checks, bounded resources, and cleanup rules exist for the specific gate. RP-TOOLS-01 does not grant production/customer execution approval.
