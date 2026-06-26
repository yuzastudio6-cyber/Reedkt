# AI Graphics Beta Evidence Bundle

Decision: `ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults`

This record answers the practical install question for the 21 AI graphics tools:
which tools are installed or represented for their intended ReeditPro surface,
and which tools still lack the evidence required before beta tool calls.

## Current Answer

- Tools in this lane: 21.
- Installed or represented for the planned ReeditPro surface: 21.
- Mapped to production registry tool IDs: 21.
- Selectable by the agent for planning/study metadata: 21.
- Beta-ready with no supplied evidence bundle: 0.
- Blocked with no supplied evidence bundle: 21.
- Beta-eligible when every required proof packet and evidence gate is supplied: 21.

## Required Evidence Bundle

The validator stays fail-closed until all of these are supplied:

- Node runtime proof packet for the 13 JS graphics tools.
- Browser runtime proof packet for the seven browser/player/canvas/WebGL tools.
- Satori font runtime proof packet.
- Approved plan snapshot gate.
- Credit reservation gate.
- Artifact boundary gate.
- Tool Route gate.
- Worker gate.
- Browser/canvas/WebGL sandbox proof.
- Native NVIDIA L4 GPU runtime proof packet.
- Reviewed private model-weight manifest packet.
- Internal beta owner approval.

Legacy boolean override flags for GPU proof or model-weight manifests are ignored
by this bundle. They may be useful in lower-level simulation diagnostics, but
they do not satisfy all-21 beta evidence.

## Tool Groups

The 13 JavaScript graphics tools are installed through the Node lockfile surface:
`d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`,
`lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

The eight ML/GPU tools are represented by GPU worker install targets and must
remain GPU-runtime targeted: `torch_torchvision`, `transformers`, `sam2`,
`birefnet`, `real_esrgan`, `kornia`, `rembg`, and
`transparent_background`.

## No Runtime Unlock

The bundle validator does not install dependencies, mutate `package-lock.json`,
execute tools, run Tool Routes, run Workers, call providers/models, run
browser/WebGL/canvas runtime, run GPU runtime, download or load model weights,
process media, mutate Supabase, upload to GCS, create signed URLs, create public
artifacts, unlock internal beta, unlock external beta, or unlock production.
