# Chart Overlay Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `chart_overlay`.

- Input intent: chart overlay planning
- Input media type: structured_data, chart_spec
- Desired output type: planning_metadata, chart_overlay_plan
- Visual intent: overlay chart metadata on a future visual surface
- Candidate tools: `vega_lite`, `d3`, `echarts`, `vega`
- Preferred planning tools: `vega_lite`, `d3`
- Conditional planning tools: `echarts`
- Fallback planning tools: `vega`
- Eliminated tools: `three_js`, `sam2`, `real_esrgan`
- Required proof before execution: browser chart runtime approval for echarts; approved render/export lane before visual output
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
