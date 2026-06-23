# Svg Graphics Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `svg_graphics`.

- Input intent: SVG/static graphics planning
- Input media type: svg_manifest, layout_manifest
- Desired output type: planning_metadata, svg_graphic_plan
- Visual intent: plan explicit SVG or JSX-like static graphics
- Candidate tools: `svgdotjs_svg_js`, `satori`, `d3`
- Preferred planning tools: `svgdotjs_svg_js`, `satori`
- Conditional planning tools: `d3`
- Fallback planning tools: `d3`
- Eliminated tools: `sam2`, `real_esrgan`
- Required proof before execution: static SVG output contract approval; public artifact boundary approval
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
