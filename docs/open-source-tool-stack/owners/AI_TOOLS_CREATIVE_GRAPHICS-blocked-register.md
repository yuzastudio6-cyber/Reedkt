# AI_TOOLS_CREATIVE_GRAPHICS Blocked Register

Decision: `owner_tool_stack_audit_completed_ready_for_install_proof_approval`

Blocked scopes remain:

- dependency mutation
- tool execution
- route execution
- worker execution
- provider/model calls
- model-weight download
- model execution
- media/audio processing
- render/export
- browser capture
- map rendering
- Supabase mutation
- SQL execution
- GCS upload or storage transfer
- signed URL creation
- signed URLs as source-of-truth
- public artifact creation
- raw prompt execution
- internal beta, external beta, and production unlock

Owner-specific blockers:

- GPU/model tools require model-weight, download/cache, and runtime boundaries before proof.
- Dataviz tools require package selection and deterministic synthetic fixture approval before proof.
- Browser/canvas/WebGL tools require a browser/runtime boundary before proof.
- Lottie remains manifest-only until player/browser behavior is approved.
- Remotion and Revideo are Track A handoffs, not AI_TOOLS_CREATIVE_GRAPHICS execution approvals.
