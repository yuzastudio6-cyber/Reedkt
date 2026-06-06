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

## Phase 52F Reconciliation Rule

Phase 52F system readiness artifacts may summarize readiness, blockers, and owner handoffs, but they do not replace domain source-of-truth manifests. Controlled internal test planning must continue to reference approved snapshots, tool capability records, readiness snapshots, and private `gs://` artifacts rather than public URLs, signed URLs, screenshots, or PR prose.

## Phase 52G Go/No-Go Rule

Phase 52G go/no-go and owner prompt artifacts are coordination records only. They may cite private Phase 52F/52G `gs://` artifacts and Supabase milestone rows, but they do not authorize runtime execution and do not replace approved snapshots, tool capability manifests, owner readiness manifests, or domain-specific source records.
