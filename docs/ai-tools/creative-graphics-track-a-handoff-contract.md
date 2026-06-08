# Creative Graphics Track A Handoff Contract

Status: `manifest_draft`

Track A owns final composition, final render/export validation, final delivery readiness, and render-runtime execution. AI Tools Creative Graphics provides private visual artifact manifests only.

## Required Fields

- `artifactId`
- `artifactType`
- `privateGcsPathPlaceholder`
- `checksumPlaceholder`
- `dimensions`
- `durationFrames` when temporal
- `fps` when temporal
- `alphaSupport`
- `safeZone`
- `timingContext`
- `approvedPlanSnapshotId`
- `qaStatus`
- `blockedUses`

## Rules

- No final delivery without Track A validation.
- No render/export execution in GD-1.
- No public artifact creation in GD-1.
- No signed URL source-of-truth in GD-1.
- No Track A ownership is claimed by AI Tools.

Recommended next prompt: `Prompt GD-5 - Creative Graphics Track A Handoff Dry-Run`.
