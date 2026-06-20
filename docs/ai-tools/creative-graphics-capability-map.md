# Creative Graphics Capability Map

Status: `blocked at repo_audit stage`

## Capability Families

| Capability family | Owned tools | GD output shape | Not GD-owned |
| --- | --- | --- | --- |
| Motion graphics planning | Remotion, Anime.js, Lottie-web | Motion briefs, timing requirements, animation asset contracts, component-level graphic intent | Final render/export execution, worker dispatch |
| Exact data graphics | D3.js, Apache ECharts, Vega / Vega-Lite | Chart specs, diagram specs, safe label density, data source requirements | Raw data sourcing, claims validation, staging database mutation |
| 3D/2D creative graphics | Three.js, PixiJS | Scene contracts, asset requirements, frame-safe interaction plans | Browser capture, production rendering, media export |
| SVG and graph generation | SVG.js, Viz.js / Graphviz, Satori, @resvg/resvg-js | SVG/card/diagram/rasterization contracts and handoff notes | Production rasterization workers, final export, public artifacts |

## Capability State

- Planned: all 12 owned tools are identified.
- Registered: several tools have registry/profile evidence.
- Missing: a single AI Tools creative graphics manifest that normalizes capability IDs, inputs, outputs, ownership, QA gates, runtime boundary, and handoffs.
- Blocked: runtime unlock remains `blocked at repo_audit stage`.

## Safety Line

GD-0 does not create executable tool calls or production routes. All graphics capability entries remain planning and audit evidence only.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
