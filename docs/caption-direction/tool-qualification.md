# Tool Qualification

CAP-00 selects no new dependency and downloads no model or font.

## Current and candidate tools

| Tool/path | Intended role | Current evidence | Required before Caption Direction production use |
| --- | --- | --- | --- |
| faster-whisper | transcription/word timing foundation | existing gated local/private worker and model manifest concepts | exact model/version/license, language benchmarks, timestamp/confidence tests, privacy/performance, deployed image evidence |
| WhisperX | forced alignment candidate | not qualified in current Caption Direction path | dependency/model licenses, offline image, timestamp benchmarks, failure semantics, language coverage |
| pyannote | diarization candidate | not qualified | model access/license, consent/privacy, speaker/overlap benchmarks, neutral-label policy |
| FontTools | font metadata/metrics/subsetting candidate | not qualified | version/license/security review, malformed/variable/font fixture suite |
| OpenType Sanitizer | font sanitizer candidate | not qualified | pinned binary/build, malicious fixture testing, sandbox and failure policy |
| Unicode shaping stack | bidi/script shaping | unresolved | preview/final parity and multilingual fixtures |
| OpenCV | deterministic occupancy/QA | registry/worker candidate | approved operations, performance, privacy, visual benchmark |
| MediaPipe | face/pose/gesture evidence candidate | not established for captions | license/model/build/privacy/accuracy review |
| PaddleOCR | existing-text protection | registry/model manifest candidate | weights/license/language benchmark, false-positive policy |
| Visual Intelligence | structured source/final-frame observations and postrender visual evidence | committed provider-neutral v1 public contract and gated lifecycle | exact support adapter, evidence calibration, authenticated reread, no direct Caption provider dispatch |
| Track All / SAM 3.1 support | masks, tracks, anchors, occlusion evidence | canonical SAM 3.1 owner exists behind mask runtime; public support seam still to reconcile | shared support DTO, temporal QA, opaque model evidence, no direct Caption dispatch |
| Remotion + Chromium | creative render | planned/bounded runtime foundations | pinned packages/browser/image, deterministic golden frames, sandbox/performance/license |
| libass | stable render | existing offline/private caption execution evidence | canvas/font/color/script parity and commercial build review |
| FFmpeg/ffprobe | packaging/probe | existing bounded private execution | LGPL-safe configuration, codec/patent review, deployed version and export fixtures |

## Qualification evidence

Each tool/model requires:

- pinned version, digest, source, license, and dependency inventory;
- approved container/worker group and no runtime download;
- private input/output/path handling;
- resource/time/network limits and sandbox;
- deterministic structured input/output contract;
- representative accuracy, language, performance, and failure fixtures;
- tool-cost metadata without service fee;
- readiness and rollback policy;
- legal/security/privacy owner signoff;
- production region/image evidence.

Readiness probes prove availability, not legal approval or product quality. Model observations are evidence candidates; deterministic code validates and owns executable specs.
