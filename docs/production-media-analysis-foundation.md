# Production Media Analysis Foundation

Milestone 6 is the first CPU-safe media-processing foundation for ReeditPro production runtime. It adds local/dev FFprobe and FFmpeg adapters for probe, proxy, audio extraction, bounded frame extraction, artifact records, and partial `MediaAnalysisReport` assembly.

Milestone 8 consumes this foundation's media duration, proxy/source references, scene placeholders, silence signals, and partial analysis metadata for smart cut and timeline planning. M8 does not change source media or perform real cuts.

Milestone 9 consumes extracted audio artifacts and media audio analysis placeholders for loudness, cleanup, ducking, and SoundSync planning. M9 does not overwrite source audio or final mux/export.

Milestone 10 adds FFmpeg/ffprobe CPU/render install declarations and safe version/import readiness checks. That readiness supports future local/dev media foundation work, but it does not change source immutability, approved snapshot gates, or the no-production-processing boundary.

Milestone 14 consumes source/proxy media artifact IDs and local-dev proxy paths for smart cut execution planning and optional proxy preview. Source media and proxy media are never overwritten.

Milestone 15B consumes representative frame artifact IDs, proxy/source media refs, and safe local-dev frame/proxy paths for color analysis, correction planning, shot matching, optional preview, and color QA. Source and proxy media remain immutable.

## Flow

1. Validate approved snapshot, tool execution plan, idempotency, private storage reference, and no raw prompt/signed URL payloads when a worker payload is supplied.
2. Resolve source media from a private storage reference to a local file in local/dev mode.
3. Probe with FFprobe for duration, streams, codec, format, dimensions, rotation, aspect ratio, and size.
4. Create an H.264 MP4 proxy when requested.
5. Extract mono 16kHz WAV audio when an audio stream exists and extraction is requested.
6. Extract bounded keyframe and representative JPEG frames.
7. Build private `ToolArtifact` records.
8. Build a partial `MediaAnalysisReport`.

## Not Included Yet

Milestone 6 does not run transcript intelligence, smart cuts, audio cleanup, color grading, OCR, masks, background removal, enhancement, slow motion, final render, providers, GPU AI tools, Revideo, or cloud execution.

## Execution Modes

- `dry_run`: validates intended actions without FFmpeg/FFprobe.
- `local_dev`: runs FFprobe/FFmpeg only against local files and safe temp/output roots.
- `production_blocked`: refuses real execution until a later deployment/runtime milestone approves it.
