# AI_TOOLS_CREATIVE_GRAPHICS Batch 1 Allowed And Blocked Scope

Decision: `blocked_pending_package_lock_base_fix`

## Allowed In This Packet

- Docs and static diagnostics.
- Source evidence review from PR #416 and PR #417.
- Batch 1 selection planning.
- Package-lock blocker review.
- Future command and validation planning.

## Blocked In This Packet

- dependency install
- package-lock mutation
- import smoke execution
- synthetic fixture execution
- E2E proof execution
- tool execution
- route execution
- worker execution
- provider/model calls
- browser/WebGL runtime
- Lottie player/browser runtime
- Remotion render/export
- resvg rasterization
- media/audio processing
- Supabase mutation
- SQL execution
- GCS upload/storage transfer
- signed URL creation
- public artifact creation
- raw prompt execution
- internal beta, external beta, and production unlock

Signed URLs remain non-source-of-truth.
