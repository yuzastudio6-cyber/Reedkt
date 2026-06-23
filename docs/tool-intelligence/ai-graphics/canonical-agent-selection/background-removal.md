# Background Removal Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `background_removal`.

- Input intent: background removal planning
- Input media type: image_metadata
- Desired output type: planning_metadata, background_removal_plan
- Visual intent: select possible background or subject extraction path
- Candidate tools: `sam2`, `birefnet`, `rembg`, `transparent_background`
- Preferred planning tools: `sam2`, `birefnet`
- Conditional planning tools: `rembg`, `transparent_background`
- Fallback planning tools: `rembg`, `transparent_background`
- Eliminated tools: `vega_lite`, `d3`
- Required proof before execution: model/import/provenance proof; model boundary approval
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
