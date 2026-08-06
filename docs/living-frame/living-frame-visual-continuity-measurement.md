# Living Frame Visual Continuity Measurement

## Status

This is a bounded server-side measurement primitive for two aligned RGBA
component artifacts. It is not identity recognition, likeness verification,
historical evidence, a visual-continuity QA decision, a provider route, a
worker, an approval, or a production runtime.

## Purpose

The Visual Continuity Pack gives later drawings an approved character,
object, environment, palette, and style reference. A VLM can semantically
compare a generated candidate with that pack, while deterministic measurements
can expose visible drift that should not depend on a model's prose alone.

The first profile measures only an `aligned_same_view_component` pair: the
reference and candidate must be registered to the same dimensions, camera
view, crop, and component role before this primitive is useful.

It measures:

- thresholded silhouette intersection over union;
- alpha-weighted coverage change;
- normalized alpha centroid shift;
- mean absolute alpha change;
- one-pixel-tolerant alpha-boundary disagreement;
- alpha-weighted RGB histogram distance;
- alpha-weighted luminance histogram distance; and
- normalized RGB change where both silhouettes overlap.

The report emits closed drift-observation codes and deterministic source,
candidate, pixel, and report digests. It returns no pixels, paths, URLs,
credentials, prompts, provider names, or tool routes.

## Correct interpretation

A low drift score means only that two already aligned raster components are
similar under this fixed measurement profile. It does not prove:

- that the images depict the same person;
- consent or safe likeness use;
- the historical appearance of a named person;
- factual correctness of clothing, weapons, geography, insignia, or events;
- compliance with the project's Style Bible;
- that an image is authentic archival evidence; or
- that an asset is approved for animation or final rendering.

Musashi remains a canonical illustrative interpretation, not a verified
likeness. Real-person, minor, documentary, consent, retention, and provenance
policy must remain separate authorities.

## Input boundary

The primitive accepts two in-process server-owned RGBA byte arrays with:

- different safe artifact identities;
- lineage digests;
- identical bounded dimensions and byte lengths; and
- the closed aligned-same-view comparison mode.

Unknown keys, duplicate identities, URLs, invalid digests, invalid dimensions,
wrong byte lengths, alternative camera-view modes, and shared concurrently
mutable buffers are rejected.

Canonical integration must independently bind both artifacts to the exact
Visual Continuity Pack version, scene/component role, source lineage, approved
snapshot, asset-manifest versions, and private artifact repository. A caller
cannot manufacture those authorities through this report.

## Authority boundary

Every report keeps identity verification, likeness safety, documentary fact,
continuity QA, visual QA, planning, timing, estimate, cost, approval, snapshot,
provider, tool-route, work-graph, queue, asset-manifest, render,
runtime-promotion, and production authority literal false.

The one canonical QA plan may later consume this measurement alongside Qwen
visual observations, deterministic alpha reports, provenance, continuity-pack
rules, source truth, and private review. This primitive must not create a
second QA or approval gate.

## Limitations

The v1 metrics are deliberately simple and explainable. They are sensitive to
alignment, crop, pose, view, and lighting. A different pose or camera angle
must not be compared as though it were drift. Future perceptual or embedding
profiles require separate qualification, privacy review, exact model-artifact
lineage, and evidence that they do not silently become face-recognition or
identity authorities.
