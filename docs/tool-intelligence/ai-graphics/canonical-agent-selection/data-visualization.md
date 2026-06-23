# Data Visualization Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `data_visualization`.

- Input intent: data visualization planning
- Input media type: structured_data, visualization_spec
- Desired output type: planning_metadata, visualization_spec_plan
- Visual intent: choose a data visualization specification path
- Candidate tools: `vega_lite`, `vega`, `d3`, `echarts`
- Preferred planning tools: `vega_lite`, `vega`, `d3`
- Conditional planning tools: `echarts`
- Fallback planning tools: `d3`
- Eliminated tools: `sam2`, `real_esrgan`
- Required proof before execution: runtime approval for browser chart execution; artifact approval before output
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
