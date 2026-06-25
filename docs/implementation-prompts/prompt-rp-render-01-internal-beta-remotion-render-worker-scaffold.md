# RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD

Use this prompt only after `RP-ARTIFACTS-01-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-SCAFFOLD` is merged and validated.

Implement the next narrow internal beta milestone for a disabled Remotion render worker scaffold.

Requirements:

- Do not render video, render stills, execute Remotion, execute FFmpeg/FFprobe, create exports, create previews, create public artifacts, create signed URLs, or process private/user media.
- Do not run workers, providers, tools, route execution, Supabase remote mutations, SQL, Stripe/payment flows, or beta/production unlocks.
- Require approved snapshot, credit reservation, job queue runtime, artifact manifest, checksum, QA, cleanup, and private artifact policy before any future render worker can leave disabled mode.
- Keep frontend code from dispatching render workers or writing artifact manifests/storage/service-role state directly.

Expected conservative result if no explicit runtime approval is supplied:

- Decision: `completed_disabled_internal_beta_remotion_render_worker_scaffold_no_render_execution`
- Execution: `completed_fail_closed_render_worker_scaffold_no_preview_or_export`
- Render execution: `false`
- Preview/export artifact creation: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Internal beta end-to-end status: `not_ready`
