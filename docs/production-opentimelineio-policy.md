# Production OpenTimelineIO Policy

Milestone 8 creates OpenTimelineIO-style JSON metadata without installing or importing the OpenTimelineIO package.

The OTIO-style manifest includes clips, source ranges, timeline ranges, media references, and metadata suitable for later adapter validation. Real OTIO package validation and interchange tests belong to a later tool-install/readiness milestone.

No signed URLs are stored in timeline or OTIO artifacts. Private storage references remain the source of truth.
