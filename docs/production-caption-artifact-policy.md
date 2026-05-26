# Production Caption Artifact Policy

Milestone 7 prepares caption segments and caption file text for future preview/render workers. Caption files remain private until an approved preview or export path uses them.

## Supported Caption Outputs

- caption segment JSON
- SRT text
- WebVTT text
- ASS text with controlled style presets
- caption QA report artifacts

## Storage Policy

Caption artifacts use private storage references, not signed URLs. Local-dev writes are allowed only under an explicit safe temp/storage root. Source media is never overwritten.

## Render Boundary

ASS/libass support is prepared for future render/preview use. Milestone 7 does not perform final burn-in or final export. Revideo remains evaluation-only and is not used.
