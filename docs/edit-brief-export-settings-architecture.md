# Edit Brief Export Settings Architecture

Status: `mock_local_professional_profile_contract`

The shared TypeScript contract, deterministic recommendation rules, local validation, and browser-safe adapter support professional resolution profiles. This remains mock/local planning metadata: it adds no production route, migration, Supabase command, provider/model call, worker, render, upload, file-byte read, or credit action.

## Ownership

Export Settings belong to `ProjectEditSession`. Edit Brief can show or change them in a future milestone, but does not own them.

## Future Fields

- `platformTarget`
- `aspectRatio`
- `resolution`
- `resolutionProfileId` (`hd_1080`, `qhd_1440`, or `uhd_2160`; `custom` remains metadata-only)
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

`Recommended Export: Instagram Reel 9:16, 4K UHD, 30fps`

`4K is already included in the approved edit estimate. Choosing covered 1080p, 2K, or 4K output does not create another credit charge.`

`[Change]`

## Boundary

No render/export, ffprobe real analysis, media processing, file-byte read, worker, credit, provider, or Supabase behavior is enabled.
