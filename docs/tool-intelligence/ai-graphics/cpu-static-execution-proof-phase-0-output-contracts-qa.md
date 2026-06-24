# AI Graphics CPU Static Execution Proof Phase 0 Output Contracts QA

Decision: `ai_graphics_cpu_static_execution_proof_phase_0_qa_passed_with_warnings`

## Contract Acceptance

- `d3`: `checked`; Accepted as deterministic CPU/static proof with output contract checked and no product runtime unlocked.
- `vega_lite`: `checked`; Accepted as deterministic CPU/static proof with output contract checked and no product runtime unlocked.
- `vega`: `checked`; Accepted as deterministic CPU/static proof with output contract checked and no product runtime unlocked.
- `satori`: `blocked_contract_recorded`; Accepted as honest block because text SVG rendering requires an approved font fixture and no font asset was committed or fetched.
- `svgdotjs_svg_js`: `checked`; Accepted with existing jsdom Node DOM adapter; no browser runtime was unlocked.
- `viz_js`: `checked`; Accepted as deterministic CPU/static proof with output contract checked and no product runtime unlocked.

## Boundary

Output contract QA accepts deterministic local summaries only. It does not approve product artifacts, public artifacts, signed URLs, browser rendering, or runtime execution.
