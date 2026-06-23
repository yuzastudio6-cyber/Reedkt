# Animation Overlay Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `animation_overlay`.

- Input intent: animation overlay planning
- Input media type: animation_manifest, timeline_metadata
- Desired output type: planning_metadata, animation_timeline_plan
- Visual intent: plan animation manifest or timeline metadata
- Candidate tools: `lottie_web`, `animejs`
- Preferred planning tools: `lottie_web`, `animejs`
- Conditional planning tools: none
- Fallback planning tools: `animejs`
- Eliminated tools: `real_esrgan`, `sam2`
- Required proof before execution: animation manifest/runtime approval
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
