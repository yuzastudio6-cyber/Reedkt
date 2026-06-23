# Subject Segmentation Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `subject_segmentation`.

- Input intent: subject segmentation planning
- Input media type: image_metadata
- Desired output type: planning_metadata, segmentation_plan
- Visual intent: select possible subject segmentation path
- Candidate tools: `sam2`, `birefnet`
- Preferred planning tools: `sam2`, `birefnet`
- Conditional planning tools: none
- Fallback planning tools: `birefnet`
- Eliminated tools: `vega_lite`, `real_esrgan`
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
