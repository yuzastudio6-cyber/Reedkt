# Track B External Registry Expansion Report

## Summary

This milestone promotes four Track B external tools into first-class Reeditpro planning metadata: `mediainfo`, `exiftool`, `tesseract`, and `imagemagick`.

The promotion is registry and planning metadata only. It does not execute tools, add probes, process media, dispatch workers, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta/production, or mutate `package-lock.json`.

## Promoted ProductionToolId Entries

- `mediainfo`: metadata and export QA corroboration planning.
- `exiftool`: image/camera/orientation metadata planning.
- `tesseract`: CPU OCR fallback and text-overlap planning.
- `imagemagick`: still-image conversion, thumbnail fallback, and simple transform planning.

All four profiles are non-launch-core, `future` status, and `planning_only` worker metadata. They are first-class IDs for planning and adapter coverage, not execution readiness.

## Evidence Boundary

Source evidence is recorded on the study cards from the canonical `server/tool-registry` profile plus prior Track B PR evidence:

- `github:pr/542`: Track B media OSS owner registry and ownership lane.
- `github:pr/545`: Track B install/proof plan approving future low-risk validation work for MediaInfo, ExifTool, Tesseract, and ImageMagick/GraphicsMagick.
- `github:pr/619`: first-class coverage expansion that intentionally deferred these tools to this dedicated Track B registry-planning milestone.

If owner evidence changes, future execution milestones must rerun the refresh gate and update source evidence before enabling probes.

## GraphicsMagick Boundary

GraphicsMagick is not promoted as a separate first-class `ProductionToolId` in this milestone.

- `imagemagick_graphicsmagick` resolves to `imagemagick` for the accepted ImageMagick planning profile.
- Bare `graphicsmagick` remains `pending_production_tool_registry_expansion`.
- `graphicsMagickCounted: false` is reported by diagnostics.

GraphicsMagick needs separate owner proof and registry acceptance before it can become a runtime ID.

## No Duplicate Systems

The milestone extends existing systems only:

- `server/tool-registry` remains the canonical production tool registry.
- QA policy continues to live in `server/tool-registry/tool-qa-policy.ts`.
- Fallback policy continues to live in `server/tool-registry/tool-fallback-policy.ts`.
- Adapter contracts are generated from first-class registry IDs and capability cards.
- Worker router, execution adapters, safe command execution, fixture/probe layers, Supabase tables, SQL, and migrations are not duplicated or modified.

## Next Recommendation

Next milestone: `REEDITPRO-TOOL-CALLING-TRACKB-EXTERNAL-CONTROLLED-PROBES-1`, only after refresh-gate, owner evidence, installation proof, and fixture/probe policy are all current.
