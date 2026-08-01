# Living Frame Representative Still/Data Source Read Admission Candidate

## Status

`living-frame-representative-still-data-source-read-admission-candidate-v1` is
a namespaced, byte-free, source-only proposal. Canonical consumption and every
execution authority remain pending.

## Why it exists

The current approved uploaded-source reader is executable only for MP4 video.
The private dependency-artifact reader supports raster, SVG, and JSON artifacts
only after another canonical work item has produced, QA-passed, and reconciled
them. Using that reader for raw finalized uploads would bypass the canonical
upload and approved source-manifest owners and is forbidden.

## Closed future boundary

The later canonical one-writer extension must version the approved source
manifest and source reader around a closed discriminated union:

```text
video | raster | svg | structured_json
```

Every kind must revalidate the exact finalized media and storage records,
private object generation and ETag where applicable, SHA-256, byte length,
MIME, approved snapshot, approved work item, and approved source-manifest
binding before bytes can enter a confined worker.

The namespaced candidate proposes bounded buffered reads for the six current
non-video fixtures. The proposed ceilings are not canonical authority. Raster
inputs require signature, decode, color/orientation, and dimension validation;
SVG requires UTF-8 root validation plus denial of active content and external
references; structured JSON requires a closed schema and exact citation-row
validation.

No worker payload may contain caller bytes, file paths, URLs, bucket names,
object paths, credentials, commands, or environment. The future canonical
reader must recover and revalidate private object identity server-side.

## Non-authority

The candidate creates no upload, manifest, source reader, dependency artifact,
work item, asset, QA result, lease, dispatch, cost event, or private-review
decision. `canonicalConsumptionPending:true`; operation registration, runtime,
source read, asset creation, customer charge, public delivery, and production
readiness are all false. Character animation and mechanical rigging remain
paused.
