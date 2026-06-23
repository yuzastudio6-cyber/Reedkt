# Tensor Image Ops Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `tensor_image_ops`.

- Input intent: tensor image operation planning
- Input media type: tensor_metadata, image_metadata
- Desired output type: planning_metadata, tensor_ops_plan
- Visual intent: plan deterministic tensor/image transform path
- Candidate tools: `kornia`
- Preferred planning tools: `kornia`
- Conditional planning tools: none
- Fallback planning tools: `kornia`
- Eliminated tools: `echarts`, `lottie_web`
- Required proof before execution: CPU import proof; operation boundary approval
- Execution allowed now: false
- Route execution allowed now: false
- Worker execution allowed now: false
- Browser/WebGL/canvas allowed now: false
- GPU/model runtime allowed now: false
- Public artifact allowed now: false
- Signed URL allowed now: false
- Runtime ready now: false
- Internal beta ready now: false
- Production ready now: false
