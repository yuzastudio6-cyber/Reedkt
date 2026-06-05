# Tool Capability Registry

Phase 52B creates the canonical ReeditPro tool capability registry from the Phase 52A shared ownership architecture.

The registry contains 67 records:

- Track A visual/video: 13 records.
- Web search/capture: 8 records.
- Map/geospatial: 12 records.
- Supabase milestone/readiness coordination: 4 records.
- AI Tools placeholders: 12 records.
- Track B placeholders/status: 18 records.

Each record includes the Phase 52A manifest fields plus `internalBetaCandidateReady`, `productionReady=false`, `readinessEvidence`, `lastValidatedRunId`, and `supabaseMilestoneRefs`.

## Ownership

This chat owns web search/capture, map/geospatial planning, Supabase milestone/readiness coordination, shared agent architecture, and system readiness.

AI Tools owns D3, Three.js, Remotion graphics, SVG, Lottie, ECharts, Vega/Vega-Lite, Viz.js, Satori, resvg, and creative graphics/motion design.

Track B owns Sharp/libvips general capability, audio/OCR/data/VLM/compute routing, DeepFilterNet, PaddleOCR, Demucs, Qwen3-VL, and vLLM status records.

Track A owns visual-video core tooling including FFmpeg, ffprobe, libass, Remotion render validation, OpenTimelineIO, OpenColorIO, OpenImageIO, Kornia, BiRefNet, SAM2, Real-ESRGAN, and FILM.

## Blocked Scope

The registry is metadata only. Phase 52B does not execute tools, models, media processing, web search, map rendering, providers, Docker, migrations, schema changes, or production/beta paths.

VLM remains excluded because Phase 39C recorded L4/vLLM CUDA OOM. Demucs remains blocked pending model provenance.
