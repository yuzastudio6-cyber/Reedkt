# All-Owner Stack Reconciliation Report

## Stack Context

- Base branch: `codex/reeditpro-tool-calling-unmerged-owner-evidence-overlay-1`.
- Prior stack includes first-class coverage, Track B external registry promotion, Track B external controlled probes, and unmerged owner evidence overlay.
- Current first-class coverage is derived from live `server/tool-registry` and explicit study cards; the matrix does not copy or replace the registry.

## Owner Lanes Covered

The reconciliation covers Track B media/OCR/color, Track A render/export/native/container, AI graphics/static/chart/model tools, Sound/Music/Audio, SFX/SoundSync, Web/Capture, Map/Geospatial, provider/local runtime candidates, Worker Runtime, and the tool-calling overlay itself.

## Current Findings

- The current base has first-class registry coverage for the promoted Track B tools: `mediainfo`, `exiftool`, `tesseract`, and `imagemagick`.
- `graphicsmagick` remains pending and non-selectable.
- Registry/study/adapter coverage is derived dynamically from the current tool-calling modules.
- Candidate-only surfaces such as `gstreamer`, `bento4/mp4box`, `mkvtoolnix`, `satori`, `svg.js`, `viz.js`, `animejs`, `torch/torchvision`, `transformers`, `soundfile/libsndfile`, `sox`, `aubio`, `mmaudio`, `gdal/ogr`, `tippecanoe`, `pmtiles`, `vllm`, `qwen3_vl`, and `onnxruntime` require owner evidence before tool-calling registry expansion.
- Provider/API surfaces remain separated from local OSS tool execution.
- Sound/Music/Audio owner expansion consumes merged PR #636 `SOUND-RUNTIME-MEDIA-GATE-0` evidence for 65 SOUND candidate labels, 13 pinned requirements, 16 install-plan-only tools, and blocked model/media/runtime gates.

## Duplicate Risks

- Existing worker runtime, final-render, caption, SFX, SoundSync, browser-capture, and migration-draft surfaces are evidence to reconcile against, not systems to duplicate.
- Open/draft PR evidence from the unmerged-owner overlay remains candidate evidence and can require waiting for merge or reconciling after merge.
- Future milestones must not create duplicate production registries, worker routers, QA policies, fallback policies, adapter execution registries, command execution policies, fixture/probe layers, owner registries, Supabase/runtime tables, migrations, or SQL execution tables.

## Recommended Next Milestones

- `REEDITPRO-TOOL-CALLING-SOUND-MUSIC-AUDIO-OWNER-EXPANSION-1`
- `REEDITPRO-TOOL-CALLING-AI-GRAPHICS-OWNER-EVIDENCE-RECONCILIATION-1`
- `REEDITPRO-TOOL-CALLING-TRACKA-NATIVE-CONTAINER-OWNER-EXPANSION-1`
- `REEDITPRO-TOOL-CALLING-TRACKB-EXTERNAL-CONTROLLED-PROBE-AVAILABILITY-REFRESH-1`
- `REEDITPRO-TOOL-CALLING-WORKER-SUPABASE-ROUTE-INTEGRATION-DECISION-1`

## Safety

This milestone is docs, diagnostics, and reconciliation metadata only. It does not execute tools, process media, dispatch workers, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, mutate `package-lock.json`, or unlock beta/production.
