# Diagram Graphics Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `diagram_graphics`.

- Input intent: diagram graphics planning
- Input media type: dot_graph, diagram_spec
- Desired output type: planning_metadata, diagram_plan
- Visual intent: plan graph and diagram output from DOT-like metadata
- Candidate tools: `viz_js`, `svgdotjs_svg_js`
- Preferred planning tools: `viz_js`
- Conditional planning tools: `svgdotjs_svg_js`
- Fallback planning tools: `svgdotjs_svg_js`
- Eliminated tools: `vega_lite`
- Required proof before execution: diagram output contract approval; artifact boundary approval
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
