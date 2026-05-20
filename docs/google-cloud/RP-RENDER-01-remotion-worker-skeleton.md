# RP-RENDER-01 Remotion Worker Skeleton

## Purpose

RP-RENDER-01 adds a mock-safe Remotion worker skeleton for ReeditPro. This prepares the backend/runtime contract for future preview and export rendering without installing Remotion, deploying Cloud Run, rendering media, calling providers, reading secrets, or writing files.

## Current Status

This milestone is skeleton-only.

It adds:

- render worker manifest contracts
- approved snapshot to render manifest mapping helpers
- render preflight validation
- mock worker result/event shapes
- future Cloud Run Job / Dockerfile planning notes

It does **not**:

- install `remotion` or `@remotion/renderer`
- import Remotion packages
- render frames or videos
- download source media
- upload preview/export files
- deploy Cloud Run Jobs
- call AI providers
- spend credits
- bypass approval gates

## Renderer Rule

Remotion is ReeditPro's compositor and final canvas. AI models generate assets only. Remotion places source media, generated images, AI clips, captions, panels, cards, SoundSync cues, and transitions into the approved frame and timeline.

## Required Gates Before Future Real Rendering

Future real rendering must require:

1. approved plan snapshot
2. approved edit plan
3. approved credit estimate
4. reserved credits
5. render job ID
6. idempotency key
7. source/generated assets ready or explicitly preview-placeholder allowed
8. timing validation passed or preview-only safe
9. QA/fallback blockers resolved
10. output GCS path selected by runtime region

## Region And Storage

The render worker should use the live GCP resource map:

- `us-east1` preview bucket: `reeditpro-prod-reeditpro-us-east1-previews`
- `us-east1` export bucket: `reeditpro-prod-reeditpro-us-east1-exports`
- `europe-west1` preview bucket: `reeditpro-prod-reeditpro-europe-west1-previews`
- `europe-west1` export bucket: `reeditpro-prod-reeditpro-europe-west1-exports`

Worker temp artifacts should use the selected region's worker-temp bucket.

## Future Cloud Run Job Shape

Future job name:

- `remotion-render-worker-job`

Future service account:

- `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com`

Future container image pattern:

```text
{region}-docker.pkg.dev/reeditpro/reeditpro-runtime/remotion-render-worker:{tag}
```

## Future Dockerfile Notes

A future Dockerfile may include Node, Remotion renderer dependencies, browser/Chromium dependencies required by Remotion, FFmpeg if required by the chosen Remotion render path, and a worker entrypoint.

Do not add the Dockerfile as executable production deployment until the rendering milestone that installs and validates Remotion.

## Mock Worker Output

The mock worker should return a render-ready plan/result that includes:

- render job ID
- output bucket purpose
- output object path
- timeline layer count
- required asset count
- placeholder asset count
- preflight status
- warnings
- events

No rendered file exists until a future real render milestone.

## Next Milestone

RP-RENDER-02 should add either:

1. a local Remotion dependency plan and minimal local test composition behind explicit flags, or
2. the Cloud Run Job container skeleton with no real render execution.

Do not proceed to real preview rendering until build/lint passes and the approved snapshot/render manifest mapping is validated.
