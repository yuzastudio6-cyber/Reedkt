# Creative Graphics QA Readiness Contract

Status: `manifest_draft`

## Required QA Dimensions

Creative graphics artifact plans must define QA for:

- dimensions
- aspect ratio
- alpha/transparency
- safe zones
- typography/rendering
- brand style
- readability
- timing alignment
- artifact manifest completeness
- checksum/provenance
- Track A compatibility
- blocked-use compliance

## Per-Output Notes

- Static graphics require dimensions, safe-zone, typography, readability, and checksum/provenance checks.
- Transparent assets require alpha-edge and compositing-readiness checks.
- Temporal overlays require duration frame, fps, timing context, and Track A compatibility checks.
- Data graphics require source confidence, label accuracy, readability, and no invented exact values.
- 3D/canvas manifests require deterministic settings, safe framing, and future renderer compatibility checks.

## Pass / Fail Criteria

Pass requires complete manifest fields, private artifact placeholders, blocked-use compliance, and Track A handoff readiness. Fail if any manifest claims execution, public artifact status, signed URL source-of-truth, final delivery, or production/beta readiness.

Recommended next prompt: `Prompt GD-2 - Creative Graphics All-Tools Dry-Run Fixture Pack`.
