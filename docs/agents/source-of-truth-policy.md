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

## Phase 52H Owner Response Rule

Phase 52H owner-response ledgers and intake manifests are coordination source records for handoff status only. They may track owner decisions, accepted scope, blocked scope, next prompts, evidence refs, and Supabase update classification, but they do not replace domain manifests and they cannot be used as runtime approval, public artifact approval, signed URL source-of-truth, or production/external beta approval.

## Phase 53A Runtime Unlock Rule

Phase 53A runtime unlock roadmap artifacts are coordination source records for
owner acceptance and unlock stage status only. They may define blocked scopes,
owner repo-audit prompts, ladder stages, acceptance criteria, and risk posture,
but they do not authorize any runtime work.

Raw prompt execution remains blocked as a direct execution source forever.
Approved plan snapshots are the replacement source of truth for future worker
execution. Signed URLs remain blocked as source of truth forever; later phases
may approve them only as temporary access links backed by private artifact
manifests and Supabase milestone references.
