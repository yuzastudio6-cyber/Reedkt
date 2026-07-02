# Production Final Render Artifact Policy

M16A writes private `render_manifest`, optional `preview_video`, optional `final_export`, and `qa_report` artifacts.

`final_export` artifacts use the `final_exports` bucket purpose, are `sourceOfTruth: true`, and remain private until a later delivery/share policy explicitly creates a share path. Signed URLs are never persisted as source of truth.

Source/proxy/media artifacts must never be overwritten by preview or final export outputs.
