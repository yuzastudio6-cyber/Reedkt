# AI Graphics CPU Static Spec Validation Refreshed Output Contract

Decision: `ai_graphics_cpu_static_spec_validation_refreshed_execution_passed_with_warnings`

The output contract for this lane is sanitized JSON metadata only. Detailed evidence is local and ignored under `.local-artifacts/`.

Allowed committed outputs:

- Source lockfile Markdown/JSON.
- Matrix Markdown/JSON.
- Result Markdown/JSON.
- Six per-tool Markdown summaries.
- Output-contract and blocked-use docs.
- Prompt and implementation records.

Disallowed outputs:

- Browser screenshots.
- SVG, canvas, WebGL, raster, video, PDF, Remotion, resvg, or public artifact outputs.
- Signed URLs or GCS/Supabase storage references.
- Raw prompt execution outputs.
