# AI Graphics Draft Package Proof QA Blocked Use Register

Decision: `ai_graphics_draft_package_proof_promotion_qa_passed_with_warnings`

Blocked in this QA lane:

- Dependency install and `npm ci`.
- Package-lock mutation.
- Import smoke rerun.
- Synthetic or manifest fixture rerun.
- Tool, worker, route, provider/model, browser/WebGL/canvas, GPU, model-weight, media, Remotion, and resvg runtime.
- Supabase mutation, SQL execution, GCS upload, signed URL creation, and public artifact creation.
- Raw prompt execution.
- Internal beta, external beta, and production unlock.
- Canonical promotion before source proof merge.
