# Production Timeline Foundation

Milestone 8 converts `SmartCutPlan` metadata into timeline manifests for future preview/render workers.

## Timeline Outputs

- Reeditpro `TimelineManifest` with `timelineFormat: reeditpro_timeline`.
- OpenTimelineIO-style JSON manifest without importing the OpenTimelineIO package.
- Hyperframe bridge metadata for future interactive preview, without frontend/runtime execution.
- Remotion composition manifest metadata, without rendering.
- private `timeline_manifest`, `opentimelineio_manifest`, and `qa_report` artifact records.

## Boundaries

The timeline foundation does not render, export, transcode, mux, burn captions, or cut source media. Hyperframe, Remotion, FFmpeg, libass, and OpenTimelineIO remain the locked stack boundaries; Revideo remains evaluation-only and unused.

## Milestone 14 Execution Layer

M14 updates timeline manifests from smart cut execution plans and adds preview notes, QA refs, proxy/source refs, OTIO-style metadata, Hyperframe bridge metadata, and Remotion composition metadata. It still does not run a full render or final export.
