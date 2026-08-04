# WeEditPro tool-stack audit for Track All

Audit date: 2026-08-04. The canonical catalog contains 75 profiles and 38 professional operation specs. Catalog visibility does not grant dispatch authority.

| Tool | Catalog state | Track All class | Approved purpose | Forbidden purpose |
|---|---|---|---|---|
| FFprobe | launch core, private runner verified | required_core | metadata, duration, FPS, time base, rotation, integrity, output inspection | mutation |
| FFmpeg | launch core, private runner verified | required_core | bounded proxy/frame extraction, normalization, redaction, mask application, private flattened preview | arbitrary commands, tracking reasoning |
| PyAV | planned, private runner verified | conditional_support | bounded frame decode/staging | production fallback without qualification |
| OpenTimelineIO | launch core, private runner verified | conditional_support | timing/effect-range handoff | track inference |
| Remotion | launch core, private runner verified | conditional_support | private tracked-treatment preview and integration composition | final customer export |
| Sharp | launch core, private runner verified | conditional_support | bounded image/reference normalization | video tracking |
| DuckDB/Polars | planned, private runner verified | validator_only | metrics, missing frames, seam and privacy summaries | masks or IDs |
| PySceneDetect | planned, private runner verified | conditional_support | shot candidates | identity continuity claims |
| OpenCV | launch core, private runner verified | required_core | optical flow, transforms, homography, morphology, smoothing, seams, anomalies, safe zones | semantic identity |
| Kornia | planned, private runner verified | conditional_support | qualified mask morphology/warp metrics | silent SAM fallback |
| PaddleOCR | planned | future_candidate | sensitive text-region evidence after qualification | final privacy acceptance alone |
| MediaPipe | future | future_candidate | landmarks/visibility after qualification | identity recognition |
| SAM 3.1 | needs license review | conditional_support | promptable temporal masklets/Object Multiplex after exact qualification | direct public output or semantic QA |
| SAM2 | blocked | explicitly_not_used | immutable historical evidence only | new work, fallback, repair |
| BiRefNet | planned | explicitly_not_used | none in Track All | SAM fallback |
| rembg | planned, private runner verified | explicitly_not_used | none in Track All | temporal tracking fallback |
| transparent_background | evaluation only | explicitly_not_used | none in Track All | temporal tracking fallback |
| OpenColorIO/OpenImageIO | planned, private runner verified | future_candidate | validation/handoff support only | final Color ownership |
| Playwright | planned, private runner verified | validator_only | approved internal UI/browser evidence when explicitly required | media tracking or public capture |

Every active operation uses a fixed server-owned operation ID and a private artifact lease. Tool runners cannot mutate wallets, settle customer charges, select fallbacks, or publish artifacts.
