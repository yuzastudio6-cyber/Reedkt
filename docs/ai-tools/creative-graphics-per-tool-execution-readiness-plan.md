# Creative Graphics Per-Tool Execution Readiness Plan

Status: `execution_plan_ready / execution_not_approved`

Every row is a future execution plan only. No generated/local fixture was executed.

| Tool ID | Static gate status | Candidate fixture status | Risk | Package/runtime requirements | Future command type | Expected future output artifacts | QA evidence required | Track A handoff | Worker/tool-call gate | First candidate? | Reason | Blocker | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `svg_js_vector_graphics` | `static_gate_passed_with_warnings` | prepared | low | vector runtime review | future placeholder command | SVG/vector manifest | dimensions, readability, alpha, safe zones | yes | yes | yes | static vector path is lowest risk | approval missing | GD-6 gate packet |
| `satori_social_cards` | `static_gate_passed_with_warnings` | prepared | low | card runtime review | future placeholder command | card manifest | typography, layout, dimensions | yes | yes | yes | card fixture is bounded and synthetic | approval missing | GD-6 gate packet |
| `resvg_js_svg_rasterization` | `static_gate_passed_with_warnings` | prepared | low | rasterization runtime review | future placeholder command | raster artifact manifest | dimensions, alpha, checksum | yes | yes | yes | raster target can validate artifact rules | approval missing | GD-6 gate packet |
| `d3_dataviz` | `static_gate_passed_with_warnings` | prepared | low | dataviz runtime review | future placeholder command | dataviz manifest | labels, data correctness, safe zones | yes | yes | yes | deterministic synthetic data fixture | approval missing | GD-6 gate packet |
| `echarts_dataviz` | `static_gate_passed_with_warnings` | prepared | low | chart runtime review | future placeholder command | chart manifest | data correctness, labels, readability | yes | yes | yes | deterministic synthetic chart fixture | approval missing | GD-6 gate packet |
| `vega_lite_dataviz` | `static_gate_passed_with_warnings` | prepared | low | Vega runtime review | future placeholder command | chart spec manifest | data correctness, spec validation, labels | yes | yes | yes | deterministic declarative chart fixture | approval missing | GD-6 gate packet |
| `viz_graphviz_diagrams` | `static_gate_passed_with_warnings` | prepared | low | diagram runtime review | future placeholder command | diagram manifest | graph correctness, label readability | yes | yes | yes | synthetic graph is bounded | approval missing | GD-6 gate packet |
| `anime_js_motion` | `static_gate_passed_with_warnings` | prepared | medium | motion timing runtime review | future placeholder command | motion manifest | timing, readability, safe zones | yes | yes | no | temporal QA is needed before first run | approval missing | GD-6 gate packet |
| `lottie_web_overlays` | `static_gate_passed_with_warnings` | prepared | medium | Lottie runtime review | future placeholder command | overlay manifest | alpha, timing, layer bounds | yes | yes | no | temporal/alpha checks add risk | approval missing | GD-6 gate packet |
| `remotion_graphics` | `static_gate_passed_with_warnings` | prepared | medium | Remotion runtime review | future placeholder command | preview manifest, overlay manifest | timing, alpha, safe zones | yes | yes | no | render-adjacent handoff must stay Track A-bound | approval missing | GD-6 gate packet |
| `pixijs_canvas_graphics` | `static_gate_passed_with_warnings` | prepared | high | canvas runtime review | future placeholder command | canvas manifest | dimensions, alpha, timing, safe zones | yes | yes | no | canvas runtime needs stronger fixture controls | approval missing | GD-6 gate packet |
| `three_js_visuals` | `static_gate_passed_with_warnings` | prepared | high | 3D runtime review | future placeholder command | 3D scene manifest | camera framing, dimensions, timing | yes | yes | no | 3D framing and runtime risk are higher | approval missing | GD-6 gate packet |

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
