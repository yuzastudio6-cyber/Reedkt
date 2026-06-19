# AI Graphics Draft Package Proof Blocked Use Register

Decision: `ai_graphics_draft_package_proof_promotion_review_passed_with_warnings`

Blocked uses remain unchanged:

- dependency install or package-lock mutation in this promotion-review PR
- import smoke or fixture reruns
- browser/WebGL/canvas runtime
- GPU runtime or model weight download
- tool, route, worker, provider/model execution
- Supabase mutation, SQL, GCS upload, signed URL creation, public artifact creation
- raw prompt execution
- internal beta, external beta, or production unlock

Track B tools remain excluded under `TRACK_B_MEDIA_OSS_STEWARD`. Track A render/export tools remain excluded under PR #544 owner context.
