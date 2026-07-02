# Track B Adapter Pack

Milestone 5 wires the completed Track B media OSS tools into a backend-owned adapter pack. The adapter pack covers the 16-tool Track B source-of-truth set:

`ffmpeg`, `ffprobe`, `pyav`, `opentimelineio`, `remotion`, `libass`, `sharp`, `paddleocr`, `pyscenedetect`, `opencv`, `opencolorio`, `openimageio`, `audioflux`, `signalsmith_stretch`, `d3`, and `echarts`.

## Scope

The adapter pack is contract-first and mock-safe. It defines:

- per-tool adapter contracts;
- dry-run and bounded-execution adapter modes;
- private input and output artifact manifests;
- typed tool result schemas;
- per-tool QA checks;
- gateway integration through `POST /v1/tool-executions/dispatch`;
- smoke coverage for every adapter.

The bounded-execution mode is a backend contract state, not a live binary invocation. It proves that the request has a tool-specific adapter contract, private source-of-truth artifacts, approved snapshot and credit IDs, idempotency, and QA requirements before any future worker can run a real command.

## Safety Boundary

This milestone does not run FFmpeg, PaddleOCR, OpenCV, Remotion, OpenColorIO, OpenImageIO, AudioFlux, Signalsmith Stretch, D3, ECharts, Docker, providers, Supabase writes, media processing, render/export, external beta, or production.

Execution remains blocked unless the existing backend gateway receives an approved plan snapshot, credit estimate, credit reservation, idempotency key, private artifact references, and a Track B adapter selection. Frontend/browser code still cannot run heavy tools or call workers directly.

## Validation

Run:

```bash
npm run smoke:trackb-adapter-pack
npm run smoke:tool-execution-gateway
```

The adapter smoke verifies all 16 Track B tools in both `dry_run` and `bounded_execution` modes, rejects signed URL inputs, rejects secret-like metadata, validates typed result schemas, and confirms gateway dispatch stays mock-safe with `realToolExecution: false`.
