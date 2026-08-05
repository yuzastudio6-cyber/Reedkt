# Tool Qualification

CAP-00 selects no new dependency and downloads no model or font.

## Current and candidate tools

| Tool/path | Intended role | Current evidence | Required before Caption Direction production use |
| --- | --- | --- | --- |
| faster-whisper | transcription/word timing foundation | CAP-04 bounded private route qualified for the accepted standard fixture; exact lineage remains required | shared canonical transcript integration, wider language/performance evidence, production image/license review |
| WhisperX | forced alignment candidate | not qualified in current Caption Direction path | dependency/model licenses, offline image, timestamp benchmarks, failure semantics, language coverage |
| pyannote | diarization candidate | not qualified | model access/license, consent/privacy, speaker/overlap benchmarks, neutral-label policy |
| FontTools | font metadata/metrics/subsetting | private build validation qualified at `4.38.0`; subset round trips passed for the reviewed Noto pack | canonical approved font registry and production dependency/legal review |
| OpenType Sanitizer | font sanitizer | private build validation qualified at `8.2.1`; malformed-font refusal passed | broader malicious corpus and production dependency/legal review |
| Unicode shaping stack | bidi/script shaping | libass 0.17.5 HarfBuzz/FriBidi path passed French, Japanese, Arabic, and Devanagari private composites | ICU/direct Remotion browser-text parity, emoji, and whole-runtime qualification |
| OpenCV | deterministic occupancy/QA | registry/worker candidate | approved operations, performance, privacy, visual benchmark |
| MediaPipe | face/pose/gesture evidence candidate | not established for captions | license/model/build/privacy/accuracy review |
| PaddleOCR | existing-text protection | registry/model manifest candidate | weights/license/language benchmark, false-positive policy |
| Visual Intelligence | structured source/final-frame observations and postrender visual evidence | typed support/read boundaries pass; qualified busy-background/shared lifecycle evidence is still missing | authenticated canonical result persistence/reread and no direct Caption provider dispatch |
| Track All / SAM 3.1 support | masks, tracks, anchors, occlusion evidence | Caption request/result/QA/fallback contracts pass; no direct SAM owner; real shared evidence remains missing | authenticated Track All temporal mask/anchor evidence through the shared boundary |
| Remotion + Chromium | creative render | pinned `4.0.487` bounded private proxy renders and golden-frame/direct inspection passed | commercial license owner review, customer-scale/full-resolution performance, final pipeline integration |
| libass | stable render | `0.17.5` ASCII and multilingual private raster evidence passed with exact dynamic canvas and approved fonts | complete-track/export owner integration and public-production legal review |
| FFmpeg/ffprobe | packaging/probe | existing canonical operation reused for bounded private composition/probes | exact full export fixture plus canonical LGPL/codec/patent and production image review |

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
