# AI Graphics CPU Static Execution Proof Phase 0 Tool Results QA

Decision: `ai_graphics_cpu_static_execution_proof_phase_0_qa_passed_with_warnings`

## Result Matrix

| Tool | Expected status | Observed status | QA result |
| --- | --- | --- | --- |
| `d3` | `proof_passed` | `proof_passed` | `accepted_proof_passed` |
| `vega_lite` | `proof_passed` | `proof_passed` | `accepted_proof_passed` |
| `vega` | `proof_passed` | `proof_passed` | `accepted_proof_passed` |
| `satori` | `proof_blocked_missing_runtime` | `proof_blocked_missing_runtime` | `accepted_blocked_missing_runtime_pending_approved_font_fixture` |
| `svgdotjs_svg_js` | `proof_passed` | `proof_passed` | `accepted_proof_passed` |
| `viz_js` | `proof_passed` | `proof_passed` | `accepted_proof_passed` |

## Notes

- `svgdotjs_svg_js` proof is accepted because it uses the existing `jsdom` Node DOM adapter for static shape construction; no browser runtime is unlocked.
- `satori` proof is accepted as blocked because an approved deterministic font fixture is required before text SVG layout proof can honestly pass.
