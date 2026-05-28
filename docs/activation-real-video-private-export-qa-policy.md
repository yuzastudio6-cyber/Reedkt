# Phase 30 Private Export QA Policy

Phase 30 emits these gates:

- `render_asset_integrity`
- `render_timeline_integrity`
- `export_codec_format`
- `export_duration_sync`
- `audio_sync`
- `caption_timing`
- `caption_readability`
- `final_delivery`

`final_delivery` can pass only for the private Phase 30 review export when a private `final_export` exists, duration matches the Phase 29 timeline within tolerance, audio status is documented, caption handling is documented, no blocking upstream QA exists, and no public delivery was created.

Caption timing/readability are warning-scoped when captions remain sidecar-only.
