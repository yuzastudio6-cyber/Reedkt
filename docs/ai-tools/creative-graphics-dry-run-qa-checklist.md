# Creative Graphics Dry-Run QA Checklist

Status: `dry_run_fixture_spec_created`

This checklist validates fixture specs and expected manifest fields only. It does not validate rendered pixels, media files, tool output, or final composition.

| Fixture Type | QA Checks |
| --- | --- |
| Title cards and lower thirds | Dimensions, aspect ratio, safe zones, typography, readability, style consistency, private artifact manifest completeness, blocked-use compliance |
| Chart SVG/PNG | Dimensions, aspect ratio, label readability, data correctness from synthetic dataset, axis/legend clarity, checksum/provenance placeholder, Track A compatibility |
| Diagram SVG | Graph/diagram correctness, node/edge label readability, safe zones, artifact manifest completeness, checksum/provenance placeholder |
| Social card PNG | Dimensions, typography, safe-zone margins, brand/style consistency, no public artifact, no signed URL source of truth |
| Lottie overlays | Alpha/transparency requirement, timing alignment, safe zones, caption collision risk, Track A compatibility, blocked runtime execution note |
| Remotion preview manifests | Timing context, fps/duration fields, layer safe zones, private manifest completeness, Track A validation required |
| Canvas effects | Dimensions, timing alignment, style consistency, alpha support if required, worker execution blocked note |
| Three scene manifests | Dimensions, camera intent, safe zones, timing alignment if temporal, private artifact placeholder completeness |
| SVG vector graphics | Dimensions, text readability, vector source placeholder, checksum/provenance placeholder, private artifact policy |
| Rasterization outputs | Source vector manifest placeholder, target format, dimensions, checksum/provenance placeholder, no public artifact |

## Universal Pass Checks

- `approvedPlanSnapshotPlaceholder` is present.
- `privateArtifactManifestPlaceholder` is present.
- `<PRIVATE_GCS_PATH_PLACEHOLDER>` or equivalent fixture placeholder is present.
- `<SUPABASE_ARTIFACT_RECORD_PLACEHOLDER>` or equivalent fixture placeholder is present.
- `<CHECKSUM_PLACEHOLDER>` or equivalent fixture placeholder is present.
- Track A handoff expectations are documented when an output could later be consumed by Track A.
- Blocked uses remain blocked.

## Universal Fail Checks

- Real user data appears.
- A signed URL is used as source of truth.
- A public URL or public artifact is claimed.
- Tool, worker, provider, model, render/export, browser capture, media processing, Docker/Cloud Run, Supabase, SQL, Google Cloud, Secret Manager, Stripe, deployment, or runtime unlock execution is claimed.
