# Edit Brief Video Metadata Export Recommendation

Status: RP-MEDIA-01 browser metadata recommendation. Local browser preview only. No upload, no backend file bytes, no worker, no media processing, no render, no credits, no provider/model call, no Supabase command, and no migration are authorized.

## Browser Metadata

When browser video metadata is available, Export Settings can use:

- `videoWidth`
- `videoHeight`
- `durationSeconds`

The recommendation stays deterministic and browser-safe. It reuses existing Project Edit Brief export preset rules.

## Aspect Rules

- portrait close to 9:16 -> 9:16 preset
- landscape close to 16:9 -> 16:9 preset
- square close to 1:1 -> square preset
- 4:5-ish -> 4:5 preset
- otherwise -> custom

Frame rate is not reliably available from browser video metadata, so RP-MEDIA-01 defaults recommendation metadata to 30 fps. The UI must not claim actual FPS detection.

## Boundary

Export recommendation does not start render/export, progress, workers, media probing, file-byte reads, storage writes, Supabase writes, provider calls, Qwen/Qwen2.5-VL/DeepSeek calls, or credits.
