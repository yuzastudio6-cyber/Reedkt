# Edit Brief Export Settings Architecture

Status: architecture/docs only. This report adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Ownership

Export Settings belong to `ProjectEditSession`. Edit Brief can show or change them in a future milestone, but does not own them.

## Future Fields

- `platformTarget`
- `aspectRatio`
- `resolution`
- `frameRate`
- `format`
- `codec`
- `audioCodec`
- `audioLoudnessTarget`
- `captionSafeArea`
- `deliveryPreset`
- `safeZonePreset`

## Auto Recommendation Inputs

- Source aspect ratio.
- Source metadata.
- Platform target.
- Edit session target.
- Selected edit level.
- User prompt.

## Recommended UX Copy

`Recommended Export: Instagram Reel 9:16, 1080p, 30fps`

`[Change]`

## Boundary

No render/export, ffprobe real analysis, media processing, file-byte read, worker, credit, provider, or Supabase behavior is enabled.
