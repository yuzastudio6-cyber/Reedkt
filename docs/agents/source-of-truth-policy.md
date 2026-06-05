# Source Of Truth Policy

Phase 52A defines source-of-truth rules for shared agents and future workers.

Agents may cite review artifacts, but workers must execute from approved source manifests and approved plan snapshots.

## Domain Rules

- Video source of truth: source media, timeline, approved plan snapshot, and render manifest. Preview screenshots and thumbnails are review artifacts only.
- Map/geospatial source of truth: planning source records, location candidates, GeoJSON, Turf calculations, map style manifests, camera manifests, timing manifests, and render manifests. Map screenshots are QA/review artifacts only.
- Web search source of truth: source manifests, capture manifests, and extraction manifests. Brave raw responses and snippets remain blocked by default unless a later storage-rights phase changes that policy.
- Graphics source of truth: graphic intent, design spec, vector/SVG/Lottie/Remotion source, and render manifest. Preview rasters are review artifacts only.
- Audio source of truth: approved source audio, processing plan, model/tool manifest, and output manifest. Waveform/spectrogram previews are review artifacts only.
- Supabase source of truth: activation milestone registry rows, readiness snapshots, tool capability rows, feature gate rows, and private `gs://` artifact references. GCS remains the private artifact store for JSON reports, manifests, media, and blobs.

## Blocked

- Signed URLs as source of truth.
- Public artifacts as source of truth.
- Raw provider responses, raw Brave snippets, DB URLs, service-role keys, API keys, bearer tokens, or secret values in manifests.
- Workers executing from raw chat, screenshots, previews, PR summaries, or unapproved artifacts.
