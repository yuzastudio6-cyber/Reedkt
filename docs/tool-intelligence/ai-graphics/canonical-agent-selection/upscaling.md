# Upscaling Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `upscaling`.

- Input intent: image upscaling planning
- Input media type: image_metadata
- Desired output type: planning_metadata, upscaling_plan
- Visual intent: select possible image enhancement path
- Candidate tools: `real_esrgan`
- Preferred planning tools: `real_esrgan`
- Conditional planning tools: none
- Fallback planning tools: `real_esrgan`
- Eliminated tools: `vega_lite`, `d3`
- Required proof before execution: model/GPU/provenance proof; model boundary approval
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
