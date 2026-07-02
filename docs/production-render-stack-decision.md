# Production Render Stack Decision

## Purpose

This document locks ReeditPro's production render stack for the professional backend runtime. It supersedes earlier launch wording that treated Remotion as the only render-layer decision.

Milestone 0 is documentation-only. It does not install render packages, create templates, run Hyperframe, run Remotion, run FFmpeg/libass, create OpenTimelineIO files, evaluate Revideo, render media, or deploy workers.

## Decision

The core render stack is:

- Hyperframe for editor, timeline, and interactive preview layer.
- Remotion for programmatic composition and render templates.
- FFmpeg for final media export, mux, transcode, and delivery variants.
- libass for subtitle burn-in where needed.
- OpenTimelineIO for structured timeline and edit-decision interchange.

Revideo is `evaluation_only` and `future_optional`. It is not installed or treated as core unless a later milestone proves a specific Remotion/Hyperframe gap and receives review approval.

## Stack Roles

| Layer | Role | Must not do |
| --- | --- | --- |
| Hyperframe | Editor/timeline/interactive preview layer and integration boundary for approved timeline state. | Must not run raw chat instructions, bypass approval, spend credits, or replace final QA/export gates. |
| Remotion | Programmatic composition/render templates for approved assets, layouts, captions, panels, cards, and motion graphics. | Must not generate provider assets, make story decisions, or render from unapproved raw chat. |
| FFmpeg | Final media export, mux, transcode, stream validation support, proxy/media processing where approved. | Must not run in frontend, use unreviewed GPL/nonfree builds, or perform creative decisions. |
| libass | Subtitle burn-in where template-native captions are insufficient or delivery requires rendered subtitles. | Must not ignore caption safe zones, readability, timing, or font packaging review. |
| OpenTimelineIO | Structured timeline/edit-decision interchange between planning, workers, render, and QA. | Must not become an unversioned shadow format or replace approved snapshot authority. |
| Revideo | Evaluation-only possible future optional renderer if a proven core-stack gap exists. | Must not be installed by default, become a launch dependency, or duplicate Remotion/Hyperframe without review. |

## Intended Render Flow

1. Approved snapshot freezes frame, timing, captions, renderer plan, asset manifest, tool strategy, QA gates, and credit records.
2. Timeline intelligence and workers produce structured edit decisions and OpenTimelineIO-compatible interchange where needed.
3. Hyperframe coordinates editor/timeline/interactive preview state from approved records.
4. Remotion templates compose approved source, generated, tool, caption, graphics, and mask assets.
5. libass burns subtitles only where the approved delivery path requires it.
6. FFmpeg exports, muxes, transcodes, and packages final media variants.
7. QA validates render/export integrity before final export is marked ready.

## Revideo Evaluation Rule

Revideo may be considered later only when all are true:

- a concrete Remotion/Hyperframe limitation is documented;
- the gap affects a required production workflow;
- the gap cannot be solved with Remotion templates, Hyperframe integration, FFmpeg/libass, OTIO, or controlled worker recipes;
- dependency, license, security, performance, and maintenance reviews pass;
- the implementation remains behind approved snapshots and final QA.

Until then, Revideo remains non-core and not installed.

## Acceptance Gates

- New render work references this stack decision.
- Revideo is marked evaluation-only anywhere it appears in production runtime docs.
- Final render/export remains worker/backend-only.
- No final export can start without approved snapshot, confirmed frame, timing plans, required assets, and QA gates.
- Frontend preview/editor behavior must not become heavy production render execution.
